import Joi from 'joi';

const CLASS_STATUSES = ['active', 'paused', 'closed'];

const pageSchema = Joi.number().integer().min(1).default(1).messages({
  'number.base': 'page phải là số nguyên',
  'number.min': 'page phải lớn hơn hoặc bằng 1'
});

const limitSchema = (defaultValue) => Joi.number().integer().min(1).max(100).default(defaultValue).messages({
  'number.base': 'limit phải là số nguyên',
  'number.min': 'limit phải lớn hơn hoặc bằng 1',
  'number.max': 'limit tối đa là 100'
});

const searchSchema = Joi.string().trim().max(100).allow('').optional();

// Mã lớp: 4-20 ký tự chữ và số, tự chuyển về chữ hoa (người dùng gõ "web2026a" vẫn hợp lệ)
const classCodeSchema = Joi.string().trim().uppercase().pattern(/^[A-Z0-9]{4,20}$/).messages({
  'string.pattern.base': 'Mã lớp phải gồm 4-20 ký tự chữ và số, không chứa khoảng trắng hay ký tự đặc biệt',
  'string.empty': 'Mã lớp không được để trống'
});

const nameSchema = Joi.string().trim().min(5).max(255).messages({
  'string.min': 'Tên lớp học phải có ít nhất 5 ký tự',
  'string.max': 'Tên lớp học không được vượt quá 255 ký tự',
  'string.empty': 'Tên lớp học không được để trống',
  'any.required': 'Tên lớp học là trường bắt buộc'
});

// Không dùng Joi.isoDate(): nó tự đổi '2026-10-01' thành '2026-10-01T00:00:00.000Z'
const dateSchema = (label) => Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null)
  .custom((value, helpers) => {
    const date = new Date(`${value}T00:00:00Z`);
    // Chặn ngày không tồn tại như 2026-02-30
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) ? value : helpers.error('any.invalid');
  })
  .messages({
    'string.pattern.base': `${label} phải có định dạng YYYY-MM-DD`,
    'any.invalid': `${label} không phải ngày hợp lệ`
  });

/**
 * 1. GET /classes
 */
export const queryClassesSchema = Joi.object({
  page: pageSchema,
  limit: limitSchema(10),
  search: searchSchema,
  courseId: Joi.string().uuid().optional().messages({ 'string.guid': 'courseId không hợp lệ' }),
  teacherId: Joi.string().uuid().optional().messages({ 'string.guid': 'teacherId không hợp lệ' }),
  status: Joi.string().valid(...CLASS_STATUSES).optional().messages({
    'any.only': 'Trạng thái lớp phải là active, paused hoặc closed'
  })
});

/**
 * 2. POST /classes
 */
export const createClassSchema = Joi.object({
  courseId: Joi.string().uuid().required().messages({
    'string.guid': 'courseId không hợp lệ',
    'any.required': 'Khóa học (courseId) là trường bắt buộc'
  }),
  name: nameSchema.required(),
  classCode: classCodeSchema.allow(null, '').optional(),
  teacherId: Joi.string().uuid().allow(null).optional().messages({ 'string.guid': 'teacherId không hợp lệ' }),
  startDate: dateSchema('Ngày bắt đầu').optional(),
  endDate: dateSchema('Ngày kết thúc').optional()
});

/**
 * 3. PATCH /classes/:id
 */
export const updateClassSchema = Joi.object({
  name: nameSchema.optional(),
  status: Joi.string().valid(...CLASS_STATUSES).optional().messages({
    'any.only': 'Trạng thái lớp phải là active, paused hoặc closed'
  }),
  startDate: dateSchema('Ngày bắt đầu').optional(),
  endDate: dateSchema('Ngày kết thúc').optional()
}).min(1).messages({ 'object.min': 'Cần ít nhất một trường để cập nhật' });

/**
 * 4. POST /classes/:id/regenerate-code (body tùy chọn)
 */
export const regenerateCodeSchema = Joi.object({
  customCode: classCodeSchema.allow(null, '').optional()
});

/**
 * 5. POST /classes/enroll
 */
export const enrollClassSchema = Joi.object({
  classCode: Joi.string().trim().uppercase().max(20).required().messages({
    'string.empty': 'Vui lòng nhập mã lớp học',
    'string.max': 'Mã lớp học không hợp lệ',
    'any.required': 'Mã lớp học (classCode) là trường bắt buộc'
  })
});

/**
 * 6. GET /classes/:id/members
 */
export const queryMembersSchema = Joi.object({
  page: pageSchema,
  limit: limitSchema(20),
  search: searchSchema,
  status: Joi.string().valid('active', 'dropped').default('active').messages({
    'any.only': 'Trạng thái thành viên phải là active hoặc dropped'
  })
});

/**
 * 7. POST /classes/:id/members
 */
export const addMemberSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required().messages({
    'string.email': 'Email không đúng định dạng',
    'string.empty': 'Email không được để trống',
    'any.required': 'Email là trường bắt buộc'
  })
});

/**
 * 8. GET /classes/:id/progress
 */
export const queryProgressSchema = Joi.object({
  page: pageSchema,
  limit: limitSchema(20),
  search: searchSchema,
  status: Joi.string().valid('completed', 'in_progress', 'not_started').optional().messages({
    'any.only': 'Trạng thái tiến độ phải là completed, in_progress hoặc not_started'
  }),
  sortBy: Joi.string().valid('progress', 'name', 'lastActiveAt').default('progress'),
  order: Joi.string().valid('asc', 'desc').default('asc')
});
