import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import models from '../models/index.js';
import { getS3Client, getS3Config } from '../config/s3.js';
import { UPLOAD_PURPOSES } from './uploadService.js';
import { AppError } from '../utils/AppError.js';

const { Chapter, ClassModel, Course, CourseMaterial, Enrollment, Lesson } = models;
const MAX_MATERIAL_SIZE = UPLOAD_PURPOSES['course-material'].maxSize;
const MATERIAL_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip'
};
const DOWNLOAD_URL_EXPIRES_IN = 300;

const getLessonWithCourse = async (lessonId) => {
  const lesson = await Lesson.findByPk(lessonId, {
    include: [{
      model: Chapter,
      include: [{ model: Course, attributes: ['id', 'owner_id', 'status'] }]
    }]
  });

  if (!lesson) {
    throw new AppError('Không tìm thấy bài học', 404, 'Not Found');
  }
  if (!lesson.chapter?.course) {
    throw new AppError('Không tìm thấy khóa học của bài học', 404, 'Not Found');
  }

  return lesson;
};

const requireLessonReadAccess = async (lesson, currentUser) => {
  const course = lesson.chapter.course;
  if (currentUser.role === 'admin' || currentUser.role === 'training_manager') return;
  if (currentUser.role === 'teacher' && course.owner_id === currentUser.id) return;

  if (currentUser.role === 'student' && course.status === 'published') {
    const enrollment = await Enrollment.findOne({
      include: [{
        model: ClassModel,
        as: 'class',
        where: { course_id: course.id },
        attributes: []
      }],
      where: { student_id: currentUser.id, status: 'active' }
    });
    if (enrollment) return;
  }

  throw new AppError('Bạn không có quyền truy cập tài liệu của bài học này', 403, 'Forbidden');
};

const requireLessonWriteAccess = (lesson, currentUser) => {
  const course = lesson.chapter.course;
  if (currentUser.role !== 'admin' && course.owner_id !== currentUser.id) {
    throw new AppError('Bạn không có quyền chỉnh sửa tài liệu của bài học này', 403, 'Forbidden');
  }
};

const serializeMaterial = (material) => ({
  id: material.id,
  lessonId: material.lesson_id,
  title: material.title,
  fileName: material.file_name,
  fileType: material.file_type,
  fileSize: Number(material.file_size),
  createdAt: material.created_at,
  updatedAt: material.updated_at
});

export const getLessonMaterials = async (lessonId, currentUser) => {
  const lesson = await getLessonWithCourse(lessonId);
  await requireLessonReadAccess(lesson, currentUser);

  const materials = await CourseMaterial.findAll({
    where: { lesson_id: lesson.id },
    order: [['created_at', 'ASC']]
  });
  return {
    items: materials.map(serializeMaterial),
    total: materials.length
  };
};

export const createLessonMaterial = async (lessonId, data, currentUser) => {
  const lesson = await getLessonWithCourse(lessonId);
  requireLessonWriteAccess(lesson, currentUser);

  const extension = data.fileName.split('.').pop()?.toLowerCase();
  const expectedContentType = MATERIAL_TYPES[extension];
  if (!expectedContentType || data.fileSize > MAX_MATERIAL_SIZE) {
    throw new AppError('Định dạng hoặc dung lượng tài liệu không được hỗ trợ', 400, 'Bad Request');
  }

  const expectedKeyPrefix = `course-materials/${currentUser.id}/`;
  if (!data.fileKey.startsWith(expectedKeyPrefix) || data.fileKey.slice(expectedKeyPrefix.length).includes('/')) {
    throw new AppError('Tệp tải lên không thuộc tài khoản hiện tại', 400, 'Bad Request');
  }

  const { bucket } = getS3Config();
  const head = await getS3Client().send(new HeadObjectCommand({
    Bucket: bucket,
    Key: data.fileKey
  }));
  if (Number(head.ContentLength) !== data.fileSize || head.ContentType !== expectedContentType) {
    throw new AppError('Thông tin tệp không khớp với nội dung đã tải lên', 400, 'Bad Request');
  }

  const material = await CourseMaterial.create({
    lesson_id: lesson.id,
    title: data.title.trim(),
    file_url: data.fileKey,
    file_name: data.fileName,
    file_type: extension,
    file_size: head.ContentLength
  });
  return serializeMaterial(material);
};

const getMaterialForLesson = async (lessonId, materialId) => {
  const material = await CourseMaterial.findOne({
    where: { id: materialId, lesson_id: lessonId }
  });
  if (!material) {
    throw new AppError('Không tìm thấy tài liệu trong bài học này', 404, 'Not Found');
  }
  return material;
};

export const updateLessonMaterial = async (lessonId, materialId, title, currentUser) => {
  const lesson = await getLessonWithCourse(lessonId);
  requireLessonWriteAccess(lesson, currentUser);
  const material = await getMaterialForLesson(lesson.id, materialId);
  material.title = title.trim();
  await material.save();
  return serializeMaterial(material);
};

export const deleteLessonMaterial = async (lessonId, materialId, currentUser) => {
  const lesson = await getLessonWithCourse(lessonId);
  requireLessonWriteAccess(lesson, currentUser);
  const material = await getMaterialForLesson(lesson.id, materialId);
  const { bucket } = getS3Config();

  try {
    await getS3Client().send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: material.file_url
    }));
  } catch (error) {
    if (error.name === 'AccessDenied' || error.$metadata?.httpStatusCode === 403) {
      throw new AppError('AWS IAM chưa được cấp quyền s3:DeleteObject cho bucket tài liệu', 403, 'Forbidden');
    }
    throw error;
  }

  await material.destroy();
};

export const getLessonMaterialDownloadUrl = async (lessonId, materialId, currentUser) => {
  const lesson = await getLessonWithCourse(lessonId);
  await requireLessonReadAccess(lesson, currentUser);
  const material = await getMaterialForLesson(lesson.id, materialId);
  const { bucket } = getS3Config();
  const downloadUrl = await getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: bucket,
      Key: material.file_url,
      ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(material.file_name)}`
    }),
    { expiresIn: DOWNLOAD_URL_EXPIRES_IN }
  );

  return { downloadUrl, expiresInSeconds: DOWNLOAD_URL_EXPIRES_IN };
};

export default {
  getLessonMaterials,
  createLessonMaterial,
  updateLessonMaterial,
  deleteLessonMaterial,
  getLessonMaterialDownloadUrl
};
