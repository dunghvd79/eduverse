import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import {
  BASE_WEIGHTS, RANKINGS, round2, average, rankingOf, effectiveWeights, assignmentStateOf, assignmentGradeOf, finalScoreOf
} from '../utils/grading.js';
import { findClassOrFail, canManageClass, isActiveMember, getCourseLessonIds, getStudentProgress } from './classService.js';

const {
  Quiz, ClassQuiz, QuizAttempt, Assignment, ClassAssignment, AssignmentSubmission,
  Lesson, Chapter, Enrollment, User
} = models;

/**
 * Bảng điểm lớp theo docs/requirements/grading-policy.md (BR-034 → BR-039):
 *   Tổng kết = 0.4 × Q + 0.5 × A + 0.1 × P   (thang 10, làm tròn 2 chữ số)
 *   Q: TB điểm cao nhất mỗi bài kiểm tra đã công khai (chưa làm = 0)
 *   A: TB điểm mỗi bài tập đã giao cho lớp (chưa nộp / chưa chấm = 0; nộp lại dùng điểm lần chấm gần nhất)
 *   P: % bài học hoàn thành / 10
 *   Lớp không có Quiz hoặc không có Bài tập -> bỏ thành phần đó, chia lại tỷ trọng theo tỷ lệ (E1)
 */
// Hàm thuần tính điểm nằm ở utils/grading.js (có unit test); giữ export tại đây để mã cũ import không đổi
export { BASE_WEIGHTS, RANKINGS, rankingOf, effectiveWeights };

// Bài kiểm tra / bài tập của khóa, theo thứ tự trong đề cương
const courseContent = (model, courseId, where = {}) => model.findAll({
  where,
  attributes: ['id', 'title', 'lesson_id'],
  include: [{
    model: Lesson,
    attributes: ['id', 'order_index'],
    required: true,
    include: [{ model: Chapter, attributes: ['id', 'order_index'], where: { course_id: courseId }, required: true }]
  }],
  order: [[Lesson, Chapter, 'order_index', 'ASC'], [Lesson, 'order_index', 'ASC']]
});

/**
 * Tính bảng điểm cả lớp (chỉ học viên đang học).
 * studentId: chỉ tính cho 1 học viên (trang Điểm số của học viên).
 */
export const computeGradebook = async (cls, { studentId = null } = {}) => {
  const enrollments = await Enrollment.findAll({
    where: { class_id: cls.id, status: 'active', ...(studentId ? { student_id: studentId } : {}) },
    include: [{ model: User, as: 'student', attributes: ['id', 'full_name', 'email'] }],
    order: [[{ model: User, as: 'student' }, 'full_name', 'ASC']]
  });
  const studentIds = enrollments.map((e) => e.student_id);

  // Bài kiểm tra: đề đã công khai (đề đang bị tạm khóa cho lớp vẫn tính)
  const quizzes = await courseContent(Quiz, cls.course_id, { is_published: true });
  const classQuizzes = await ClassQuiz.findAll({ where: { class_id: cls.id, quiz_id: quizzes.map((q) => q.id) }, attributes: ['id', 'quiz_id'] });
  const attempts = classQuizzes.length && studentIds.length
    ? await QuizAttempt.findAll({
      where: { class_quiz_id: classQuizzes.map((cq) => cq.id), student_id: studentIds, status: ['completed', 'timed_out'] },
      attributes: ['class_quiz_id', 'student_id', 'score']
    })
    : [];
  const quizOfClassQuiz = Object.fromEntries(classQuizzes.map((cq) => [cq.id, cq.quiz_id]));
  const bestQuiz = {}; // `${studentId}:${quizId}` -> điểm cao nhất
  attempts.forEach((a) => {
    const key = `${a.student_id}:${quizOfClassQuiz[a.class_quiz_id]}`;
    bestQuiz[key] = Math.max(bestQuiz[key] ?? 0, Number(a.score || 0));
  });

  // Bài tập: chỉ bài đã giao cho lớp
  const classAssignments = await ClassAssignment.findAll({ where: { class_id: cls.id }, attributes: ['id', 'assignment_id'] });
  const assignments = (await courseContent(Assignment, cls.course_id))
    .filter((a) => classAssignments.some((ca) => ca.assignment_id === a.id));
  const assignmentOfCa = Object.fromEntries(classAssignments.map((ca) => [ca.id, ca.assignment_id]));
  const submissions = classAssignments.length && studentIds.length
    ? await AssignmentSubmission.findAll({
      where: { class_assignment_id: classAssignments.map((ca) => ca.id), student_id: studentIds },
      attributes: ['class_assignment_id', 'student_id', 'status', 'grade', 'submitted_at', 'graded_at']
    })
    : [];
  const submissionOf = Object.fromEntries(submissions.map((s) => [`${s.student_id}:${assignmentOfCa[s.class_assignment_id]}`, s]));

  // Tiến độ
  const lessonIds = await getCourseLessonIds(cls.course_id);
  const progress = await getStudentProgress(cls.id, lessonIds, studentIds);

  const weights = effectiveWeights(quizzes.length > 0, assignments.length > 0);

  const rows = enrollments.map((enrollment, index) => {
    const sid = enrollment.student_id;

    const quizScores = quizzes.map((quiz) => {
      const key = `${sid}:${quiz.id}`;
      return { quizId: quiz.id, score: bestQuiz[key] ?? 0, attempted: key in bestQuiz };
    });

    const assignmentScores = assignments.map((assignment) => {
      const s = submissionOf[`${sid}:${assignment.id}`];
      return { assignmentId: assignment.id, grade: assignmentGradeOf(s), state: assignmentStateOf(s) };
    });

    const completedLessons = progress[sid]?.completedLessons || 0;
    const progressPercentage = lessonIds.length ? round2((completedLessons / lessonIds.length) * 100) : 0;

    const quizAverage = quizzes.length ? round2(average(quizScores.map((q) => q.score))) : null;
    const assignmentAverage = assignments.length ? round2(average(assignmentScores.map((a) => a.grade))) : null;
    const progressScore = round2(progressPercentage / 10);

    const finalScore = finalScoreOf({ quizScores, assignmentScores, progressPercentage }, weights);

    const notes = [];
    const titleOf = (id, list) => list.find((x) => x.id === id)?.title;
    const ungraded = assignmentScores.filter((a) => a.state === 'ungraded' || a.state === 'regrade_pending');
    if (ungraded.length) notes.push(`Chưa chấm: ${ungraded.map((a) => titleOf(a.assignmentId, assignments)).join(', ')}`);

    return {
      index: index + 1,
      student: { id: sid, fullName: enrollment.student.full_name, email: enrollment.student.email },
      completedLessons,
      totalLessons: lessonIds.length,
      progressPercentage,
      progressScore,
      quizScores,
      quizAverage,
      assignmentScores,
      assignmentAverage,
      finalScore,
      ranking: rankingOf(finalScore),
      notes
    };
  });

  const finals = rows.map((r) => r.finalScore);
  return {
    class: { id: cls.id, name: cls.name, classCode: cls.class_code, course: { id: cls.course.id, title: cls.course.title } },
    weights,
    totalLessons: lessonIds.length,
    quizzes: quizzes.map((q) => ({ id: q.id, title: q.title })),
    assignments: assignments.map((a) => ({ id: a.id, title: a.title })),
    rows,
    summary: {
      totalStudents: rows.length,
      averageFinalScore: finals.length ? round2(average(finals)) : null,
      distribution: Object.fromEntries(RANKINGS.map((r) => [r.label, rows.filter((row) => row.ranking === r.label).length])),
      ungradedCount: rows.reduce((s, r) => s + r.assignmentScores.filter((a) => a.state === 'ungraded' || a.state === 'regrade_pending').length, 0)
    },
    generatedAt: new Date()
  };
};

/**
 * GET /classes/:id/gradebook và export-excel: GV phụ trách, Quản lý, Admin (api-classes.md 2.13)
 */
export const getClassGradebook = async (classId, user) => {
  const cls = await findClassOrFail(classId);
  if (!canManageClass(cls, user)) {
    throw new AppError('Không có quyền xem bảng điểm lớp này', 403, 'Forbidden');
  }
  return computeGradebook(cls);
};

/**
 * GET /classes/:id/my-grades: điểm của chính học viên trong lớp
 */
export const getMyGrades = async (classId, user) => {
  const cls = await findClassOrFail(classId);
  if (!(await isActiveMember(cls.id, user.id))) {
    throw new AppError('Bạn không thuộc lớp học này', 403, 'Forbidden');
  }
  const { rows, ...rest } = await computeGradebook(cls, { studentId: user.id });
  const { summary, ...info } = rest;
  return { ...info, me: rows[0] };
};

export default { getClassGradebook, getMyGrades, effectiveWeights, rankingOf };
