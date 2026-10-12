import crypto from 'crypto';
import path from 'path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import models from '../models/index.js';
import { getS3Client, getS3Config } from '../config/s3.js';
import { AppError } from '../utils/AppError.js';
import { assertCourseEditable } from './courseService.js';
import { assertCanManageLesson } from './lessonService.js';

const { Course } = models;

const MB = 1024 * 1024;
export const UPLOAD_URL_EXPIRES_IN = 15 * 60;

// MIME hợp lệ theo phần mở rộng. Phần tử đầu là MIME chuẩn frontend nên gửi.
// zip/rar có nhiều MIME vì mỗi hệ điều hành/trình duyệt báo khác nhau.
export const MIME_BY_EXTENSION = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  zip: ['application/zip', 'application/x-zip-compressed'],
  rar: ['application/vnd.rar', 'application/x-rar-compressed'],
  // Thêm cho bài nộp (assignments.allowed_file_types do GV tự cấu hình)
  doc: ['application/msword'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ppt: ['application/vnd.ms-powerpoint'],
  txt: ['text/plain'],
  csv: ['text/csv'],
  '7z': ['application/x-7z-compressed']
};

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
export const MATERIAL_EXTENSIONS = ['pdf', 'docx', 'pptx', 'zip', 'rar'];
export const MATERIAL_MAX_SIZE = 50 * MB;
export const MATERIAL_KEY_PREFIX = 'private/materials';

/**
 * Ràng buộc theo mục đích upload (api-uploads.md - mục 2).
 * `lesson_video` chưa mở vì còn thiếu API phát video (GET /lessons/:lessonId/video-stream-url).
 */
export const UPLOAD_PURPOSES = {
  avatar: { isPublic: true, extensions: IMAGE_EXTENSIONS, maxSize: 2 * MB },
  course_thumbnail: { isPublic: true, extensions: IMAGE_EXTENSIONS, maxSize: 5 * MB },
  lesson_material: { isPublic: false, extensions: MATERIAL_EXTENSIONS, maxSize: MATERIAL_MAX_SIZE }
};

export const getFileExtension = (fileName) => path.extname(fileName).slice(1).toLowerCase();

// Chỉ giữ ký tự an toàn trong tên tệp để S3 key không chứa '/', '..' hay ký tự lạ
export const sanitizeFileName = (fileName) => {
  const ext = getFileExtension(fileName).replace(/[^a-z0-9]/g, '');
  const base = path
    .basename(fileName, path.extname(fileName))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return ext ? `${base || 'file'}.${ext}` : base || 'file';
};

export const materialKeyPrefix = (courseId, lessonId) => `${MATERIAL_KEY_PREFIX}/${courseId}/${lessonId}/`;

/**
 * Kiểm tra quyền theo purpose và trả về S3 key sẽ dùng
 */
const resolveObjectKey = async (purpose, { contextId, fileName }, currentUser) => {
  const ext = getFileExtension(fileName);
  const timestamp = Date.now();

  if (purpose === 'avatar') {
    return `public/avatars/${currentUser.id}_${timestamp}.${ext}`;
  }

  if (!contextId) {
    throw new AppError('Thiếu contextId cho mục đích này', 400, 'Bad Request');
  }

  if (purpose === 'course_thumbnail') {
    if (!['teacher', 'admin'].includes(currentUser.role)) {
      throw new AppError('Không có quyền tải tài nguyên lên khóa học này', 403, 'Forbidden');
    }
    const course = await Course.findByPk(contextId, { attributes: ['id', 'owner_id', 'status'] });
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
    }
    if (course.owner_id !== currentUser.id && currentUser.role !== 'admin') {
      throw new AppError('Không có quyền tải tài nguyên lên khóa học này', 403, 'Forbidden');
    }
    assertCourseEditable(course);
    return `public/thumbnails/${course.id}_${timestamp}.${ext}`;
  }

  // lesson_material: chủ khóa học/Admin, khóa học đang draft/rejected
  if (!['teacher', 'admin'].includes(currentUser.role)) {
    throw new AppError('Không có quyền tải tài nguyên lên khóa học này', 403, 'Forbidden');
  }
  const lesson = await assertCanManageLesson(contextId, currentUser);
  const prefix = materialKeyPrefix(lesson.chapter.course.id, lesson.id);
  return `${prefix}${crypto.randomUUID()}_${sanitizeFileName(fileName)}`;
};

/**
 * Ký Presigned PUT URL. Content-Type và Content-Length được ký cùng URL nên client không đổi được loại/kích thước tệp.
 */
export const createSignedPutUrl = async ({ key, contentType, fileSize }) => {
  const { bucket } = getS3Config();
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ContentLength: fileSize });
  return getSignedUrl(getS3Client(), command, { expiresIn: UPLOAD_URL_EXPIRES_IN });
};

/**
 * MIME hợp lệ cho đuôi tệp: đuôi có trong bảng phải khớp; đuôi lạ (GV tự cho phép) chỉ nhận application/octet-stream
 */
export const isMimeAllowed = (ext, contentType) =>
  (MIME_BY_EXTENSION[ext] ? MIME_BY_EXTENSION[ext].includes(contentType) : contentType === 'application/octet-stream');

/**
 * POST /uploads/presigned-url
 * Content-Type và Content-Length được ký cùng URL nên client không đổi được loại/kích thước tệp khi PUT.
 */
export const createPresignedUrl = async (data, currentUser) => {
  const { purpose, fileName, fileSize, contentType } = data;
  const rule = UPLOAD_PURPOSES[purpose];
  if (!rule) {
    throw new AppError('Mục đích tải tệp không hợp lệ', 400, 'Bad Request');
  }

  const ext = getFileExtension(fileName);
  if (!rule.extensions.includes(ext) || !MIME_BY_EXTENSION[ext].includes(contentType)) {
    throw new AppError('Định dạng tệp không được hỗ trợ', 400, 'Bad Request');
  }
  if (fileSize > rule.maxSize) {
    throw new AppError(`Dung lượng tệp vượt quá giới hạn cho phép (tối đa ${rule.maxSize / MB}MB)`, 400, 'Bad Request');
  }

  // Kiểm tra cấu hình S3 trước khi truy vấn CSDL
  const { publicBaseUrl } = getS3Config();
  const fileKey = await resolveObjectKey(purpose, data, currentUser);

  const uploadUrl = await createSignedPutUrl({ key: fileKey, contentType, fileSize });

  return {
    uploadUrl,
    fileKey,
    publicUrl: rule.isPublic ? `${publicBaseUrl}/${fileKey}` : null,
    isPublic: rule.isPublic,
    expiresInSeconds: UPLOAD_URL_EXPIRES_IN
  };
};

export default { createPresignedUrl };
