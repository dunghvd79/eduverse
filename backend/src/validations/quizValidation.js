import Joi from 'joi';

const QUESTION_TYPES = ['single_choice', 'multiple_choice', 'true_false'];
const MAX_BULK = 50;

const uuid = (label) => Joi.string().uuid().messages({ 'string.guid': `${label} không hợp lệ (phải là UUID)` });

const pageSchema = Joi.number().integer().min(1).default(1).messages({
  'number.base': 'page phải là số nguyên',
  'number.min': 'page phải lớn hơn hoặc bằng 1'
});
const limitSchema = (defaultValue, max = 100) => Joi.number().integer().min(1).max(max).default(defaultValue).messages({
  'number.base': 'limit phải là số nguyên',
  'number.min': 'limit phải lớn hơn hoặc bằng 1',
  'number.max': `limit tối đa là ${max}`
});
const sortOrderSchema = Joi.string().uppercase().valid('ASC', 'DESC').default('DESC').messages({
  'any.only': 'sortOrder phải là ASC hoặc DESC'
});

// ==========================================
// 1. ĐỀ THI
// ==========================================
export const queryQuizzesSchema = Joi.object({
  page: pageSchema,
  limit: limitSchema(10),
  lessonId: uuid('lessonId').optional(),
  courseId: uuid('courseId').optional(),
  search: Joi.string().trim().max(100).allow('').optional(),
  isPublished: Joi.boolean().optional()
});

export const classContextQuerySchema = Joi.object({
  classId: uuid('classId').optional()
});

const quizFields = {
  title: Joi.string().trim().min(5).max(255).messages({
    'string.min': 'Tiêu đề bài kiểm tra phải có ít nhất 5 ký tự',
    'string.max': 'Tiêu đề bài kiểm tra không được vượt quá 255 ký tự',
    'string.empty': 'Tiêu đề bài kiểm tra không được để trống',
    'any.required': 'Tiêu đề bài kiểm tra là trường bắt buộc'
  }),
  description: Joi.string().trim().max(2000).allow(null, '').messages({
    'string.max': 'Mô tả không được vượt quá 2000 ký tự'
  }),
  durationMinutes: Joi.number().integer().min(5).max(180).messages({
    'number.base': 'Thời lượng (durationMinutes) phải là số nguyên',
    'number.min': 'Thời lượng làm bài tối thiểu 5 phút',
    'number.max': 'Thời lượng làm bài tối đa 180 phút',
    'any.required': 'Thời lượng làm bài là trường bắt buộc'
  }),
  maxAttempts: Joi.number().integer().min(1).max(10).messages({
    'number.base': 'Số lần làm bài (maxAttempts) phải là số nguyên',
    'number.min': 'Số lần làm bài tối thiểu là 1',
    'number.max': 'Số lần làm bài tối đa là 10',
    'any.required': 'Số lần làm bài tối đa là trường bắt buộc'
  }),
  passScore: Joi.number().min(1).max(10).precision(2).messages({
    'number.base': 'Điểm đạt (passScore) phải là số',
    'number.min': 'Điểm đạt tối thiểu là 1.0',
    'number.max': 'Điểm đạt tối đa là 10.0',
    'any.required': 'Điểm đạt là trường bắt buộc'
  }),
  showAnswersAfterSubmit: Joi.boolean(),
  isPublished: Joi.boolean()
};

export const createQuizSchema = Joi.object({
  lessonId: uuid('lessonId').required().messages({ 'any.required': 'Bài học (lessonId) là trường bắt buộc' }),
  title: quizFields.title.required(),
  description: quizFields.description.optional(),
  durationMinutes: quizFields.durationMinutes.required(),
  maxAttempts: quizFields.maxAttempts.required(),
  passScore: quizFields.passScore.required(),
  showAnswersAfterSubmit: quizFields.showAnswersAfterSubmit.default(true),
  isPublished: quizFields.isPublished.default(false)
});

export const updateQuizSchema = Joi.object(
  Object.fromEntries(Object.entries(quizFields).map(([key, schema]) => [key, schema.optional()]))
).min(1).messages({ 'object.min': 'Cần ít nhất một trường để cập nhật' });

// ==========================================
// 2. CÂU HỎI
// ==========================================
const choiceSchema = (allowId) => Joi.object({
  id: allowId ? uuid('ID lựa chọn').optional() : Joi.forbidden(),
  content: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Nội dung lựa chọn không được để trống',
    'string.max': 'Nội dung lựa chọn tối đa 1000 ký tự',
    'any.required': 'Nội dung lựa chọn là trường bắt buộc'
  }),
  isCorrect: Joi.boolean().default(false)
});

const choicesSchema = (allowId) => Joi.array().items(choiceSchema(allowId)).min(2).max(6).messages({
  'array.min': 'Câu hỏi phải có ít nhất 2 lựa chọn',
  'array.max': 'Câu hỏi có tối đa 6 lựa chọn'
});

const questionFields = {
  content: Joi.string().trim().min(1).max(2000).messages({
    'string.empty': 'Nội dung câu hỏi không được để trống',
    'string.max': 'Nội dung câu hỏi tối đa 2000 ký tự',
    'any.required': 'Nội dung câu hỏi là trường bắt buộc'
  }),
  questionType: Joi.string().valid(...QUESTION_TYPES).messages({
    'any.only': 'Loại câu hỏi phải là single_choice, multiple_choice hoặc true_false'
  }),
  points: Joi.number().positive().max(100).precision(2).messages({
    'number.positive': 'Điểm câu hỏi phải lớn hơn 0',
    'number.max': 'Điểm câu hỏi tối đa 100'
  }),
  explanation: Joi.string().trim().max(2000).allow(null, '').messages({
    'string.max': 'Lời giải thích tối đa 2000 ký tự'
  })
};

const newQuestionSchema = Joi.object({
  content: questionFields.content.required(),
  questionType: questionFields.questionType.default('single_choice'),
  points: questionFields.points.default(1),
  explanation: questionFields.explanation.optional(),
  orderIndex: Joi.number().integer().min(1).optional(),
  choices: choicesSchema(false).required().messages({ 'any.required': 'Danh sách lựa chọn (choices) là trường bắt buộc' })
});

export const createQuestionSchema = newQuestionSchema;

export const bulkCreateQuestionsSchema = Joi.object({
  questions: Joi.array().items(newQuestionSchema.keys({ orderIndex: Joi.forbidden() })).min(1).max(MAX_BULK).required().messages({
    'array.min': 'Danh sách câu hỏi không được rỗng',
    'array.max': `Mỗi lần thêm tối đa ${MAX_BULK} câu hỏi`,
    'any.required': 'Danh sách câu hỏi (questions) là trường bắt buộc'
  })
});

const questionUpdateFields = {
  content: questionFields.content.optional(),
  questionType: questionFields.questionType.optional(),
  points: questionFields.points.optional(),
  explanation: questionFields.explanation.optional(),
  choices: choicesSchema(true).optional()
};

export const updateQuestionSchema = Joi.object(questionUpdateFields).min(1).messages({
  'object.min': 'Cần ít nhất một trường để cập nhật'
});

export const reorderQuestionsSchema = Joi.object({
  orders: Joi.array().items(Joi.object({
    id: uuid('ID câu hỏi').required(),
    orderIndex: Joi.number().integer().min(1).required().messages({ 'number.min': 'orderIndex phải >= 1' })
  })).min(1).max(500).unique('id').required().messages({
    'array.min': 'Danh sách sắp xếp không được rỗng',
    'array.unique': 'ID câu hỏi bị trùng lặp',
    'any.required': 'Danh sách sắp xếp (orders) là trường bắt buộc'
  })
});

const questionIdsSchema = Joi.array().items(uuid('ID câu hỏi')).min(1).max(MAX_BULK).unique().messages({
  'array.min': 'Danh sách câu hỏi không được rỗng',
  'array.max': `Mỗi lần thao tác tối đa ${MAX_BULK} câu hỏi`,
  'array.unique': 'ID câu hỏi bị trùng lặp',
  'any.required': 'Danh sách câu hỏi (questionIds) là trường bắt buộc'
});

export const bulkUpdateQuestionsSchema = Joi.object({
  mode: Joi.string().valid('details', 'common_points').default('details'),
  questions: Joi.when('mode', {
    is: 'details',
    then: Joi.array().items(
      Joi.object({ id: uuid('ID câu hỏi').required(), ...questionUpdateFields })
        .or('content', 'questionType', 'points', 'explanation', 'choices')
        .messages({ 'object.missing': 'Mỗi câu hỏi cần ít nhất một trường cập nhật' })
    ).min(1).max(MAX_BULK).unique('id').required(),
    otherwise: Joi.forbidden()
  }),
  questionIds: Joi.when('mode', { is: 'common_points', then: questionIdsSchema.required(), otherwise: Joi.forbidden() }),
  commonPoints: Joi.when('mode', {
    is: 'common_points',
    then: questionFields.points.required().messages({ 'any.required': 'commonPoints là trường bắt buộc' }),
    otherwise: Joi.forbidden()
  })
});

export const bulkDeleteQuestionsSchema = Joi.object({
  questionIds: questionIdsSchema.required()
});

// ==========================================
// 3. LÀM BÀI
// ==========================================
export const submitAttemptSchema = Joi.object({
  answers: Joi.array().items(Joi.object({
    questionId: uuid('questionId').required(),
    selectedChoiceIds: Joi.array().items(uuid('ID lựa chọn')).max(6).required().messages({
      'any.required': 'selectedChoiceIds là trường bắt buộc'
    })
  })).max(500).required().messages({ 'any.required': 'Danh sách câu trả lời (answers) là trường bắt buộc' })
});

export const myAttemptsQuerySchema = Joi.object({
  page: pageSchema,
  limit: limitSchema(10, 50),
  sortBy: Joi.string().valid('score', 'submittedAt', 'attemptNumber').default('submittedAt'),
  sortOrder: sortOrderSchema,
  status: Joi.string().valid('completed', 'in_progress', 'timed_out').optional()
});

export const quizAttemptsQuerySchema = Joi.object({
  page: pageSchema,
  limit: limitSchema(20),
  search: Joi.string().trim().max(100).allow('').optional(),
  sortBy: Joi.string().valid('score', 'studentName', 'submittedAt').default('submittedAt'),
  sortOrder: sortOrderSchema,
  passed: Joi.boolean().optional(),
  status: Joi.string().valid('completed', 'in_progress', 'timed_out').optional(),
  classId: uuid('classId').optional()
});

// ==========================================
// 4. LỊCH ĐỀ THI THEO LỚP
// ==========================================
export const updateClassQuizSchema = Joi.object({
  openTime: Joi.date().iso().allow(null).messages({ 'date.format': 'openTime phải là thời điểm ISO 8601' }),
  closeTime: Joi.date().iso().allow(null).messages({ 'date.format': 'closeTime phải là thời điểm ISO 8601' }),
  isActive: Joi.boolean()
}).min(1).messages({ 'object.min': 'Cần ít nhất một trường để cập nhật' });

// ==========================================
// 5. GEMINI AI
// ==========================================
const aiFields = {
  documentText: Joi.string().trim().min(300).max(30000).required().messages({
    'string.min': 'Văn bản nguồn quá ngắn (cần ít nhất khoảng 100 từ / 300 ký tự)',
    'string.max': 'Văn bản nguồn tối đa 30.000 ký tự',
    'string.empty': 'Vui lòng nhập văn bản tài liệu',
    'any.required': 'Văn bản tài liệu (documentText) là trường bắt buộc'
  }),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium').messages({
    'any.only': 'Độ khó phải là easy, medium hoặc hard'
  }),
  questionType: Joi.string().valid(...QUESTION_TYPES, 'mixed').default('single_choice').messages({
    'any.only': 'Loại câu hỏi phải là single_choice, multiple_choice, true_false hoặc mixed'
  })
};

export const generateQuestionsSchema = Joi.object({
  ...aiFields,
  numQuestions: Joi.number().integer().min(1).max(20).default(5).messages({
    'number.min': 'Số câu hỏi tối thiểu là 1',
    'number.max': 'Mỗi lần sinh tối đa 20 câu hỏi'
  })
});

export const regenerateSingleSchema = Joi.object({
  ...aiFields,
  previousQuestionPrompt: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Thiếu nội dung câu hỏi cũ',
    'any.required': 'Nội dung câu hỏi cũ (previousQuestionPrompt) là trường bắt buộc'
  })
});
