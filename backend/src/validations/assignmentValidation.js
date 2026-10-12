import Joi from 'joi';

const uuid = (label) => Joi.string().uuid().messages({ 'string.guid': `${label} không hợp lệ (phải là UUID)` });

const pageSchema = Joi.number().integer().min(1).default(1).messages({
  'number.base': 'page phải là số nguyên',
  'number.min': 'page phải lớn hơn hoặc bằng 1'
});
const limitSchema = (defaultValue) => Joi.number().integer().min(1).max(100).default(defaultValue).messages({
  'number.base': 'limit phải là số nguyên',
  'number.max': 'limit tối đa là 100'
});
const isoDate = (label) => Joi.date().iso().messages({
  'date.base': `${label} phải là thời điểm hợp lệ`,
  'date.format': `${label} phải có định dạng ISO 8601`
});

/**
 * Danh sách đuôi tệp "pdf, ZIP ,docx" -> "pdf,zip,docx" (bỏ khoảng trắng, chữ thường, bỏ trùng)
 */
const fileTypesSchema = Joi.string().trim().lowercase().max(255)
  .custom((value, helpers) => {
    const types = [...new Set(value.split(',').map((t) => t.trim().replace(/^\./, '')).filter(Boolean))];
    if (types.length === 0 || types.length > 15 || types.some((t) => !/^[a-z0-9]{1,10}$/.test(t))) {
      return helpers.error('any.invalid');
    }
    return types.join(',');
  })
  .messages({ 'any.invalid': 'Định dạng tệp cho phép phải là danh sách đuôi tệp phân cách bằng dấu phẩy (VD: pdf,zip,docx), tối đa 15 loại' });

const assignmentFields = {
  title: Joi.string().trim().min(5).max(255).messages({
    'string.min': 'Tiêu đề bài tập phải có ít nhất 5 ký tự',
    'string.max': 'Tiêu đề bài tập không được vượt quá 255 ký tự',
    'string.empty': 'Tiêu đề bài tập không được để trống',
    'any.required': 'Tiêu đề bài tập là trường bắt buộc'
  }),
  instruction: Joi.string().trim().min(1).max(20000).messages({
    'string.empty': 'Đề bài không được để trống',
    'string.max': 'Đề bài tối đa 20.000 ký tự',
    'any.required': 'Đề bài (instruction) là trường bắt buộc'
  }),
  allowedFileTypes: fileTypesSchema,
  maxFileSizeMb: Joi.number().integer().min(1).max(100).messages({
    'number.min': 'Dung lượng tối đa phải từ 1MB',
    'number.max': 'Dung lượng tối đa không được vượt quá 100MB'
  })
};

// ==========================================
// 1. KHUNG BÀI TẬP
// ==========================================
export const queryAssignmentsSchema = Joi.object({
  page: pageSchema,
  limit: limitSchema(10),
  lessonId: uuid('lessonId').optional(),
  courseId: uuid('courseId').optional(),
  search: Joi.string().trim().max(100).allow('').optional()
});

export const createAssignmentSchema = Joi.object({
  lessonId: uuid('lessonId').required().messages({ 'any.required': 'Bài học (lessonId) là trường bắt buộc' }),
  title: assignmentFields.title.required(),
  instruction: assignmentFields.instruction.required(),
  allowedFileTypes: assignmentFields.allowedFileTypes.default('pdf,zip,docx'),
  maxFileSizeMb: assignmentFields.maxFileSizeMb.default(25)
});

export const updateAssignmentSchema = Joi.object(
  Object.fromEntries(Object.entries(assignmentFields).map(([key, schema]) => [key, schema.optional()]))
).min(1).messages({ 'object.min': 'Cần ít nhất một trường để cập nhật' });

// ==========================================
// 2. LỊCH NỘP THEO LỚP
// ==========================================
export const scheduleAssignmentSchema = Joi.object({
  openTime: isoDate('openTime').allow(null).optional(),
  deadline: isoDate('deadline').required().messages({ 'any.required': 'Hạn nộp (deadline) là trường bắt buộc' }),
  cutoffTime: isoDate('cutoffTime').allow(null).optional(),
  allowLateSubmission: Joi.boolean().default(true)
});

// ==========================================
// 3. NỘP BÀI
// ==========================================
const fileNameSchema = Joi.string().trim().min(1).max(255).required().messages({
  'string.empty': 'Tên tệp không được để trống',
  'any.required': 'Tên tệp (fileName) là trường bắt buộc'
});
const fileSizeSchema = Joi.number().integer().min(1).required().messages({
  'number.min': 'Dung lượng tệp phải lớn hơn 0',
  'any.required': 'Dung lượng tệp (fileSize) là trường bắt buộc'
});

export const submissionUploadSchema = Joi.object({
  fileName: fileNameSchema,
  fileSize: fileSizeSchema,
  contentType: Joi.string().trim().max(100).required().messages({
    'string.empty': 'Loại tệp (contentType) không được để trống',
    'any.required': 'Loại tệp (contentType) là trường bắt buộc'
  })
});

export const confirmSubmissionSchema = Joi.object({
  fileKey: Joi.string().trim().max(500).pattern(/^private\/assignments\//).required().messages({
    'string.pattern.base': 'fileKey không hợp lệ',
    'any.required': 'fileKey là trường bắt buộc'
  }),
  fileName: fileNameSchema,
  fileSize: fileSizeSchema,
  studentNote: Joi.string().trim().max(2000).allow(null, '').optional().messages({
    'string.max': 'Ghi chú tối đa 2000 ký tự'
  })
});

// ==========================================
// 4. CHẤM BÀI
// ==========================================
export const querySubmissionsSchema = Joi.object({
  page: pageSchema,
  limit: limitSchema(20),
  status: Joi.string().valid('submitted', 'late_submitted', 'graded', 'resubmission_requested', 'missing', 'needs_grading').optional()
    .messages({ 'any.only': 'Trạng thái lọc không hợp lệ' }),
  search: Joi.string().trim().max(100).allow('').optional(),
  sortBy: Joi.string().valid('submittedAt', 'studentName', 'grade').default('submittedAt'),
  sortOrder: Joi.string().uppercase().valid('ASC', 'DESC').default('DESC')
});

const gradeFields = {
  grade: Joi.number().min(0).max(10).precision(2).required().messages({
    'number.base': 'Điểm số phải là số',
    'number.min': 'Điểm số không hợp lệ (từ 0 đến 10)',
    'number.max': 'Điểm số không hợp lệ (từ 0 đến 10)',
    'any.required': 'Điểm số (grade) là trường bắt buộc'
  }),
  feedback: Joi.string().trim().max(2000).allow(null, '').optional().messages({
    'string.max': 'Nhận xét tối đa 2000 ký tự'
  })
};

export const gradeSubmissionSchema = Joi.object(gradeFields);

export const requestResubmissionSchema = Joi.object({
  reason: Joi.string().trim().min(10).max(1000).required().messages({
    'string.min': 'Lý do yêu cầu nộp lại phải có ít nhất 10 ký tự',
    'string.max': 'Lý do tối đa 1000 ký tự',
    'string.empty': 'Vui lòng nhập lý do yêu cầu nộp lại',
    'any.required': 'Lý do (reason) là trường bắt buộc'
  })
});

export const bulkGradeSchema = Joi.object({
  grades: Joi.array().items(Joi.object({ submissionId: uuid('submissionId').required(), ...gradeFields }))
    .min(1).max(100).unique('submissionId').required().messages({
      'array.min': 'Danh sách chấm điểm không được rỗng',
      'array.max': 'Mỗi lần chấm tối đa 100 bài',
      'array.unique': 'Bài nộp bị trùng trong danh sách',
      'any.required': 'Danh sách chấm điểm (grades) là trường bắt buộc'
    })
});

export const zipStatusQuerySchema = Joi.object({
  jobId: Joi.string().trim().pattern(/^job_zip_[0-9a-f-]{36}$/).required().messages({
    'string.pattern.base': 'jobId không hợp lệ',
    'any.required': 'jobId là trường bắt buộc'
  })
});
