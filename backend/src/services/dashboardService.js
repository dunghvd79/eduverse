import { Op } from 'sequelize';
import models from '../models/index.js';
import { getS3Config } from '../config/s3.js';
import { computeGradebook } from './gradebookService.js';
import { windowOf, needsGrading } from './assignmentService.js';
import { FINISHED, isExpired, availabilityOf } from './quizAttemptService.js';
import { countQuestions } from './quizService.js';

const {
  sequelize, User, Course, Category, ClassModel, Enrollment, Lesson, Chapter, LessonProgress,
  Quiz, ClassQuiz, QuizAttempt, Assignment, ClassAssignment, AssignmentSubmission
} = models;

/**
 * Trang Tổng quan của 4 vai trò (docs/api/api-dashboard.md).
 * - Chỉ đọc: không gọi finalizeExpired (hàm đó ghi DB); lượt quiz quá giờ được xử lý trong bộ nhớ.
 * - Điểm tổng kết dùng chung computeGradebook nên khớp trang Điểm số / Sổ điểm.
 * - Phạm vi dữ liệu luôn lấy từ người đang đăng nhập, không nhận tham số từ client.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 7;
const NEW_USER_DAYS = 7;
const TODO_LIMIT = 8;
const TEACHER_CLASS_LIMIT = 10;
// computeGradebook tốn ~8 query/lớp; giới hạn song song để không chiếm hết pool (max 10)
const GRADEBOOK_CONCURRENCY = 3;

const round1 = (value) => Math.round(value * 10) / 10;
const round2 = (value) => Math.round(value * 100) / 100;
const mean = (values) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : null);
const countBy = (items, keyOf) => items.reduce((acc, item) => {
  const key = keyOf(item);
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
const pick = (counts, keys) => Object.fromEntries(keys.map((k) => [k, counts[k] || 0]));

const mapLimit = async (items, limit, fn) => {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

// Một lớp lỗi không làm hỏng cả trang tổng quan, nhưng phải để lại dấu vết trong log
const safeGradebook = (cls, options) => computeGradebook(cls, options).catch((error) => {
  console.error(`[dashboard] Không tính được bảng điểm lớp ${cls.id}:`, error);
  return null;
});

// COUNT ... GROUP BY trả về [{ <khóa>, count }] (count là chuỗi bigint)
const countMap = (rows, key) => Object.fromEntries(rows.map((r) => [r[key], Number(r.count)]));

// Hạn null (mở không giới hạn) xếp cuối
const byDeadline = (a, b) =>
  (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity);

// Lớp chưa có hoạt động xếp cuối, giữ thứ tự ban đầu
const byLastActiveDesc = (a, b) =>
  (b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : -Infinity) - (a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : -Infinity);

const COURSE_STATUSES = ['draft', 'pending', 'published', 'rejected'];
const CLASS_STATUSES = ['active', 'paused', 'closed'];
const ROLES = ['student', 'teacher', 'training_manager', 'admin'];

// ==========================================
// HỌC VIÊN
// ==========================================

/**
 * Việc cần làm - bài tập: chưa nộp và còn trong hạn (kể cả hạn nộp muộn), hoặc GV yêu cầu nộp lại.
 */
const studentAssignmentTodo = async (classes, studentId, now) => {
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
const studentQuizSummary = async (classes, studentId, now) => {
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

/**
 * GET /dashboard/student
 * "Lớp đang học" = ghi danh active + lớp đang hoạt động (lớp tạm dừng/đã đóng vẫn xem ở trang Điểm số).
 */
export const getStudentDashboard = async (user) => {
  const now = new Date();
  const enrollments = await Enrollment.findAll({
    where: { student_id: user.id, status: 'active' },
    include: [{
      model: ClassModel,
      as: 'class',
      required: true,
      where: { status: 'active' },
      include: [
        { model: Course, attributes: ['id', 'title', 'thumbnail_url', 'status'], required: true },
        { model: User, as: 'teacher', attributes: ['id', 'full_name', 'avatar_url'] }
      ]
    }],
    order: [['enrolled_at', 'DESC']]
  });
  const classes = enrollments.map((e) => e.class);

  if (classes.length === 0) {
    return {
      stats: { activeClasses: 0, averageFinalScore: null, dueSoonCount: 0, quizzesPassed: 0 },
      continueLearning: null,
      classes: [],
      todo: { total: 0, items: [] },
      generatedAt: now
    };
  }

  const classIds = classes.map((c) => c.id);
  // Bài tập/bài kiểm tra chỉ hiện khi khóa học đang published (giống API bài tập/bài kiểm tra của học viên)
  const publishedClasses = classes.filter((c) => c.course.status === 'published');

  const [gradebooks, lastActiveRows, assignmentTodo, quizSummary] = await Promise.all([
    mapLimit(classes, GRADEBOOK_CONCURRENCY, (cls) => safeGradebook(cls, { studentId: user.id })
      .then((book) => book?.rows[0] || null)),
    LessonProgress.findAll({
      attributes: ['class_id', [sequelize.fn('MAX', sequelize.col('completed_at')), 'lastActiveAt']],
      where: { student_id: user.id, class_id: classIds, is_completed: true },
      group: ['class_id'],
      raw: true
    }),
    publishedClasses.length ? studentAssignmentTodo(publishedClasses, user.id, now) : [],
    publishedClasses.length ? studentQuizSummary(publishedClasses, user.id, now) : { passedCount: 0, todo: [] }
  ]);
  const lastActiveOf = Object.fromEntries(lastActiveRows.map((r) => [r.class_id, r.lastActiveAt]));

  const classItems = classes.map((cls, index) => {
    const me = gradebooks[index];
    return {
      id: cls.id,
      name: cls.name,
      course: { id: cls.course.id, title: cls.course.title, thumbnailUrl: cls.course.thumbnail_url },
      teacher: cls.teacher ? { id: cls.teacher.id, fullName: cls.teacher.full_name, avatarUrl: cls.teacher.avatar_url } : null,
      progress: {
        completedLessons: me?.completedLessons ?? 0,
        totalLessons: me?.totalLessons ?? 0,
        progressPercentage: me?.progressPercentage ?? 0
      },
      finalScore: me?.finalScore ?? null,
      ranking: me?.ranking ?? null,
      lastActiveAt: lastActiveOf[cls.id] || null
    };
  }).sort(byLastActiveDesc);

  const finals = classItems.map((c) => c.finalScore).filter((s) => s !== null);
  const todo = [...assignmentTodo, ...quizSummary.todo].sort(byDeadline);
  const dueSoonLimit = now.getTime() + DUE_SOON_DAYS * DAY_MS;
  const dueSoonCount = todo.filter((item) => {
    if (!item.deadline) return false;
    const time = new Date(item.deadline).getTime();
    return time >= now.getTime() && time <= dueSoonLimit;
  }).length;

  // Lớp đầu tiên sau khi sắp xếp: học gần nhất, chưa học lớp nào thì lớp ghi danh mới nhất
  const current = classItems[0];
  return {
    stats: {
      activeClasses: classes.length,
      averageFinalScore: finals.length ? round2(mean(finals)) : null,
      dueSoonCount,
      quizzesPassed: quizSummary.passedCount
    },
    continueLearning: { classId: current.id, className: current.name, courseTitle: current.course.title, lastActiveAt: current.lastActiveAt },
    classes: classItems,
    todo: { total: todo.length, items: todo.slice(0, TODO_LIMIT) },
    generatedAt: now
  };
};

// ==========================================
// GIẢNG VIÊN
// ==========================================

/**
 * Bài chờ chấm: đúng quy tắc needsGrading, chỉ học viên còn trong lớp; tính mọi lớp (kể cả lớp đã đóng, vẫn chấm được).
 * Gom theo bài tập của từng lớp, bài nộp chờ lâu nhất lên đầu.
 */
const teacherNeedsGrading = async (classes, classAssignments, enrollments) => {
  if (classAssignments.length === 0) return [];
  const submissions = await AssignmentSubmission.findAll({
    where: { class_assignment_id: classAssignments.map((ca) => ca.id), status: ['submitted', 'late_submitted'] },
    attributes: ['class_assignment_id', 'student_id', 'status', 'grade', 'submitted_at', 'graded_at']
  });
  const activeMember = new Set(enrollments.map((e) => `${e.class_id}:${e.student_id}`));
  const classOf = Object.fromEntries(classAssignments.map((ca) => [ca.id, ca.class_id]));
  const pendingOf = submissions.reduce((acc, s) => {
    if (activeMember.has(`${classOf[s.class_assignment_id]}:${s.student_id}`) && needsGrading(s)) {
      (acc[s.class_assignment_id] ||= []).push(s);
    }
    return acc;
  }, {});
  const classById = Object.fromEntries(classes.map((c) => [c.id, c]));

  return classAssignments.flatMap((ca) => {
    const pending = pendingOf[ca.id];
    if (!pending) return [];
    const cls = classById[ca.class_id];
    return [{
      classId: cls.id,
      className: cls.name,
      courseTitle: cls.course.title,
      assignmentId: ca.assignment.id,
      assignmentTitle: ca.assignment.title,
      count: pending.length,
      oldestSubmittedAt: pending.map((s) => s.submitted_at).sort((a, b) => new Date(a) - new Date(b))[0],
      deadline: ca.deadline
    }];
  }).sort((a, b) => new Date(a.oldestSubmittedAt) - new Date(b.oldestSubmittedAt));
};

/**
 * GET /dashboard/teacher
 * Khóa học tính theo người tạo (owner); lớp/học viên/bài chờ chấm tính theo lớp mình phụ trách.
 */
export const getTeacherDashboard = async (user) => {
  const classes = await ClassModel.findAll({
    where: { teacher_id: user.id },
    include: [{ model: Course, attributes: ['id', 'title'], required: true }],
    order: [['created_at', 'DESC']]
  });
  const classIds = classes.map((c) => c.id);

  const [courseRows, rejectedCourses, enrollments, classAssignments] = await Promise.all([
    Course.count({ where: { owner_id: user.id }, group: ['status'] }),
    Course.findAll({
      where: { owner_id: user.id, status: 'rejected' },
      attributes: ['id', 'title', 'rejection_reason', 'updated_at'],
      order: [['updated_at', 'DESC']],
      limit: 5
    }),
    classIds.length
      ? Enrollment.findAll({ where: { class_id: classIds, status: 'active' }, attributes: ['class_id', 'student_id'], raw: true })
      : [],
    classIds.length
      ? ClassAssignment.findAll({ where: { class_id: classIds }, include: [{ model: Assignment, attributes: ['id', 'title'], required: true }] })
      : []
  ]);

  const activeClassIds = new Set(classes.filter((c) => c.status === 'active').map((c) => c.id));
  const studentCountOf = countBy(enrollments, (e) => e.class_id);
  const activeStudents = new Set(enrollments.filter((e) => activeClassIds.has(e.class_id)).map((e) => e.student_id)).size;

  // Bảng lớp: lớp đang hoạt động lên trước, tối đa TEACHER_CLASS_LIMIT lớp
  const tableClasses = [...classes]
    .sort((a, b) => Number(activeClassIds.has(b.id)) - Number(activeClassIds.has(a.id)))
    .slice(0, TEACHER_CLASS_LIMIT);
  const [needsGradingGroups, gradebooks] = await Promise.all([
    teacherNeedsGrading(classes, classAssignments, enrollments),
    mapLimit(tableClasses, GRADEBOOK_CONCURRENCY, (cls) => safeGradebook(cls))
  ]);

  const courseCounts = pick(countMap(courseRows, 'status'), COURSE_STATUSES);
  return {
    stats: {
      courses: { total: Object.values(courseCounts).reduce((sum, n) => sum + n, 0), ...courseCounts },
      activeClasses: activeClassIds.size,
      totalClasses: classes.length,
      activeStudents,
      submissionsNeedGrading: needsGradingGroups.reduce((s, g) => s + g.count, 0)
    },
    needsGrading: needsGradingGroups.slice(0, TODO_LIMIT),
    rejectedCourses: rejectedCourses.map((c) => ({
      id: c.id,
      title: c.title,
      rejectionReason: c.rejection_reason,
      rejectedAt: c.updated_at
    })),
    classes: {
      total: classes.length,
      items: tableClasses.map((cls, index) => {
        const book = gradebooks[index];
        const progresses = book ? book.rows.map((r) => r.progressPercentage) : [];
        return {
          id: cls.id,
          name: cls.name,
          classCode: cls.class_code,
          status: cls.status,
          endDate: cls.end_date,
          course: { id: cls.course.id, title: cls.course.title },
          studentCount: studentCountOf[cls.id] || 0,
          averageProgress: progresses.length ? round1(mean(progresses)) : null,
          averageFinalScore: book?.summary.averageFinalScore ?? null,
          // Số học viên theo xếp loại (Giỏi/Khá/Trung bình/Chưa đạt), null khi không tính được bảng điểm
          distribution: book?.summary.distribution ?? null
        };
      })
    },
    generatedAt: new Date()
  };
};

// ==========================================
// QUẢN LÝ ĐÀO TẠO
// ==========================================

const mapOwner = (owner) => (owner ? { id: owner.id, fullName: owner.full_name } : null);

/**
 * GET /dashboard/manager
 * Lớp của khóa học đã bị xóa mềm không được tính (include Course required).
 */
export const getManagerDashboard = async () => {
  const [courseRows, classRows, activeStudents, pendingCourses, recentlyApproved] = await Promise.all([
    Course.count({ where: { status: ['pending', 'published'] }, group: ['status'] }),
    ClassModel.count({ include: [{ model: Course, attributes: [], required: true }], group: ['classes.status'] }),
    Enrollment.count({
      distinct: true,
      col: 'student_id',
      where: { status: 'active' },
      include: [{
        model: ClassModel,
        as: 'class',
        attributes: [],
        required: true,
        where: { status: 'active' },
        include: [{ model: Course, attributes: [], required: true }]
      }]
    }),
    // Khóa pending bị khóa chỉnh sửa nên updated_at chính là thời điểm gửi duyệt
    Course.findAll({
      where: { status: 'pending' },
      attributes: ['id', 'title', 'thumbnail_url', 'updated_at'],
      include: [
        { model: User, as: 'owner', attributes: ['id', 'full_name'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['updated_at', 'ASC']],
      limit: 6
    }),
    Course.findAll({
      where: { status: 'published', approved_at: { [Op.ne]: null } },
      attributes: ['id', 'title', 'approved_at'],
      include: [{ model: User, as: 'owner', attributes: ['id', 'full_name'] }],
      order: [['approved_at', 'DESC']],
      limit: 5
    })
  ]);

  const courseCounts = pick(countMap(courseRows, 'status'), ['pending', 'published']);
  const classesByStatus = pick(countMap(classRows, 'status'), CLASS_STATUSES);
  return {
    stats: {
      pendingCourses: courseCounts.pending,
      publishedCourses: courseCounts.published,
      activeClasses: classesByStatus.active,
      activeStudents
    },
    pendingQueue: {
      total: courseCounts.pending,
      items: pendingCourses.map((c) => ({
        id: c.id,
        title: c.title,
        thumbnailUrl: c.thumbnail_url,
        teacher: mapOwner(c.owner),
        category: c.category?.name || null,
        submittedAt: c.updated_at
      }))
    },
    classesByStatus: { ...classesByStatus, total: Object.values(classesByStatus).reduce((sum, n) => sum + n, 0) },
    recentlyApproved: recentlyApproved.map((c) => ({
      id: c.id,
      title: c.title,
      teacher: mapOwner(c.owner),
      approvedAt: c.approved_at
    })),
    generatedAt: new Date()
  };
};

// ==========================================
// QUẢN TRỊ VIÊN
// ==========================================

const DB_TIMEOUT_MS = 5000;
const DB_SLOW_MS = 1000;

/**
 * Tình trạng dịch vụ. Chỉ trả trạng thái - không bao giờ trả giá trị biến môi trường hay chi tiết lỗi
 * (thông báo lỗi kết nối có thể chứa host Neon).
 */
const getSystemStatus = async () => {
  const startedAt = process.hrtime.bigint();
  let database;
  let timer;
  try {
    await Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), DB_TIMEOUT_MS); })
    ]);
    const latencyMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6);
    database = { key: 'database', status: latencyMs >= DB_SLOW_MS ? 'degraded' : 'ok', latencyMs };
  } catch {
    database = { key: 'database', status: 'down', latencyMs: null };
  } finally {
    clearTimeout(timer);
  }

  let storageConfigured = true;
  try {
    getS3Config();
  } catch {
    storageConfigured = false;
  }

  return {
    checkedAt: new Date(),
    uptimeSeconds: Math.round(process.uptime()),
    services: [
      database,
      { key: 'storage', status: storageConfigured ? 'configured' : 'local_storage' },
      { key: 'ai', status: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured' },

      // Chưa cài Nodemailer: OTP/link đặt lại mật khẩu in ra console backend. Đổi khi có SMTP.
      { key: 'email', status: 'dev_console' }
    ]
  };
};

/**
 * GET /dashboard/admin
 */
export const getAdminDashboard = async () => {
  const newUserSince = new Date(Date.now() - NEW_USER_DAYS * DAY_MS);
  const [roleRows, blockedUsers, unverifiedUsers, newUsersLast7Days, newestUsers, system] = await Promise.all([
    User.count({ group: ['role'] }),
    User.count({ where: { is_active: false } }),
    User.count({ where: { email_verified: false } }),
    User.count({ where: { created_at: { [Op.gte]: newUserSince } } }),
    // Chỉ lấy cột cần hiển thị (không password_hash, block_reason, số điện thoại)
    User.findAll({
      attributes: ['id', 'full_name', 'email', 'role', 'is_active', 'email_verified', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 6
    }),
    getSystemStatus()
  ]);

  const roleCounts = pick(countMap(roleRows, 'role'), ROLES);
  const totalUsers = Object.values(roleCounts).reduce((sum, n) => sum + n, 0);
  return {
    stats: { totalUsers, blockedUsers, unverifiedUsers, newUsersLast7Days },
    roleDistribution: ROLES.map((role) => ({
      role,
      count: roleCounts[role],
      percentage: totalUsers ? round1((roleCounts[role] / totalUsers) * 100) : 0
    })),
    system,
    newestUsers: newestUsers.map((u) => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      role: u.role,
      isActive: u.is_active,
      emailVerified: u.email_verified,
      createdAt: u.created_at
    })),
    generatedAt: new Date()
  };
};

export default { getStudentDashboard, getTeacherDashboard, getManagerDashboard, getAdminDashboard };
