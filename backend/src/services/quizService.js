import { Op } from 'sequelize';
import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { assertCourseEditable } from './courseService.js';

const { sequelize, Quiz, Question, QuestionOption, Lesson, Chapter, Course, ClassModel, Enrollment } = models;

const COURSE_ATTRIBUTES = ['id', 'title', 'owner_id', 'status'];
export const MAX_BULK = 50;

// ==========================================
// HELPERS: TRUY VẤN & QUYỀN
// ==========================================

const quizInclude = [{
  model: Lesson,
  attributes: ['id', 'title', 'lesson_type', 'chapter_id'],
  include: [{ model: Chapter, attributes: ['id', 'course_id'], include: [{ model: Course, attributes: COURSE_ATTRIBUTES }] }]
}];

export const courseOfQuiz = (quiz) => quiz.lesson?.chapter?.course || null;

/**
 * Lấy đề thi kèm bài học -> chương -> khóa học. Khóa học bị xóa mềm -> coi như đề không tồn tại.
 */
export const findQuizOrFail = async (quizId, options = {}) => {
  const quiz = await Quiz.findByPk(quizId, { include: quizInclude, ...options });
  if (!quiz || !courseOfQuiz(quiz)) {
    throw new AppError('Không tìm thấy bài kiểm tra', 404, 'Not Found');
  }
  return quiz;
};

const isOwnerOrAdmin = (course, user) => user.role === 'admin' || course.owner_id === user.id;

const teachesCourse = async (courseId, user) =>
  user.role === 'teacher' && (await ClassModel.count({ where: { course_id: courseId, teacher_id: user.id } })) > 0;

/**
 * Xem đề ở góc độ người dạy (kèm đáp án đúng): chủ khóa, Admin, Quản lý, GV dạy lớp của khóa
 */
export const canViewAsStaff = async (course, user) =>
  isOwnerOrAdmin(course, user) || user.role === 'training_manager' || await teachesCourse(course.id, user);

/**
 * Sửa đề/câu hỏi: chủ khóa hoặc Admin, khóa học ở draft/rejected (đề thi là nội dung khóa học)
 */
const assertCanEditQuiz = (quiz, user) => {
  const course = courseOfQuiz(quiz);
  if (!isOwnerOrAdmin(course, user)) {
    throw new AppError('Không có quyền sửa bài kiểm tra này', 403, 'Forbidden');
  }
  assertCourseEditable(course);
};

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

const mapQuiz = (quiz, extra = {}) => {
  const course = courseOfQuiz(quiz);
  return {
    id: quiz.id,
    lessonId: quiz.lesson_id,
    lessonTitle: quiz.lesson?.title || null,
    course: course ? { id: course.id, title: course.title, status: course.status } : null,
    title: quiz.title,
    description: quiz.description,
    durationMinutes: quiz.duration_minutes,
    maxAttempts: quiz.max_attempts,
    passScore: toNumber(quiz.pass_score),
    isPublished: quiz.is_published,
    showAnswersAfterSubmit: quiz.show_answers_after_submit,
    createdAt: quiz.created_at,
    updatedAt: quiz.updated_at,
    ...extra
  };
};

export const countQuestions = async (quizIds) => {
  if (quizIds.length === 0) return {};
  const rows = await Question.findAll({
    attributes: ['quiz_id', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
    where: { quiz_id: quizIds },
    group: ['quiz_id'],
    raw: true
  });
  return Object.fromEntries(rows.map((r) => [r.quiz_id, Number(r.total)]));
};

const paginate = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return { page, limit, totalItems, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
};

// ==========================================
// HELPERS: CÂU HỎI & LỰA CHỌN
// ==========================================

export const mapQuestion = (question, { withAnswers = true } = {}) => ({
  id: question.id,
  quizId: question.quiz_id,
  content: question.prompt,
  questionType: question.question_type,
  points: toNumber(question.points),
  ...(withAnswers ? { explanation: question.explanation } : {}),
  orderIndex: question.order_index,
  choices: [...(question.question_options || [])]
    .sort((a, b) => a.order_index - b.order_index)
    .map((option) => ({
      id: option.id,
      content: option.option_text,
      ...(withAnswers ? { isCorrect: option.is_correct } : {})
    }))
});

const loadQuestions = (quizId, transaction) => Question.findAll({
  where: { quiz_id: quizId },
  include: [{ model: QuestionOption }],
  order: [['order_index', 'ASC'], [QuestionOption, 'order_index', 'ASC']],
  transaction
});

/**
 * Ràng buộc lựa chọn theo loại câu hỏi (dùng chung cho thêm/sửa câu hỏi và kiểm tra kết quả AI):
 * - 2-6 lựa chọn, ít nhất 1 đáp án đúng
 * - single_choice / true_false: đúng 1 đáp án đúng; true_false: đúng 2 lựa chọn
 */
export const validateChoices = (questionType, choices, label = 'Câu hỏi') => {
  if (!Array.isArray(choices) || choices.length < 2 || choices.length > 6) {
    throw new AppError(`${label}: phải có từ 2 đến 6 lựa chọn`, 400, 'Bad Request');
  }
  const correct = choices.filter((c) => c.isCorrect).length;
  if (correct === 0) {
    throw new AppError(`${label}: phải có ít nhất một đáp án đúng`, 400, 'Bad Request');
  }
  if ((questionType === 'single_choice' || questionType === 'true_false') && correct !== 1) {
    throw new AppError(`${label}: câu hỏi một đáp án chỉ được có đúng 1 đáp án đúng`, 400, 'Bad Request');
  }
  if (questionType === 'true_false' && choices.length !== 2) {
    throw new AppError(`${label}: câu hỏi Đúng/Sai phải có đúng 2 lựa chọn`, 400, 'Bad Request');
  }
};

const nextOrderIndex = async (quizId, transaction) =>
  ((await Question.max('order_index', { where: { quiz_id: quizId }, transaction })) || 0) + 1;

const createQuestionRecord = async (quizId, data, orderIndex, transaction) => {
  const question = await Question.create({
    quiz_id: quizId,
    prompt: data.content,
    question_type: data.questionType,
    points: data.points ?? 1,
    explanation: data.explanation || null,
    order_index: orderIndex
  }, { transaction });

  await QuestionOption.bulkCreate(data.choices.map((choice, index) => ({
    question_id: question.id,
    option_text: choice.content,
    is_correct: Boolean(choice.isCorrect),
    order_index: index
  })), { transaction });

  return question;
};

/**
 * Cập nhật 1 câu hỏi. choices (nếu có) thay thế toàn bộ: có id -> sửa, không id -> thêm, thiếu -> xóa.
 */
const applyQuestionUpdate = async (question, data, transaction) => {
  const questionType = data.questionType ?? question.question_type;
  const existingOptions = question.question_options || await QuestionOption.findAll({ where: { question_id: question.id }, transaction });

  if (data.choices !== undefined) {
    validateChoices(questionType, data.choices);
    const existingIds = new Set(existingOptions.map((o) => o.id));
    const keptIds = data.choices.filter((c) => c.id).map((c) => c.id);
    if (keptIds.some((id) => !existingIds.has(id))) {
      throw new AppError('Lựa chọn không thuộc câu hỏi này', 400, 'Bad Request');
    }
    if (new Set(keptIds).size !== keptIds.length) {
      throw new AppError('Danh sách lựa chọn bị trùng ID', 400, 'Bad Request');
    }

    // Không dùng NOT IN (NULL) khi keptIds rỗng: SQL trả UNKNOWN nên sẽ không xóa dòng nào
    const removeWhere = keptIds.length ? { question_id: question.id, id: { [Op.notIn]: keptIds } } : { question_id: question.id };
    await QuestionOption.destroy({ where: removeWhere, transaction });
    for (const [index, choice] of data.choices.entries()) {
      const values = { option_text: choice.content, is_correct: Boolean(choice.isCorrect), order_index: index };
      if (choice.id) {
        await QuestionOption.update(values, { where: { id: choice.id }, transaction });
      } else {
        await QuestionOption.create({ ...values, question_id: question.id }, { transaction });
      }
    }
  } else if (data.questionType !== undefined && data.questionType !== question.question_type) {
    // Đổi loại câu hỏi mà giữ nguyên lựa chọn -> vẫn phải hợp lệ với loại mới
    validateChoices(questionType, existingOptions.map((o) => ({ isCorrect: o.is_correct })));
  }

  if (data.content !== undefined) question.prompt = data.content;
  if (data.questionType !== undefined) question.question_type = data.questionType;
  if (data.points !== undefined) question.points = data.points;
  if (data.explanation !== undefined) question.explanation = data.explanation || null;
  await question.save({ transaction });
};

/**
 * Tất cả questionIds phải thuộc đề thi; trả về danh sách câu hỏi (kèm lựa chọn)
 */
const findQuestionsOfQuiz = async (quizId, questionIds, transaction) => {
  if (new Set(questionIds).size !== questionIds.length) {
    throw new AppError('Danh sách câu hỏi bị trùng ID', 400, 'Bad Request');
  }
  const questions = await Question.findAll({
    where: { id: questionIds, quiz_id: quizId },
    include: [{ model: QuestionOption }],
    transaction
  });
  if (questions.length !== questionIds.length) {
    throw new AppError('Không tìm thấy câu hỏi trong đề thi', 404, 'Not Found');
  }
  return questions;
};

const findQuestionOrFail = async (questionId) => {
  const question = await Question.findByPk(questionId, { include: [{ model: QuestionOption }] });
  if (!question) {
    throw new AppError('Không tìm thấy câu hỏi', 404, 'Not Found');
  }
  const quiz = await findQuizOrFail(question.quiz_id).catch(() => null);
  if (!quiz) {
    throw new AppError('Không tìm thấy câu hỏi', 404, 'Not Found');
  }
  return { question, quiz };
};

// ==========================================
// 1. ĐỀ THI
// ==========================================

/**
 * Khóa học học viên đang học (ghi danh active, lớp chưa xóa)
 */
const enrolledCourseIds = async (studentId) => {
  const enrollments = await Enrollment.findAll({
    where: { student_id: studentId, status: 'active' },
    include: [{ model: ClassModel, as: 'class', attributes: ['course_id'], required: true }]
  });
  return [...new Set(enrollments.map((e) => e.class.course_id))];
};

/**
 * GET /quizzes
 * - Học viên: đề đã công khai, thuộc khóa học đã published mà mình đang học
 * - Giảng viên: đề của khóa mình sở hữu hoặc khóa có lớp mình dạy
 * - Quản lý/Admin: toàn bộ
 */
export const getQuizzes = async (query, user) => {
  const { page = 1, limit = 10, lessonId, courseId, search } = query;
  const where = {};
  if (lessonId) where.lesson_id = lessonId;
  if (search) where.title = { [Op.iLike]: `%${search}%` };

  const courseWhere = {};
  if (courseId) courseWhere.id = courseId;

  if (user.role === 'student') {
    where.is_published = true;
    courseWhere.status = 'published';
    const ids = await enrolledCourseIds(user.id);
    courseWhere.id = courseId ? (ids.includes(courseId) ? courseId : null) : ids;
  } else if (user.role === 'teacher') {
    const taught = await ClassModel.findAll({ where: { teacher_id: user.id }, attributes: ['course_id'], raw: true });
    courseWhere[Op.or] = [{ owner_id: user.id }, { id: taught.map((c) => c.course_id) }];
  }

  const { rows, count } = await Quiz.findAndCountAll({
    where,
    include: [{
      model: Lesson,
      attributes: ['id', 'title', 'lesson_type', 'chapter_id'],
      required: true,
      include: [{
        model: Chapter,
        attributes: ['id', 'course_id'],
        required: true,
        include: [{ model: Course, attributes: COURSE_ATTRIBUTES, where: courseWhere, required: true }]
      }]
    }],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true
  });

  const totals = await countQuestions(rows.map((q) => q.id));
  return {
    items: rows.map((quiz) => mapQuiz(quiz, { totalQuestions: totals[quiz.id] || 0 })),
    meta: paginate(page, limit, count)
  };
};

/**
 * POST /quizzes - tạo đề cho bài học loại 'quiz' (mỗi bài học 1 đề)
 */
export const createQuiz = async (data, user) => {
  const lesson = await Lesson.findByPk(data.lessonId, {
    include: [{ model: Chapter, include: [{ model: Course, attributes: COURSE_ATTRIBUTES }] }]
  });
  const course = lesson?.chapter?.course;
  if (!lesson || !course) {
    throw new AppError('Không tìm thấy bài học liên kết', 404, 'Not Found');
  }
  if (!isOwnerOrAdmin(course, user)) {
    throw new AppError('Không có quyền tạo bài kiểm tra cho khóa học này', 403, 'Forbidden');
  }
  assertCourseEditable(course);
  if (lesson.lesson_type !== 'quiz') {
    throw new AppError('Chỉ tạo được bài kiểm tra cho bài học loại "Quiz"', 400, 'Bad Request');
  }
  if ((await Quiz.count({ where: { lesson_id: lesson.id } })) > 0) {
    throw new AppError('Bài học này đã có bài kiểm tra', 409, 'Conflict');
  }

  const quiz = await Quiz.create({
    lesson_id: lesson.id,
    title: data.title,
    description: data.description || null,
    duration_minutes: data.durationMinutes,
    max_attempts: data.maxAttempts,
    pass_score: data.passScore,
    show_answers_after_submit: data.showAnswersAfterSubmit ?? true,
    is_published: data.isPublished ?? false
  });

  return mapQuiz(await findQuizOrFail(quiz.id), { totalQuestions: 0 });
};

/**
 * PATCH /quizzes/:id
 */
export const updateQuiz = async (quizId, data, user) => {
  const quiz = await findQuizOrFail(quizId);
  assertCanEditQuiz(quiz, user);

  if (data.isPublished === true && !quiz.is_published) {
    const total = await Question.count({ where: { quiz_id: quiz.id } });
    if (total === 0) {
      throw new AppError('Bài kiểm tra chưa có câu hỏi nên chưa thể công khai', 400, 'Bad Request');
    }
  }

  const fields = {
    title: 'title',
    description: 'description',
    durationMinutes: 'duration_minutes',
    maxAttempts: 'max_attempts',
    passScore: 'pass_score',
    showAnswersAfterSubmit: 'show_answers_after_submit',
    isPublished: 'is_published'
  };
  Object.entries(fields).forEach(([key, column]) => {
    if (data[key] !== undefined) quiz[column] = data[key];
  });
  await quiz.save();

  const totals = await countQuestions([quiz.id]);
  return mapQuiz(quiz, { totalQuestions: totals[quiz.id] || 0 });
};

/**
 * DELETE /quizzes/:id - xóa mềm
 */
export const deleteQuiz = async (quizId, user) => {
  const quiz = await findQuizOrFail(quizId);
  assertCanEditQuiz(quiz, user);
  await quiz.destroy();
  return true;
};

// ==========================================
// 2. CÂU HỎI
// ==========================================

/**
 * GET /quizzes/:quizId/questions - kèm đáp án đúng, chỉ người dạy
 */
export const getQuestions = async (quizId, user) => {
  const quiz = await findQuizOrFail(quizId);
  if (!(await canViewAsStaff(courseOfQuiz(quiz), user))) {
    throw new AppError('Không có quyền xem câu hỏi', 403, 'Forbidden');
  }
  return (await loadQuestions(quiz.id)).map((q) => mapQuestion(q));
};

/**
 * POST /quizzes/:quizId/questions
 */
export const createQuestion = async (quizId, data, user) => {
  const quiz = await findQuizOrFail(quizId);
  assertCanEditQuiz(quiz, user);
  validateChoices(data.questionType, data.choices);

  const question = await sequelize.transaction(async (transaction) =>
    createQuestionRecord(quiz.id, data, data.orderIndex ?? await nextOrderIndex(quiz.id, transaction), transaction));

  return {
    id: question.id,
    quizId: quiz.id,
    content: question.prompt,
    points: toNumber(question.points),
    choicesCount: data.choices.length,
    createdAt: new Date().toISOString()
  };
};

/**
 * POST /quizzes/:quizId/questions/bulk - lưu danh sách câu hỏi (VD: kết quả Gemini AI) trong 1 transaction
 */
export const bulkCreateQuestions = async (quizId, questions, user) => {
  const quiz = await findQuizOrFail(quizId);
  assertCanEditQuiz(quiz, user);
  questions.forEach((q, index) => validateChoices(q.questionType, q.choices, `Câu ${index + 1}`));

  await sequelize.transaction(async (transaction) => {
    let orderIndex = await nextOrderIndex(quiz.id, transaction);
    for (const question of questions) {
      await createQuestionRecord(quiz.id, question, orderIndex++, transaction);
    }
  });

  return { quizId: quiz.id, insertedCount: questions.length };
};

/**
 * PATCH /quizzes/:quizId/questions/reorder
 */
export const reorderQuestions = async (quizId, orders, user) => {
  const quiz = await findQuizOrFail(quizId);
  assertCanEditQuiz(quiz, user);
  if (new Set(orders.map((o) => o.orderIndex)).size !== orders.length) {
    throw new AppError('Dữ liệu sắp xếp không hợp lệ: orderIndex bị trùng', 400, 'Bad Request');
  }

  await sequelize.transaction(async (transaction) => {
    await findQuestionsOfQuiz(quiz.id, orders.map((o) => o.id), transaction);
    for (const { id, orderIndex } of orders) {
      await Question.update({ order_index: orderIndex }, { where: { id }, transaction });
    }
  });

  return { quizId: quiz.id, updatedCount: orders.length };
};

/**
 * PATCH /quizzes/:quizId/questions/bulk - mode 'details' (sửa từng câu) hoặc 'common_points' (gán điểm chung)
 */
export const bulkUpdateQuestions = async (quizId, data, user) => {
  const quiz = await findQuizOrFail(quizId);
  assertCanEditQuiz(quiz, user);

  if (data.mode === 'common_points') {
    await sequelize.transaction(async (transaction) => {
      await findQuestionsOfQuiz(quiz.id, data.questionIds, transaction);
      await Question.update({ points: data.commonPoints }, { where: { id: data.questionIds }, transaction });
    });
    return { quizId: quiz.id, updatedCount: data.questionIds.length };
  }

  await sequelize.transaction(async (transaction) => {
    const questions = await findQuestionsOfQuiz(quiz.id, data.questions.map((q) => q.id), transaction);
    const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
    for (const item of data.questions) {
      await applyQuestionUpdate(byId[item.id], item, transaction);
    }
  });
  return { quizId: quiz.id, updatedCount: data.questions.length };
};

/**
 * DELETE /quizzes/:quizId/questions/bulk
 */
export const bulkDeleteQuestions = async (quizId, questionIds, user) => {
  const quiz = await findQuizOrFail(quizId);
  assertCanEditQuiz(quiz, user);

  await sequelize.transaction(async (transaction) => {
    await findQuestionsOfQuiz(quiz.id, questionIds, transaction);
    await Question.destroy({ where: { id: questionIds }, transaction });
  });
  return { quizId: quiz.id, deletedCount: questionIds.length };
};

/**
 * PATCH /questions/:id
 */
export const updateQuestion = async (questionId, data, user) => {
  const { question, quiz } = await findQuestionOrFail(questionId);
  assertCanEditQuiz(quiz, user);

  await sequelize.transaction(async (transaction) => applyQuestionUpdate(question, data, transaction));

  const [updated] = await Question.findAll({ where: { id: question.id }, include: [{ model: QuestionOption }] });
  return { ...mapQuestion(updated), updatedAt: new Date().toISOString() };
};

/**
 * DELETE /questions/:id - lựa chọn bị xóa theo (ON DELETE CASCADE)
 */
export const deleteQuestion = async (questionId, user) => {
  const { question, quiz } = await findQuestionOrFail(questionId);
  assertCanEditQuiz(quiz, user);
  await question.destroy();
  return true;
};

export default {
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuestions,
  createQuestion,
  bulkCreateQuestions,
  reorderQuestions,
  bulkUpdateQuestions,
  bulkDeleteQuestions,
  updateQuestion,
  deleteQuestion
};
