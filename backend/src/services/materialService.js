import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { assertCanManageLesson, assertCanViewLessonContent, findLessonWithCourse } from './lessonService.js';
import { getFileExtension, materialKeyPrefix, sanitizeFileName } from './uploadService.js';
import { checkObjectMetadata, deleteStorageObject, createDownloadGetUrl, DOWNLOAD_URL_EXPIRES_IN } from './storageService.js';

const { CourseMaterial } = models;


const mapMaterial = (material) => ({
  id: material.id,
  lessonId: material.lesson_id,
  title: material.title,
  fileName: material.file_name,
  fileType: material.file_type,
  fileSize: Number(material.file_size),
  createdAt: material.created_at,
  updatedAt: material.updated_at
});

const findMaterialOfLesson = async (lessonId, materialId) => {
  const material = await CourseMaterial.findOne({ where: { id: materialId, lesson_id: lessonId } });
  if (!material) {
    throw new AppError('Không tìm thấy tài liệu', 404, 'Not Found');
  }
  return material;
};

export const headObject = async (bucket, key) => checkObjectMetadata(key);

/**
 * GET /lessons/:lessonId/materials
 * Quyền xem giống nội dung bài học: chủ khóa, Quản lý, Admin, giảng viên dạy lớp, học viên đã ghi danh.
 */
export const getMaterials = async (lessonId, currentUser) => {
  const lesson = await findLessonWithCourse(lessonId);
  await assertCanViewLessonContent(lesson.chapter.course, currentUser);

  const materials = await CourseMaterial.findAll({
    where: { lesson_id: lesson.id },
    order: [['created_at', 'ASC']]
  });

  return { items: materials.map(mapMaterial), total: materials.length };
};

/**
 * POST /lessons/:lessonId/materials - gắn tệp đã upload lên S3 vào bài học
 */
export const createMaterial = async (lessonId, data, currentUser) => {
  const lesson = await assertCanManageLesson(lessonId, currentUser);
  const { title, fileName, fileKey, fileType, fileSize } = data;

  // Tệp phải nằm đúng thư mục của bài học này (key do API presigned-url sinh ra)
  const prefix = materialKeyPrefix(lesson.chapter.course.id, lesson.id);
  const keyName = fileKey.startsWith(prefix) ? fileKey.slice(prefix.length) : '';
  if (!keyName || keyName.includes('/')) {
    throw new AppError('Tệp tải lên không thuộc bài học này', 400, 'Bad Request');
  }
  if (getFileExtension(fileName) !== fileType || getFileExtension(keyName) !== fileType) {
    throw new AppError('Loại tệp (fileType) không khớp với tên tệp', 400, 'Bad Request');
  }

  const linked = await CourseMaterial.count({ where: { file_url: fileKey } });
  if (linked > 0) {
    throw new AppError('Tệp này đã được gắn vào bài học', 409, 'Conflict');
  }

  const head = await checkObjectMetadata(fileKey);
  if (!head) {
    throw new AppError('Tệp chưa được tải lên máy chủ lưu trữ', 400, 'Bad Request');
  }
  if (Number(head.ContentLength) !== fileSize) {
    throw new AppError('Dung lượng tệp không khớp với tệp đã tải lên', 400, 'Bad Request');
  }

  const material = await CourseMaterial.create({
    lesson_id: lesson.id,
    title,
    file_url: fileKey,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize
  });

  return mapMaterial(material);
};

/**
 * PATCH /lessons/:lessonId/materials/:materialId - đổi tiêu đề hiển thị
 */
export const updateMaterial = async (lessonId, materialId, { title }, currentUser) => {
  const lesson = await assertCanManageLesson(lessonId, currentUser);
  const material = await findMaterialOfLesson(lesson.id, materialId);

  material.title = title;
  await material.save();

  return mapMaterial(material);
};

/**
 * DELETE /lessons/:lessonId/materials/:materialId
 * Xóa bản ghi trước, sau đó xóa tệp S3. Lỗi xóa S3 chỉ ghi log (tệp mồ côi được dọn sau),
 * không để học viên còn thấy tài liệu trỏ tới tệp đã mất.
 */
export const deleteMaterial = async (lessonId, materialId, currentUser) => {
  const lesson = await assertCanManageLesson(lessonId, currentUser);
  const material = await findMaterialOfLesson(lesson.id, materialId);
  await material.destroy();
  await deleteStorageObject(material.file_url);
  return true;
};

/**
 * GET /lessons/:lessonId/materials/:materialId/download-url
 * Presigned GET URL 30 phút, tải về đúng tên tệp gốc.
 */
export const getDownloadUrl = async (lessonId, materialId, currentUser) => {
  const lesson = await findLessonWithCourse(lessonId);
  await assertCanViewLessonContent(lesson.chapter.course, currentUser);
  const material = await findMaterialOfLesson(lesson.id, materialId);
  const downloadUrl = await createDownloadGetUrl(material.file_url, material.file_name);

  return {
    downloadUrl,
    fileName: material.file_name,
    fileType: material.file_type,
    fileSize: Number(material.file_size),
    expiresInSeconds: DOWNLOAD_URL_EXPIRES_IN
  };
};

export default { getMaterials, createMaterial, updateMaterial, deleteMaterial, getDownloadUrl };
