import crypto from 'crypto';
import path from 'path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getS3Config } from '../config/s3.js';
import { AppError } from '../utils/AppError.js';

const MB = 1024 * 1024;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip'
];

/**
 * Quy tắc upload theo mục đích sử dụng.
 * Muốn thêm loại upload mới chỉ cần thêm một mục vào đây (và vào Joi.valid trong uploadValidation.js).
 */
export const UPLOAD_PURPOSES = {
  'course-thumbnail': {
    folder: 'course-thumbnails',
    roles: ['teacher', 'admin'],
    allowedTypes: IMAGE_TYPES,
    maxSize: 5 * MB
  },
  'lesson-video': {
    folder: 'lesson-videos',
    roles: ['teacher', 'admin'],
    allowedTypes: ['video/mp4', 'video/webm'],
    maxSize: 500 * MB
  },
  'course-material': {
    folder: 'course-materials',
    roles: ['teacher', 'admin'],
    allowedTypes: DOCUMENT_TYPES,
    maxSize: 50 * MB
  },
  'assignment-submission': {
    folder: 'assignment-submissions',
    roles: ['student'],
    allowedTypes: [...DOCUMENT_TYPES, ...IMAGE_TYPES],
    maxSize: 20 * MB
  }
};

// Chỉ giữ ký tự an toàn trong tên file để tránh path traversal hoặc ký tự lạ trong S3 key
const sanitizeFileName = (fileName) => {
  const ext = path.extname(fileName).toLowerCase().replace(/[^.a-z0-9]/g, '');
  const base = path
    .basename(fileName, path.extname(fileName))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'file'}${ext}`;
};

/**
 * Tạo presigned URL để client upload trực tiếp lên S3 bằng HTTP PUT.
 * Content-Type và Content-Length được ký cùng URL nên client không thể đổi loại/kích thước file.
 */
export const createPresignedUpload = async ({ purpose, fileName, contentType, fileSize }, user) => {
  const rule = UPLOAD_PURPOSES[purpose];
  if (!rule) {
    throw new AppError('Mục đích upload không hợp lệ', 400, 'Bad Request');
  }

  if (!rule.roles.includes(user.role)) {
    throw new AppError('Bạn không có quyền upload loại tệp này', 403, 'Forbidden');
  }

  if (!rule.allowedTypes.includes(contentType)) {
    throw new AppError(`Định dạng tệp không được hỗ trợ (${contentType})`, 400, 'Bad Request');
  }

  if (fileSize > rule.maxSize) {
    throw new AppError(`Tệp vượt quá dung lượng cho phép (tối đa ${Math.round(rule.maxSize / MB)}MB)`, 400, 'Bad Request');
  }

  const { bucket, publicBaseUrl, uploadUrlExpiresIn } = getS3Config();
  const key = `${rule.folder}/${user.id}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSize
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: uploadUrlExpiresIn });

  return {
    uploadUrl,
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    key,
    fileUrl: `${publicBaseUrl}/${key}`,
    expiresIn: uploadUrlExpiresIn
  };
};

export default { createPresignedUpload, UPLOAD_PURPOSES };
