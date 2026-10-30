import Joi from 'joi';
import { CONTENT_MAX_LENGTH } from '../utils/discussionRules.js';

const contentField = Joi.string().trim().min(1).max(CONTENT_MAX_LENGTH).required().messages({
  'string.base': 'Nội dung phải là chuỗi ký tự',
  'string.empty': 'Nội dung không được để trống',
  'string.min': 'Nội dung không được để trống',
  'string.max': `Nội dung tối đa ${CONTENT_MAX_LENGTH} ký tự`,
  'any.required': 'Nội dung là trường bắt buộc'
});

const pageFields = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
};

/**
 * POST câu hỏi / câu trả lời, PATCH sửa nội dung
 */
export const discussionContentSchema = Joi.object({
  content: contentField
});

/**
 * PATCH /discussions/:id/resolve
 */
export const resolveDiscussionSchema = Joi.object({
  isResolved: Joi.boolean().required().messages({
    'any.required': 'isResolved là trường bắt buộc (true hoặc false)',
    'boolean.base': 'isResolved phải là true hoặc false'
  })
});

/**
 * GET /classes/:classId/lessons/:lessonId/discussions
 */
export const queryLessonDiscussionsSchema = Joi.object({
  status: Joi.string().valid('all', 'open', 'resolved').default('all').messages({
    'any.only': 'status phải là all, open hoặc resolved'
  }),
  ...pageFields
});

/**
 * GET /classes/:classId/discussions (tổng quan cả lớp)
 */
export const queryClassDiscussionsSchema = Joi.object({
  status: Joi.string().valid('all', 'open', 'resolved').default('open').messages({
    'any.only': 'status phải là all, open hoặc resolved'
  }),
  lessonId: Joi.string().uuid().messages({ 'string.guid': 'lessonId không hợp lệ (phải là UUID)' }),
  ...pageFields
});
