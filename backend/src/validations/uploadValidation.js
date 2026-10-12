import Joi from 'joi';

/**
 * 1. Xin Presigned PUT URL (POST /uploads/presigned-url)
 * Ràng buộc định dạng/dung lượng chi tiết theo purpose nằm ở uploadService (UPLOAD_PURPOSES).
 */
export const presignedUrlSchema = Joi.object({
  purpose: Joi.string().valid('avatar', 'course_thumbnail', 'lesson_material').required().messages({
    'any.only': 'Mục đích tải tệp (purpose) phải là avatar, course_thumbnail hoặc lesson_material',
    'string.empty': 'Mục đích tải tệp (purpose) không được để trống',
    'any.required': 'Mục đích tải tệp (purpose) là trường bắt buộc'
  }),
  fileName: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Tên tệp không được để trống',
    'string.max': 'Tên tệp không được vượt quá 255 ký tự',
    'any.required': 'Tên tệp (fileName) là trường bắt buộc'
  }),
  fileSize: Joi.number().integer().min(1).required().messages({
    'number.base': 'Dung lượng tệp (fileSize) phải là số byte',
    'number.min': 'Dung lượng tệp phải lớn hơn 0',
    'any.required': 'Dung lượng tệp (fileSize) là trường bắt buộc'
  }),
  contentType: Joi.string().trim().max(100).required().messages({
    'string.empty': 'Loại tệp (contentType) không được để trống',
    'any.required': 'Loại tệp (contentType) là trường bắt buộc'
  }),
  contextId: Joi.string().uuid().optional().messages({
    'string.guid': 'contextId phải là UUID của khóa học hoặc bài học'
  })
});

const materialTitle = Joi.string().trim().min(3).max(255).required().messages({
  'string.min': 'Tiêu đề tài liệu phải có ít nhất 3 ký tự',
  'string.max': 'Tiêu đề tài liệu không được vượt quá 255 ký tự',
  'string.empty': 'Tiêu đề tài liệu không được để trống',
  'any.required': 'Tiêu đề tài liệu là trường bắt buộc'
});

/**
 * 2. Gắn tài liệu vào bài học (POST /lessons/:lessonId/materials)
 */
export const createMaterialSchema = Joi.object({
  title: materialTitle,
  fileName: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Tên tệp không được để trống',
    'any.required': 'Tên tệp (fileName) là trường bắt buộc'
  }),
  fileKey: Joi.string().trim().max(500).pattern(/^private\/materials\//).required().messages({
    'string.pattern.base': 'fileKey phải bắt đầu bằng private/materials/',
    'string.empty': 'fileKey không được để trống',
    'any.required': 'fileKey là trường bắt buộc'
  }),
  fileType: Joi.string().lowercase().valid('pdf', 'docx', 'pptx', 'zip', 'rar').required().messages({
    'any.only': 'Loại tệp (fileType) phải là pdf, docx, pptx, zip hoặc rar',
    'any.required': 'Loại tệp (fileType) là trường bắt buộc'
  }),
  fileSize: Joi.number().integer().min(1).max(50 * 1024 * 1024).required().messages({
    'number.min': 'Dung lượng tệp phải lớn hơn 0',
    'number.max': 'Dung lượng tài liệu tối đa 50MB',
    'any.required': 'Dung lượng tệp (fileSize) là trường bắt buộc'
  })
});

/**
 * 3. Đổi tiêu đề tài liệu (PATCH /lessons/:lessonId/materials/:materialId)
 */
export const updateMaterialSchema = Joi.object({
  title: materialTitle
});
