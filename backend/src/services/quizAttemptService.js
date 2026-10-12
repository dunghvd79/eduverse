import { Op } from 'sequelize';
import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { findClassOrFail, canManageClass, isActiveMember } from './classService.js';
import { findQuizOrFail, courseOfQuiz, canViewAsStaff, countQuestions, mapQuestion } from './quizService.js';

const {
  sequelize, Quiz, Question, QuestionOption, Lesson, Chapter, ClassModel, ClassQuiz,
  Enrollment, QuizAttempt, QuizAttemptAnswer, LessonProgress, User
} = models;

// Ân hạn mạng khi nộp bài (api-quizzes.md mục 3: Server-side Time Authority)
const GRACE_SECONDS = 30;
const FINISHED = ['completed', 'timed_out'];

// ==========================================
// HELPERS
// ==========================================
const toNumber = (value) => (value === null || value === undefined ? null : Number(value));
const round2 = (value) => Math.round(value * 100) / 100;

const deadlineOf = (attempt, quiz) => new Date(new Date(attempt.started_at).getTime() + quiz.duration_minutes * 60 * 1000);
const isExpired = (attempt, quiz, now = new Date()) =>
  now.getTime() > deadlineOf(attempt, quiz).getTime() + GRACE_SECONDS * 1000;

const isPassed = (attempt, quiz) =>
  FINISHED.includes(attempt.status) && attempt.score !== null && Number(attempt.score) >= Number(quiz.pass_score);

/**
 * Lượt làm đang dở nhưng đã quá giờ (học viên tắt máy/mất mạng) -> chốt 'timed_out', 0 điểm.
 * Câu trả lời chỉ gửi lên khi nộp bài nên không còn gì để chấm.
 */
const finalizeExpired = async (attempts, quiz) => {
  const now = new Date();
  for (const attempt of attempts) {
    if (attempt.status === 'in_progress' && isExpired(attempt, quiz, now)) {
      const [updated] = await QuizAttempt.update(
        { status: 'timed_out', score: 0, submitted_at: deadlineOf(attempt, quiz) },
        { where: { id: attempt.id, status: 'in_progress' } }
      );
      if (updated) {
        attempt.status = 'timed_out';
        attempt.score = 0;
        attempt.submitted_at = deadlineOf(attempt, quiz);
      }
    }
  }
  return attempts;
};

/**
 * Lớp của khóa học mà học viên đang học. Học nhiều lớp cùng khóa thì bắt buộc truyền classId.
 */
const resolveStudentClass = async (courseId, studentId, classId) => {
  const enrollments = await Enrollment.findAll({
    where: { student_id: studentId, status: 'active' },
    include: [{
      model: ClassModel,
      as: 'class',
      required: true,
      where: { course_id: courseId, ...(classId ? { id: classId } : {}) }
    }]
  });
  if (enrollments.length === 0) {
    throw new AppError(
      classId ? 'Bạn không thuộc lớp học này hoặc lớp không thuộc khóa học của bài kiểm tra' : 'Bạn chưa ghi danh vào lớp học nào của khóa học này',
      403,
      'Forbidden'
    );
  }
  if (enrollments.length > 1) {
    throw new AppError('Bạn đang học nhiều lớp của khóa học này, vui lòng chọn lớp (classId)', 400, 'Bad Request');
  }
  return enrollments[0].class;
};

/**
 * Lịch mở đề theo lớp. Lớp chưa có bản ghi class_quizzes = mở tự do (không giới hạn giờ).
 */
const availabilityOf = (cls, classQuiz, now = new Date()) => {
  const schedule = {
    openTime: classQuiz?.open_time || null,
    closeTime: classQuiz?.close_time || null,
    isActive: classQuiz ? classQuiz.is_active : true
  };
  let reason = null;
  if (cls.status !== 'active') reason = 'Lớp học không còn hoạt động';
  else if (!schedule.isActive) reason = 'Giảng viên đã tạm khóa bài kiểm tra này';
  else if (schedule.openTime && new Date(schedule.openTime) > now) reason = 'Chưa đến giờ mở bài kiểm tra';
  else if (schedule.closeTime && new Date(schedule.closeTime) < now) reason = 'Đã hết hạn làm bài kiểm tra';
  return { schedule, isAvailable: !reason, reason };
};

const findOrCreateClassQuiz = async (classId, quizId, transaction) => {
  try {
    const [classQuiz] = await ClassQuiz.findOrCreate({
      where: { class_id: classId, quiz_id: quizId },
      defaults: { class_id: classId, quiz_id: quizId, is_active: true },
      transaction
    });
    return classQuiz;
  } catch (error) {
    // Hai học viên cùng bắt đầu lần đầu -> bản ghi đã được request kia tạo
    if (error.name === 'SequelizeUniqueConstraintError') {
      return ClassQuiz.findOne({ where: { class_id: classId, quiz_id: quizId }, transaction });
    }
    throw error;
  }
};

const loadQuestions = (quizId) => Question.findAll({
  where: { quiz_id: quizId },
  include: [{ model: QuestionOption }],
  order: [['order_index', 'ASC'], [QuestionOption, 'order_index', 'ASC']]
});

const paginate = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return { page, limit, totalItems, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
};

const mapQuizSummary = (quiz) => ({
  id: quiz.id,
  title: quiz.title,
  description: quiz.description,
  lessonId: quiz.lesson_id,
  durationMinutes: quiz.duration_minutes,
  maxAttempts: quiz.max_attempts,
  passScore: toNumber(quiz.pass_score),
  isPublished: quiz.is_published,
  showAnswersAfterSubmit: quiz.show_answers_after_submit
});

const studentAttemptsOf = async (classQuizId, studentId, quiz) => {
  if (!classQuizId) return [];
  const attempts = await QuizAttempt.findAll({
    where: { class_quiz_id: classQuizId, student_id: studentId },
    order: [['attempt_number', 'ASC']]
  });
  return finalizeExpired(attempts, quiz);
};

/**
 * Tóm tắt tình trạng làm bài của 1 học viên trong 1 lớp
 */
const studentSummary = (attempts, quiz) => {
  const finished = attempts.filter((a) => FINISHED.includes(a.status));
  const inProgress = attempts.find((a) => a.status === 'in_progress');
  const scores = finished.map((a) => Number(a.score));
  const bestScore = scores.length ? Math.max(...scores) : null;
  return {
    userAttemptsCount: attempts.length,
    remainingAttempts: Math.max(0, quiz.max_attempts - attempts.length),
    inProgressAttemptId: inProgress?.id || null,
    bestScore,
    passed: bestScore !== null && bestScore >= Number(quiz.pass_score)
  };
};

// ==========================================
// 1. THÔNG TIN ĐỀ THI (trước khi làm bài)
// ==========================================

/**
 * GET /quizzes/:id (?classId)
 * - Người dạy: cấu hình đề
 * - Học viên: kèm số lượt đã làm/còn lại, điểm cao nhất, đề có đang mở cho lớp mình không
 */
export const getQuizById = async (quizId, user, { classId } = {}) => {
  const quiz = await findQuizOrFail(quizId);
  const course = courseOfQuiz(quiz);
  const totals = await countQuestions([quiz.id]);
  const base = {
    ...mapQuizSummary(quiz),
    lessonTitle: quiz.lesson?.title || null,
    course: { id: course.id, title: course.title, status: course.status },
    totalQuestions: totals[quiz.id] || 0
  };

  if (user.role !== 'student') {
    if (!(await canViewAsStaff(course, user))) {
      throw new AppError('Không có quyền xem bài kiểm tra này', 403, 'Forbidden');
    }
    // canEdit: chủ khóa/Admin và khóa học đang soạn (draft/rejected) - frontend chuyển sang chế độ chỉ đọc nếu false
    const canEdit = (user.role === 'admin' || course.owner_id === user.id) && ['draft', 'rejected'].includes(course.status);
    return { ...base, canEdit };
  }

  // Học viên không được biết đề chưa công khai tồn tại
  if (!quiz.is_published || course.status !== 'published') {
    throw new AppError('Không tìm thấy bài kiểm tra', 404, 'Not Found');
  }
  const cls = await resolveStudentClass(course.id, user.id, classId);
  const classQuiz = await ClassQuiz.findOne({ where: { class_id: cls.id, quiz_id: quiz.id } });
  const attempts = await studentAttemptsOf(classQuiz?.id, user.id, quiz);
  const summary = studentSummary(attempts, quiz);
  const { schedule, isAvailable, reason } = availabilityOf(cls, classQuiz);

  const canStart = summary.inProgressAttemptId ? true : isAvailable && summary.remainingAttempts > 0 && base.totalQuestions > 0;
  let unavailableReason = null;
  if (!canStart) {
    unavailableReason = reason
      || (summary.remainingAttempts === 0 ? 'Bạn đã sử dụng hết số lần làm bài cho phép' : 'Bài kiểm tra chưa có câu hỏi');
  }

  return {
    ...base,
    classId: cls.id,
    className: cls.name,
    ...schedule,
    ...summary,
    isAvailable: canStart,
    unavailableReason
  };
};

// ==========================================
// 2. LÀM BÀI & CHẤM ĐIỂM
// ==========================================

const startPayload = (attempt, quiz, cls, questions, resumed) => ({
  attemptId: attempt.id,
  attemptNumber: attempt.attempt_number,
  quizId: quiz.id,
  quizTitle: quiz.title,
  classId: cls.id,
  durationMinutes: quiz.duration_minutes,
  startedAt: attempt.started_at,
  deadline: deadlineOf(attempt, quiz),
  serverTime: new Date(),
  resumed,
  // Chống gian lận F12: không trả isCorrect / explanation
  questions: questions.map((q) => mapQuestion(q, { withAnswers: false }))
});

/**
 * POST /quizzes/:id/attempts (?classId)
 * Đang có lượt làm dở còn hạn -> trả lại lượt đó (tải lại trang không mất lượt).
 */
export const startAttempt = async (quizId, user, { classId } = {}) => {
  const quiz = await findQuizOrFail(quizId);
  const course = courseOfQuiz(quiz);
  if (!quiz.is_published || course.status !== 'published') {
    throw new AppError('Bài kiểm tra hiện không khả dụng', 400, 'Bad Request');
  }
  const cls = await resolveStudentClass(course.id, user.id, classId);
  const questions = await loadQuestions(quiz.id);
  if (questions.length === 0) {
    throw new AppError('Bài kiểm tra chưa có câu hỏi', 400, 'Bad Request');
  }

  const classQuiz = await findOrCreateClassQuiz(cls.id, quiz.id);
  const attempts = await studentAttemptsOf(classQuiz.id, user.id, quiz);
  const inProgress = attempts.find((a) => a.status === 'in_progress');
  if (inProgress) {
    return { resumed: true, data: startPayload(inProgress, quiz, cls, questions, true) };
  }

  const { isAvailable, reason } = availabilityOf(cls, classQuiz);
  if (!isAvailable) {
    throw new AppError(reason, 400, 'Bad Request');
  }
  if (attempts.length >= quiz.max_attempts) {
    throw new AppError('Bạn đã sử dụng hết số lần làm bài cho phép', 403, 'Forbidden');
  }

  let attempt;
  try {
    attempt = await QuizAttempt.create({
      class_quiz_id: classQuiz.id,
      student_id: user.id,
      attempt_number: attempts.length + 1,
      started_at: new Date(),
      status: 'in_progress'
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Bài kiểm tra đang được bắt đầu ở một phiên khác, vui lòng tải lại trang', 409, 'Conflict');
    }
    throw error;
  }

  return { resumed: false, data: startPayload(attempt, quiz, cls, questions, false) };
};

/**
 * Kiểm tra & chuẩn hóa câu trả lời: { [questionId]: Set(choiceId) }
 */
const normalizeAnswers = (answers, questions) => {
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  const selected = {};
  for (const answer of answers) {
    const question = byId[answer.questionId];
    if (!question) {
      throw new AppError('Câu trả lời chứa câu hỏi không thuộc bài kiểm tra', 400, 'Bad Request');
    }
    if (selected[answer.questionId]) {
      throw new AppError('Mỗi câu hỏi chỉ được gửi một câu trả lời', 400, 'Bad Request');
    }
    const optionIds = new Set(question.question_options.map((o) => o.id));
    const choiceIds = [...new Set(answer.selectedChoiceIds)];
    if (choiceIds.some((id) => !optionIds.has(id))) {
      throw new AppError('Lựa chọn không thuộc câu hỏi tương ứng', 400, 'Bad Request');
    }
    if (question.question_type !== 'multiple_choice' && choiceIds.length > 1) {
      throw new AppError('Câu hỏi một đáp án chỉ được chọn một lựa chọn', 400, 'Bad Request');
    }
    selected[answer.questionId] = new Set(choiceIds);
  }
  return selected;
};

/**
 * Chấm theo api-quizzes.md mục 3: đúng và đủ tập đáp án đúng mới được điểm câu; điểm = tổng điểm đúng / tổng điểm × 10
 */
const grade = (questions, selected) => {
  let totalPoints = 0;
  let earnedPoints = 0;
  let correctCount = 0;
  const rows = questions.map((question) => {
    const points = Number(question.points);
    const correctIds = new Set(question.question_options.filter((o) => o.is_correct).map((o) => o.id));
    const chosen = selected[question.id] || new Set();
    const isCorrect = chosen.size > 0 && chosen.size === correctIds.size && [...chosen].every((id) => correctIds.has(id));
    totalPoints += points;
    if (isCorrect) {
      earnedPoints += points;
      correctCount += 1;
    }
    return { questionId: question.id, selectedOptionIds: [...chosen], isCorrect };
  });
  const score = totalPoints > 0 ? round2((earnedPoints / totalPoints) * 10) : 0;
  return { rows, score, correctCount };
};

/**
 * POST /quiz-attempts/:attemptId/submit
 */
export const submitAttempt = async (attemptId, user, answers) => {
  const outcome = await sequelize.transaction(async (transaction) => {
    // Khóa dòng attempt: 2 request nộp song song chỉ một request được chấm
    const attempt = await QuizAttempt.findByPk(attemptId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!attempt) {
      throw new AppError('Không tìm thấy phiên làm bài', 404, 'Not Found');
    }
    if (attempt.student_id !== user.id) {
      throw new AppError('Phiên thi không thuộc về bạn', 403, 'Forbidden');
    }
    if (attempt.status !== 'in_progress') {
      throw new AppError('Bài thi này đã được nộp trước đó', 400, 'Bad Request');
    }

    const classQuiz = await ClassQuiz.findByPk(attempt.class_quiz_id, { transaction });
    const quiz = await Quiz.findByPk(classQuiz.quiz_id, { paranoid: false, transaction });
    const now = new Date();

    if (isExpired(attempt, quiz, now)) {
      attempt.status = 'timed_out';
      attempt.score = 0;
      attempt.submitted_at = now;
      await attempt.save({ transaction });
      return { late: true };
    }

    const questions = await Question.findAll({
      where: { quiz_id: quiz.id },
      include: [{ model: QuestionOption }],
      transaction
    });
    const { rows, score, correctCount } = grade(questions, normalizeAnswers(answers, questions));

    await QuizAttemptAnswer.bulkCreate(rows.map((row) => ({
      attempt_id: attempt.id,
      question_id: row.questionId,
      selected_option_id: row.selectedOptionIds[0] || null,
      selected_option_ids: row.selectedOptionIds,
      is_correct: row.isCorrect
    })), { transaction });

    attempt.status = 'completed';
    attempt.score = score;
    attempt.submitted_at = now;
    await attempt.save({ transaction });

    const passed = score >= Number(quiz.pass_score);
    // Đạt bài kiểm tra -> bài học dạng quiz được tính là hoàn thành trong tiến độ lớp
    if (passed) {
      const [progress] = await LessonProgress.findOrCreate({
        where: { class_id: classQuiz.class_id, student_id: user.id, lesson_id: quiz.lesson_id },
        defaults: { is_completed: true, completed_at: now },
        transaction
      });
      if (!progress.is_completed) {
        progress.is_completed = true;
        progress.completed_at = now;
        await progress.save({ transaction });
      }
    }

    return {
      data: {
        attemptId: attempt.id,
        quizId: quiz.id,
        classId: classQuiz.class_id,
        attemptNumber: attempt.attempt_number,
        status: attempt.status,
        score,
        totalQuestions: questions.length,
        correctCount,
        passed,
        passScore: toNumber(quiz.pass_score),
        submittedAt: now
      }
    };
  });

  if (outcome.late) {
    throw new AppError('Đã quá thời gian nộp bài cho phép', 400, 'Bad Request');
  }
  return outcome.data;
};

// ==========================================
// 3. LỊCH SỬ & XEM LẠI BÀI LÀM
// ==========================================

/**
 * GET /quizzes/:id/my-attempts
 */
export const getMyAttempts = async (quizId, user, query) => {
  const quiz = await findQuizOrFail(quizId);
  const { page = 1, limit = 10, sortBy = 'submittedAt', sortOrder = 'DESC', status } = query;

  const attempts = await QuizAttempt.findAll({
    where: { student_id: user.id },
    include: [{ model: ClassQuiz, where: { quiz_id: quiz.id }, attributes: ['id', 'class_id'] }]
  });
  await finalizeExpired(attempts, quiz);

  const filtered = attempts.filter((a) => !status || a.status === status);
  const value = {
    score: (a) => (a.score === null ? -1 : Number(a.score)),
    submittedAt: (a) => (a.submitted_at ? new Date(a.submitted_at).getTime() : Number.MAX_SAFE_INTEGER),
    attemptNumber: (a) => a.attempt_number
  }[sortBy];
  const direction = sortOrder === 'ASC' ? 1 : -1;
  filtered.sort((a, b) => (value(a) - value(b)) * direction);

  return {
    items: filtered.slice((page - 1) * limit, page * limit).map((a) => ({
      attemptId: a.id,
      attemptNumber: a.attempt_number,
      classId: a.class_quiz.class_id,
      score: toNumber(a.score),
      passed: isPassed(a, quiz),
      startedAt: a.started_at,
      submittedAt: a.submitted_at,
      status: a.status
    })),
    meta: paginate(page, limit, filtered.length)
  };
};

/**
 * GET /quiz-attempts/:attemptId
 * - Học viên chủ bài: chỉ xem khi đã nộp; đáp án đúng & giải thích chỉ hiện nếu showAnswersAfterSubmit
 * - Người dạy (Admin, Quản lý, chủ khóa, GV phụ trách lớp): luôn xem đầy đủ
 */
export const getAttemptDetail = async (attemptId, user) => {
  const attempt = await QuizAttempt.findByPk(attemptId, {
    include: [
      { model: ClassQuiz, include: [{ model: ClassModel, attributes: ['id', 'name', 'teacher_id'], paranoid: false }] },
      { model: QuizAttemptAnswer },
      { model: User, as: 'student', attributes: ['id', 'full_name', 'email'] }
    ]
  });
  if (!attempt) {
    throw new AppError('Không tìm thấy phiên làm bài', 404, 'Not Found');
  }
  const quiz = await findQuizOrFail(attempt.class_quiz.quiz_id, { paranoid: false });
  const course = courseOfQuiz(quiz);

  const isOwnerStudent = attempt.student_id === user.id;
  const isStaff = user.role === 'admin' || user.role === 'training_manager'
    || course.owner_id === user.id || attempt.class_quiz.class?.teacher_id === user.id;
  if (!isOwnerStudent && !isStaff) {
    throw new AppError('Không có quyền xem bài làm này', 403, 'Forbidden');
  }

  await finalizeExpired([attempt], quiz);
  if (isOwnerStudent && attempt.status === 'in_progress') {
    throw new AppError('Bài thi chưa được nộp', 400, 'Bad Request');
  }

  const reveal = isStaff || quiz.show_answers_after_submit;
  const answerByQuestion = Object.fromEntries((attempt.quiz_attempt_answers || []).map((a) => [a.question_id, a]));
  const questions = await loadQuestions(quiz.id);

  return {
    attemptId: attempt.id,
    attemptNumber: attempt.attempt_number,
    quizId: quiz.id,
    quizTitle: quiz.title,
    classId: attempt.class_quiz.class_id,
    className: attempt.class_quiz.class?.name || null,
    student: isStaff ? { id: attempt.student.id, fullName: attempt.student.full_name, email: attempt.student.email } : undefined,
    status: attempt.status,
    score: toNumber(attempt.score),
    passed: isPassed(attempt, quiz),
    passScore: toNumber(quiz.pass_score),
    correctCount: (attempt.quiz_attempt_answers || []).filter((a) => a.is_correct).length,
    totalQuestions: questions.length,
    startedAt: attempt.started_at,
    submittedAt: attempt.submitted_at,
    showAnswers: reveal,
    questions: questions.map((question) => {
      const answer = answerByQuestion[question.id];
      const selectedChoiceIds = answer?.selected_option_ids?.length
        ? answer.selected_option_ids
        : (answer?.selected_option_id ? [answer.selected_option_id] : []);
      return {
        ...mapQuestion(question, { withAnswers: reveal }),
        selectedChoiceIds,
        ...(reveal ? {
          isCorrect: Boolean(answer?.is_correct),
          correctChoiceIds: question.question_options.filter((o) => o.is_correct).map((o) => o.id)
        } : {})
      };
    })
  };
};

/**
 * GET /quizzes/:id/attempts - kết quả của học viên
 * Chủ khóa / Admin: mọi lớp; GV phụ trách lớp: chỉ lớp mình dạy.
 */
export const getQuizAttempts = async (quizId, user, query) => {
  const quiz = await findQuizOrFail(quizId);
  const course = courseOfQuiz(quiz);
  const { page = 1, limit = 20, search, sortBy = 'submittedAt', sortOrder = 'DESC', passed, status, classId } = query;

  const classWhere = {};
  if (!(user.role === 'admin' || course.owner_id === user.id)) {
    const taught = await ClassModel.findAll({ where: { course_id: course.id, teacher_id: user.id }, attributes: ['id'], raw: true });
    if (taught.length === 0) {
      throw new AppError('Không có quyền xem kết quả bài kiểm tra này', 403, 'Forbidden');
    }
    classWhere.id = taught.map((c) => c.id);
  }
  if (classId) {
    classWhere.id = classWhere.id ? classWhere.id.filter((id) => id === classId) : classId;
  }

  const attempts = await QuizAttempt.findAll({
    include: [
      {
        model: ClassQuiz,
        where: { quiz_id: quiz.id },
        include: [{ model: ClassModel, attributes: ['id', 'name'], where: classWhere, required: true }]
      },
      { model: User, as: 'student', attributes: ['id', 'full_name', 'email'] }
    ]
  });
  await finalizeExpired(attempts, quiz);

  const keyword = search?.toLowerCase();
  const filtered = attempts.filter((a) =>
    (!status || a.status === status) &&
    (passed === undefined || isPassed(a, quiz) === passed) &&
    (!keyword || a.student.full_name.toLowerCase().includes(keyword) || a.student.email.toLowerCase().includes(keyword))
  );

  const direction = sortOrder === 'ASC' ? 1 : -1;
  const compare = {
    score: (a, b) => (a.score === null ? -1 : Number(a.score)) - (b.score === null ? -1 : Number(b.score)),
    studentName: (a, b) => a.student.full_name.localeCompare(b.student.full_name, 'vi'),
    submittedAt: (a, b) => new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0)
  }[sortBy];
  filtered.sort((a, b) => compare(a, b) * direction);

  // Thống kê theo điểm cao nhất của mỗi học viên
  const finished = attempts.filter((a) => FINISHED.includes(a.status));
  const bestByStudent = {};
  finished.forEach((a) => {
    bestByStudent[a.student_id] = Math.max(bestByStudent[a.student_id] ?? -1, Number(a.score));
  });
  const bests = Object.values(bestByStudent);

  return {
    summary: {
      totalAttempts: attempts.length,
      studentsAttempted: new Set(attempts.map((a) => a.student_id)).size,
      averageBestScore: bests.length ? round2(bests.reduce((s, v) => s + v, 0) / bests.length) : null,
      passedStudents: bests.filter((v) => v >= Number(quiz.pass_score)).length
    },
    items: filtered.slice((page - 1) * limit, page * limit).map((a) => ({
      attemptId: a.id,
      attemptNumber: a.attempt_number,
      student: { id: a.student.id, fullName: a.student.full_name, email: a.student.email },
      class: { id: a.class_quiz.class.id, name: a.class_quiz.class.name },
      score: toNumber(a.score),
      passed: isPassed(a, quiz),
      startedAt: a.started_at,
      submittedAt: a.submitted_at,
      status: a.status
    })),
    meta: paginate(page, limit, filtered.length)
  };
};

// ==========================================
// 4. ĐỀ THI THEO LỚP (bổ sung - không có trong api-quizzes.md)
// ==========================================

const courseQuizzes = (courseId, { publishedOnly }) => Quiz.findAll({
  where: publishedOnly ? { is_published: true } : {},
  include: [{
    model: Lesson,
    attributes: ['id', 'title', 'order_index'],
    required: true,
    include: [{ model: Chapter, attributes: ['id', 'order_index'], where: { course_id: courseId }, required: true }]
  }],
  order: [[Lesson, Chapter, 'order_index', 'ASC'], [Lesson, 'order_index', 'ASC']]
});

/**
 * GET /classes/:id/quizzes
 * - Học viên trong lớp: đề đã công khai + tình trạng làm bài của mình
 * - GV phụ trách / Quản lý / Admin: mọi đề của khóa + lịch mở & thống kê của lớp
 */
export const getClassQuizzes = async (classId, user) => {
  const cls = await findClassOrFail(classId);
  const manager = canManageClass(cls, user);
  if (!manager && !(user.role === 'student' && await isActiveMember(cls.id, user.id))) {
    throw new AppError('Không có quyền xem bài kiểm tra của lớp này', 403, 'Forbidden');
  }
  if (!manager && cls.course.status !== 'published') return [];

  const quizzes = await courseQuizzes(cls.course_id, { publishedOnly: !manager });
  const quizIds = quizzes.map((q) => q.id);
  const totals = await countQuestions(quizIds);
  const classQuizzes = await ClassQuiz.findAll({ where: { class_id: cls.id, quiz_id: quizIds } });
  const classQuizByQuiz = Object.fromEntries(classQuizzes.map((cq) => [cq.quiz_id, cq]));

  // Thống kê lớp (người quản lý): 1 truy vấn cho mọi đề
  let attemptsByClassQuiz = {};
  if (manager && classQuizzes.length) {
    const attempts = await QuizAttempt.findAll({ where: { class_quiz_id: classQuizzes.map((cq) => cq.id) } });
    attemptsByClassQuiz = attempts.reduce((acc, a) => ((acc[a.class_quiz_id] ||= []).push(a), acc), {});
  }

  return Promise.all(quizzes.map(async (quiz) => {
    const classQuiz = classQuizByQuiz[quiz.id];
    const { schedule, isAvailable, reason } = availabilityOf(cls, classQuiz);
    const item = {
      ...mapQuizSummary(quiz),
      lessonTitle: quiz.lesson.title,
      totalQuestions: totals[quiz.id] || 0,
      ...schedule,
      isAvailable: isAvailable && quiz.is_published,
      unavailableReason: reason || (quiz.is_published ? null : 'Bài kiểm tra chưa được công khai')
    };

    if (!manager) {
      const summary = studentSummary(await studentAttemptsOf(classQuiz?.id, user.id, quiz), quiz);
      return {
        ...item,
        ...summary,
        isAvailable: summary.inProgressAttemptId ? true : item.isAvailable && summary.remainingAttempts > 0 && item.totalQuestions > 0
      };
    }

    const attempts = await finalizeExpired(attemptsByClassQuiz[classQuiz?.id] || [], quiz);
    const best = {};
    attempts.filter((a) => FINISHED.includes(a.status)).forEach((a) => {
      best[a.student_id] = Math.max(best[a.student_id] ?? -1, Number(a.score));
    });
    const bests = Object.values(best);
    return {
      ...item,
      stats: {
        totalAttempts: attempts.length,
        studentsAttempted: new Set(attempts.map((a) => a.student_id)).size,
        passedStudents: bests.filter((v) => v >= Number(quiz.pass_score)).length,
        averageBestScore: bests.length ? round2(bests.reduce((s, v) => s + v, 0) / bests.length) : null
      }
    };
  }));
};

/**
 * PUT /classes/:id/quizzes/:quizId - đặt lịch mở/đóng, bật/tắt đề cho lớp
 */
export const updateClassQuiz = async (classId, quizId, data, user) => {
  const cls = await findClassOrFail(classId);
  if (!canManageClass(cls, user)) {
    throw new AppError('Không có quyền thay đổi lịch bài kiểm tra của lớp này', 403, 'Forbidden');
  }
  const quiz = await findQuizOrFail(quizId);
  if (courseOfQuiz(quiz).id !== cls.course_id) {
    throw new AppError('Bài kiểm tra không thuộc khóa học của lớp này', 400, 'Bad Request');
  }

  const classQuiz = await findOrCreateClassQuiz(cls.id, quiz.id);
  const openTime = data.openTime !== undefined ? data.openTime : classQuiz.open_time;
  const closeTime = data.closeTime !== undefined ? data.closeTime : classQuiz.close_time;
  if (openTime && closeTime && new Date(closeTime) <= new Date(openTime)) {
    throw new AppError('Thời điểm đóng đề phải sau thời điểm mở đề', 400, 'Bad Request');
  }

  classQuiz.open_time = openTime;
  classQuiz.close_time = closeTime;
  if (data.isActive !== undefined) classQuiz.is_active = data.isActive;
  await classQuiz.save();

  const { schedule, isAvailable, reason } = availabilityOf(cls, classQuiz);
  return { classId: cls.id, quizId: quiz.id, ...schedule, isAvailable, unavailableReason: reason };
};

export default {
  getQuizById,
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getAttemptDetail,
  getQuizAttempts,
  getClassQuizzes,
  updateClassQuiz
};
