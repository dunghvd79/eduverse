import models from '../models/index.js';
import { windowOf } from './assignmentService.js';
import { FINISHED, isExpired, availabilityOf } from './quizAttemptService.js';
import { countQuestions } from './quizService.js';
import { summarizeTodoByClass } from '../utils/studentTodo.js';

const { Lesson, Chapter, Quiz, ClassQuiz, QuizAttempt, Assignment, ClassAssignment, AssignmentSubmission } = models;

/**
 * "Việc cần làm" của học viên (bài tập, bài kiểm tra) - dùng chung cho trang Tổng quan và trang Khóa học của tôi.
 * Tách khỏi dashboardService/classService vì assignmentService, quizAttemptService đã import classService (tránh vòng import).
 * `classes` chỉ cần { id, name, course_id, status }; người gọi tự lọc lớp đang hoạt động + khóa học published.
 */

/**
 * Việc cần làm - bài tập: chưa nộp và còn trong hạn (kể cả hạn nộp muộn), hoặc GV yêu cầu nộp lại.
 */
export const studentAssignmentTodo = async (classes, studentId, now) => {
  const classById = Object.fromEntries(classes.map((c) => [c.id, c]));
  const classAssignments = await ClassAssignment.findAll({
    where: { class_id: classes.map((c) => c.id) },
    include: [{ model: Assignment, attributes: ['id', 'title'], required: true }]
  });
  if (classAssignments.length === 0) return [];

  const submissions = await AssignmentSubmission.findAll({
    where: { class_assignment_id: classAssignments.map((ca) => ca.id), student_id: studentId },
    attributes: ['class_assignment_id', 'status']
  });
  const submissionOf = Object.fromEntries(submissions.map((s) => [s.class_assignment_id, s]));

  return classAssignments.flatMap((ca) => {
    const submission = submissionOf[ca.id];
    const needsResubmission = submission?.status === 'resubmission_requested';
    const window = windowOf(ca, now);
    if (submission && !needsResubmission) return [];
    if (!submission && window !== 'on_time' && window !== 'late') return [];
    const cls = classById[ca.class_id];
    return [{
      type: 'assignment',
      id: ca.assignment.id,
      title: ca.assignment.title,
      classId: cls.id,
      className: cls.name,
      deadline: ca.deadline,
      isOverdue: now > new Date(ca.deadline),
      needsResubmission
    }];
  });
};

/**
 * Bài kiểm tra: đếm số đề đã đạt, và việc cần làm = đề đang mở, chưa đạt, còn lượt (hoặc đang làm dở còn giờ).
 */
export const studentQuizSummary = async (classes, studentId, now) => {
  const quizzes = await Quiz.findAll({
    where: { is_published: true },
    attributes: ['id', 'title', 'duration_minutes', 'max_attempts', 'pass_score'],
    include: [{
      model: Lesson,
      attributes: ['id'],
      required: true,
      include: [{ model: Chapter, attributes: ['id', 'course_id'], where: { course_id: classes.map((c) => c.course_id) }, required: true }]
    }]
  });
  if (quizzes.length === 0) return { passedCount: 0, todo: [] };

  const quizIds = quizzes.map((q) => q.id);
  const [questionCounts, classQuizzes] = await Promise.all([
    countQuestions(quizIds),
    ClassQuiz.findAll({ where: { class_id: classes.map((c) => c.id), quiz_id: quizIds } })
  ]);
  const attempts = classQuizzes.length
    ? await QuizAttempt.findAll({
      where: { class_quiz_id: classQuizzes.map((cq) => cq.id), student_id: studentId },
      attributes: ['class_quiz_id', 'status', 'score', 'started_at']
    })
    : [];

  const classQuizOf = Object.fromEntries(classQuizzes.map((cq) => [`${cq.class_id}:${cq.quiz_id}`, cq]));
  const attemptsOf = attempts.reduce((acc, a) => {
    (acc[a.class_quiz_id] ||= []).push(a);
    return acc;
  }, {});

  let passedCount = 0;
  const todo = [];
  classes.forEach((cls) => {
    quizzes
      .filter((quiz) => quiz.lesson.chapter.course_id === cls.course_id)
      .forEach((quiz) => {
        const classQuiz = classQuizOf[`${cls.id}:${quiz.id}`];
        const mine = classQuiz ? attemptsOf[classQuiz.id] || [] : [];
        const scores = mine.filter((a) => FINISHED.includes(a.status)).map((a) => Number(a.score));
        const best = scores.length ? Math.max(...scores) : null;
        if (best !== null && best >= Number(quiz.pass_score)) {
          passedCount += 1;
          return;
        }

        const { schedule, isAvailable } = availabilityOf(cls, classQuiz, now);
        const resumable = mine.some((a) => a.status === 'in_progress' && !isExpired(a, quiz, now));
        // Lượt quá giờ chưa được chốt vẫn tính là đã dùng lượt (giống studentSummary)
        const hasAttemptsLeft = mine.length < quiz.max_attempts;
        if (!isAvailable || !questionCounts[quiz.id] || !(resumable || hasAttemptsLeft)) return;

        todo.push({
          type: 'quiz',
          id: quiz.id,
          title: quiz.title,
          classId: cls.id,
          className: cls.name,
          deadline: schedule.closeTime,
          isOverdue: false,
          needsResubmission: false
        });
      });
  });
  return { passedCount, todo };
};

const NO_TODO = { todoCount: 0, dueSoonCount: 0, nextDeadline: null };

/**
 * GET /classes/my-classes (học viên): gắn `todo: { todoCount, dueSoonCount, nextDeadline }` vào từng lớp.
 * Chỉ lớp đang hoạt động của khóa published mới có việc (giống trang Tổng quan); lớp khác luôn 0 việc.
 */
export const withTodoSummary = async (classItems, studentId, now = new Date()) => {
  const eligible = classItems
    .filter((c) => c.status === 'active' && c.course?.status === 'published')
    .map((c) => ({ id: c.id, name: c.name, course_id: c.course.id, status: c.status }));
  if (eligible.length === 0) return classItems.map((c) => ({ ...c, todo: NO_TODO }));

  const [assignmentTodo, quizSummary] = await Promise.all([
    studentAssignmentTodo(eligible, studentId, now),
    studentQuizSummary(eligible, studentId, now)
  ]);
  const summaryOf = summarizeTodoByClass([...assignmentTodo, ...quizSummary.todo], now);
  return classItems.map((c) => ({ ...c, todo: summaryOf[c.id] || NO_TODO }));
};
