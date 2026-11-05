import Joi from 'joi';
import { isSupportedVideoUrl } from '../utils/videoUrl.js';

// Cột courses.price là DECIMAL(10,2): lớn hơn mức này Postgres báo tràn số (lỗi 500)
const PRICE_MAX = 99999999;

// Link video bài học: chỉ nhận YouTube/Vimeo để nhúng được trình phát trong trang học (utils/videoUrl.js)
const videoUrlBase = Joi.string().trim().uri().max(500)
  .custom((value, helpers) => (isSupportedVideoUrl(value) ? value : helpers.error('videoUrl.unsupported')))
  .messages({
    'string.uri': 'Đường dẫn video không đúng định dạng URL',
    'string.base': 'Bài học video cần có link video',
    'string.empty': 'Bài học video cần có link video',
    'any.required': 'Bài học video cần có link video',
    'videoUrl.unsupported': 'Link video phải là YouTube (youtube.com/watch?v=..., youtu.be/...) hoặc Vimeo (vimeo.com/...)'
  });
const videoUrlField = videoUrlBase.allow(null, '');

// Trang giới thiệu khóa học (bổ sung 31/10/2026)
export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced', 'all'];
const LIST_ITEM_MAX = 160;
const LIST_MAX_ITEMS = 10;
const textList = (label) => Joi.array()
  .items(Joi.string().trim().min(1).max(LIST_ITEM_MAX).messages({
    'string.empty': `${label}: mỗi dòng không được để trống`,
    'string.max': `${label}: mỗi dòng tối đa ${LIST_ITEM_MAX} ký tự`
  }))
  .max(LIST_MAX_ITEMS).allow(null).optional()
  .messages({ 'array.max': `${label}: tối đa ${LIST_MAX_ITEMS} dòng` });

const landingFields = {
  shortDescription: Joi.string().trim().max(160).allow(null, '').optional().messages({
    'string.max': 'Mô tả ngắn tối đa 160 ký tự'
  }),
  level: Joi.string().valid(...COURSE_LEVELS).allow(null).optional().messages({
    'any.only': 'Trình độ phải là beginner, intermediate, advanced hoặc all'
  }),
  learningOutcomes: textList('Bạn sẽ học được gì'),
  requirements: textList('Yêu cầu đầu vào')
};

/**
 * 1. Create Course Schema
 */
export const createCourseSchema = Joi.object({
  title: Joi.string().min(5).max(255).trim().required().messages({
    'string.min': 'Tiêu đề khóa học phải có ít nhất 5 ký tự',
    'string.max': 'Tiêu đề khóa học không được vượt quá 255 ký tự',
    'string.empty': 'Tiêu đề khóa học không được để trống',
    'any.required': 'Tiêu đề khóa học là trường bắt buộc'
  }),
  description: Joi.string().max(2000).allow(null, '').optional().messages({
    'string.max': 'Mô tả khóa học không được vượt quá 2000 ký tự'
  }),
  thumbnailUrl: Joi.string().uri().max(500).allow(null, '').optional().messages({
    'string.uri': 'Đường dẫn ảnh đại diện (thumbnailUrl) phải là URL hợp lệ'
  }),
  categoryId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'Danh mục khóa học (categoryId) không hợp lệ'
  }),
  price: Joi.number().min(0).max(PRICE_MAX).optional().default(0).messages({
    'number.min': 'Học phí phải lớn hơn hoặc bằng 0',
    'number.max': 'Học phí tối đa 99.999.999 ₫'
  }),
  ...landingFields
});

/**
 * 2. Update Course Schema
 */
export const updateCourseSchema = Joi.object({
  title: Joi.string().min(5).max(255).trim().optional().messages({
    'string.min': 'Tiêu đề khóa học phải có ít nhất 5 ký tự',
    'string.max': 'Tiêu đề khóa học không được vượt quá 255 ký tự'
  }),
  description: Joi.string().max(2000).allow(null, '').optional().messages({
    'string.max': 'Mô tả khóa học không được vượt quá 2000 ký tự'
  }),
  thumbnailUrl: Joi.string().uri().max(500).allow(null, '').optional().messages({
    'string.uri': 'Đường dẫn ảnh đại diện (thumbnailUrl) phải là URL hợp lệ'
  }),
  categoryId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'Danh mục khóa học (categoryId) không hợp lệ'
  }),
  price: Joi.number().min(0).max(PRICE_MAX).optional().messages({
    'number.min': 'Học phí phải lớn hơn hoặc bằng 0',
    'number.max': 'Học phí tối đa 99.999.999 ₫'
  }),
  ...landingFields
});

/**
 * 3. Query Courses Schema (Filters & Pagination)
 */
export const queryCoursesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional(),
  status: Joi.string().valid('draft', 'pending', 'published', 'rejected').optional(),
  categoryId: Joi.string().uuid().optional(),
  category: Joi.string().max(120).optional(), // lọc theo slug danh mục
  mine: Joi.boolean().optional(), // chỉ khóa học do người dùng hiện tại sở hữu
  sortBy: Joi.string().valid('createdAt', 'created_at', 'title', 'price').default('createdAt'),
  sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC')
});

/**
 * 4. Reject Course Schema (Manager/Admin rejection reason)
 */
export const rejectCourseSchema = Joi.object({
  reason: Joi.string().min(5).max(1000).trim().required().messages({
    'string.min': 'Lý do từ chối phải có ít nhất 5 ký tự',
    'string.max': 'Lý do từ chối không được vượt quá 1000 ký tự',
    'string.empty': 'Vui lòng cung cấp lý do từ chối phê duyệt khóa học',
    'any.required': 'Lý do từ chối là trường bắt buộc'
  })
});

/**
 * 5. Create Chapter Schema
 */
export const createChapterSchema = Joi.object({
  title: Joi.string().min(2).max(255).trim().required().messages({
    'string.min': 'Tiêu đề chương học phải có ít nhất 2 ký tự',
    'string.max': 'Tiêu đề chương học không được vượt quá 255 ký tự',
    'string.empty': 'Tiêu đề chương học không được để trống',
    'any.required': 'Tiêu đề chương học là trường bắt buộc'
  }),
  orderIndex: Joi.number().integer().min(0).optional()
});

/**
 * 6. Update Chapter Schema
 */
export const updateChapterSchema = Joi.object({
  title: Joi.string().min(2).max(255).trim().required().messages({
    'string.min': 'Tiêu đề chương học phải có ít nhất 2 ký tự',
    'string.max': 'Tiêu đề chương học không được vượt quá 255 ký tự',
    'string.empty': 'Tiêu đề chương học không được để trống',
    'any.required': 'Tiêu đề chương học là trường bắt buộc'
  })
});

/**
 * 7. Reorder Chapters Schema
 */
export const reorderChaptersSchema = Joi.object({
  chapterIds: Joi.array().items(Joi.string().uuid()).min(1).unique().required().messages({
    'array.min': 'Danh sách chương học cần sắp xếp không được để trống',
    'array.unique': 'Danh sách chương học bị trùng lặp',
    'any.required': 'chapterIds là trường bắt buộc'
  })
});

/**
 * 8. Create Lesson Schema
 */
export const createLessonSchema = Joi.object({
  title: Joi.string().min(2).max(255).trim().required().messages({
    'string.min': 'Tiêu đề bài học phải có ít nhất 2 ký tự',
    'string.max': 'Tiêu đề bài học không được vượt quá 255 ký tự',
    'string.empty': 'Tiêu đề bài học không được để trống',
    'any.required': 'Tiêu đề bài học là trường bắt buộc'
  }),
  lessonType: Joi.string().valid('theory', 'video', 'quiz', 'assignment').default('theory').messages({
    'any.only': 'Loại bài học không hợp lệ (hỗ trợ: theory, video, quiz, assignment)'
  }),
  // Bài học video bắt buộc có link; loại khác thì tùy chọn
  videoUrl: Joi.when('lessonType', { is: 'video', then: videoUrlBase.required(), otherwise: videoUrlField.optional() }),
  contentText: Joi.string().allow(null, '').optional(),
  orderIndex: Joi.number().integer().min(0).optional()
});

/**
 * 9. Update Lesson Schema
 */
export const updateLessonSchema = Joi.object({
  title: Joi.string().min(2).max(255).trim().optional().messages({
    'string.min': 'Tiêu đề bài học phải có ít nhất 2 ký tự',
    'string.max': 'Tiêu đề bài học không được vượt quá 255 ký tự'
  }),
  lessonType: Joi.string().valid('theory', 'video', 'quiz', 'assignment').optional(),
  videoUrl: videoUrlField.optional(),
  contentText: Joi.string().allow(null, '').optional(),
  orderIndex: Joi.number().integer().min(0).optional()
});

/**
 * 10. Reorder Lessons Schema
 */
export const reorderLessonsSchema = Joi.object({
  lessonIds: Joi.array().items(Joi.string().uuid()).min(1).unique().required().messages({
    'array.min': 'Danh sách bài học cần sắp xếp không được để trống',
    'array.unique': 'Danh sách bài học bị trùng lặp',
    'any.required': 'lessonIds là trường bắt buộc'
  })
});

/**
 * 11. Update Lesson Progress Schema
 */
export const updateLessonProgressSchema = Joi.object({
  isCompleted: Joi.boolean().required().messages({
    'any.required': 'isCompleted là trường bắt buộc (true hoặc false)'
  })
});

/**
 * 12. Category Schemas (Danh mục khóa học)
 */
const categoryNameField = Joi.string().min(2).max(100).trim().messages({
  'string.min': 'Tên danh mục phải có ít nhất 2 ký tự',
  'string.max': 'Tên danh mục không được vượt quá 100 ký tự',
  'string.empty': 'Tên danh mục không được để trống',
  'any.required': 'Tên danh mục là trường bắt buộc'
});

export const createCategorySchema = Joi.object({
  name: categoryNameField.required(),
  description: Joi.string().max(1000).allow(null, '').optional().messages({
    'string.max': 'Mô tả danh mục không được vượt quá 1000 ký tự'
  }),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional()
});

export const updateCategorySchema = Joi.object({
  name: categoryNameField.optional(),
  description: Joi.string().max(1000).allow(null, '').optional().messages({
    'string.max': 'Mô tả danh mục không được vượt quá 1000 ký tự'
  }),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'Cần truyền ít nhất một trường để cập nhật'
});

export const reorderCategoriesSchema = Joi.object({
  categoryIds: Joi.array().items(Joi.string().uuid()).min(1).unique().required().messages({
    'array.min': 'Danh sách danh mục cần sắp xếp không được để trống',
    'array.unique': 'Danh sách danh mục bị trùng lặp',
    'any.required': 'categoryIds là trường bắt buộc'
  })
});

export const queryCategoriesSchema = Joi.object({
  includeHidden: Joi.boolean().default(false)
});

/**
 * 13. Query schema cho GET /courses/:id/curriculum (classId để lấy tiến độ học)
 */
export const queryCurriculumSchema = Joi.object({
  classId: Joi.string().uuid().optional().messages({
    'string.guid': 'classId không hợp lệ (phải là UUID)'
  })
});
