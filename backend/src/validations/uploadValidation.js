import Joi from 'joi';

export const presignUploadSchema = Joi.object({
  purpose: Joi.string()
    .valid('course-thumbnail', 'lesson-video', 'course-material', 'assignment-submission')
    .required()
    .messages({
      'any.only': 'Mục đích upload không hợp lệ',
      'any.required': 'purpose là trường bắt buộc'
    }),
  fileName: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Tên tệp không được để trống',
    'any.required': 'fileName là trường bắt buộc'
  }),
  contentType: Joi.string().trim().max(100).required().messages({
    'any.required': 'contentType là trường bắt buộc'
  }),
  fileSize: Joi.number().integer().min(1).required().messages({
    'number.min': 'Dung lượng tệp phải lớn hơn 0',
    'any.required': 'fileSize (byte) là trường bắt buộc'
  })
});

export const createCourseMaterialSchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).required(),
  fileName: Joi.string().trim().min(1).max(255).required(),
  fileKey: Joi.string().trim().min(1).max(500).required(),
  fileSize: Joi.number().integer().min(1).max(50 * 1024 * 1024).required()
});

export const updateCourseMaterialSchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).required()
});
