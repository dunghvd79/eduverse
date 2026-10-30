import crypto from 'crypto';
import { Op } from 'sequelize';
import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { byLastActiveDesc, nextLessonIdOf } from '../utils/studentTodo.js';

const { sequelize, ClassModel, Course, Chapter, Lesson, Enrollment, LessonProgress, User } = models;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ I, O, 0, 1 dễ nhầm khi đọc mã
const COURSE_ATTRIBUTES = ['id', 'title', 'slug', 'thumbnail_url', 'status', 'owner_id'];
const TEACHER_ATTRIBUTES = ['id', 'full_name', 'email', 'avatar_url'];

// ==========================================
// HELPERS: QUYỀN
// ==========================================
const isStaff = (user) => user.role === 'admin' || user.role === 'training_manager';
const isClassTeacher = (cls, user) => user.role === 'teacher' && cls.teacher_id === user.id;

/**
 * Giảng viên phụ trách, Quản lý đào tạo, Admin: sửa/xóa lớp, xem tiến độ, xem mã lớp
 */
export const canManageClass = (cls, user) => isStaff(user) || isClassTeacher(cls, user);

/**
 * Giảng viên phụ trách hoặc Admin: đổi mã lớp, thêm/xóa học viên (api-classes.md)
 */
const assertTeacherOrAdmin = (cls, user, message) => {
  if (user.role !== 'admin' && !isClassTeacher(cls, user)) {
    throw new AppError(message, 403, 'Forbidden');
  }
};

export const isActiveMember = async (classId, studentId) =>
  (await Enrollment.count({ where: { class_id: classId, student_id: studentId, status: 'active' } })) > 0;

// ==========================================
// HELPERS: TRUY VẤN & MAP
// ==========================================
export const findClassOrFail = async (classId) => {
  const cls = await ClassModel.findByPk(classId, {
    include: [
      { model: Course, attributes: COURSE_ATTRIBUTES },
      { model: User, as: 'teacher', attributes: TEACHER_ATTRIBUTES }
    ]
  });
  // Khóa học bị xóa mềm -> lớp coi như không còn
  if (!cls || !cls.course) {
    throw new AppError('Không tìm thấy lớp học', 404, 'Not Found');
  }
  return cls;
};

const mapCourseRef = (course) => (course ? {
  id: course.id,
  title: course.title,
  slug: course.slug,
  thumbnailUrl: course.thumbnail_url
} : null);

const mapTeacherRef = (teacher, { withEmail = false } = {}) => (teacher ? {
  id: teacher.id,
  fullName: teacher.full_name,
  ...(withEmail ? { email: teacher.email } : {}),
  avatarUrl: teacher.avatar_url
} : null);

/**
 * Mã lớp là "chìa khóa" để tham gia lớp -> chỉ trả cho người quản lý được lớp đó
 */
const mapClass = (cls, user, extra = {}) => ({
  id: cls.id,
  name: cls.name,
  classCode: canManageClass(cls, user) ? cls.class_code : null,
  status: cls.status,
  startDate: cls.start_date,
  endDate: cls.end_date,
  course: mapCourseRef(cls.course),
  teacher: mapTeacherRef(cls.teacher, { withEmail: true }),
  createdAt: cls.created_at,
  ...extra
});

const countActiveStudents = async (classIds) => {
  if (classIds.length === 0) return {};
  const rows = await Enrollment.findAll({
    attributes: ['class_id', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
    where: { class_id: classIds, status: 'active' },
    group: ['class_id'],
    raw: true
  });
  return Object.fromEntries(rows.map((r) => [r.class_id, Number(r.total)]));
};

export const getCourseLessonIds = async (courseId) => {
  const lessons = await Lesson.findAll({
    attributes: ['id'],
    include: [{ model: Chapter, attributes: [], where: { course_id: courseId } }],
    raw: true
  });
  return lessons.map((l) => l.id);
};

/**
 * Bài học của nhiều khóa theo đúng thứ tự đề cương (chương, rồi bài): { [courseId]: [lessonId, ...] }
 */
const getOrderedLessonIdsByCourse = async (courseIds) => {
  if (courseIds.length === 0) return {};
  const lessons = await Lesson.findAll({
    attributes: ['id'],
    include: [{ model: Chapter, attributes: ['course_id'], where: { course_id: courseIds } }],
    order: [[{ model: Chapter }, 'order_index', 'ASC'], ['order_index', 'ASC']],
    raw: true
  });
  return lessons.reduce((acc, l) => {
    (acc[l['chapter.course_id']] ||= []).push(l.id);
    return acc;
  }, {});
};

const toPercentage = (completed, total) => (total > 0 ? Math.round((completed / total) * 1000) / 10 : 0);

/**
 * Tiến độ của từng học viên trong một lớp: { [studentId]: { completedLessons, lastActiveAt } }
 * Chỉ đếm bài học còn thuộc khóa học (bài đã xóa không tính).
 */
export const getStudentProgress = async (classId, lessonIds, studentIds) => {
  if (lessonIds.length === 0 || studentIds.length === 0) return {};
  const rows = await LessonProgress.findAll({
    attributes: [
      'student_id',
      [sequelize.fn('COUNT', sequelize.col('id')), 'completed'],
      [sequelize.fn('MAX', sequelize.col('completed_at')), 'lastActiveAt']
    ],
    where: { class_id: classId, student_id: studentIds, lesson_id: lessonIds, is_completed: true },
    group: ['student_id'],
    raw: true
  });
  return Object.fromEntries(rows.map((r) => [r.student_id, { completedLessons: Number(r.completed), lastActiveAt: r.lastActiveAt }]));
};

/**
 * Tiến độ của một học viên trong một lớp - dùng cho chi tiết lớp (GET /classes/:id)
 */
export const getLessonProgressSummary = async (classId, courseId, studentId) => {
  const lessonIds = await getCourseLessonIds(courseId);
  const progress = await getStudentProgress(classId, lessonIds, [studentId]);
  const completedLessons = progress[studentId]?.completedLessons || 0;
  return {
    totalLessons: lessonIds.length,
    completedLessons,
    progressPercentage: toPercentage(completedLessons, lessonIds.length)
  };
};

/**
 * Sinh mã ngẫu nhiên 6 ký tự, thử lại nếu trùng lớp đang hoạt động
 */
const generateUniqueCode = async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = Array.from({ length: 6 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');
    if ((await ClassModel.count({ where: { class_code: code } })) === 0) return code;
  }
  throw new AppError('Không thể sinh mã lớp học, vui lòng thử lại', 500, 'Internal Server Error');
};

const assertCodeAvailable = async (code, excludeClassId = null) => {
  const where = { class_code: code };
  if (excludeClassId) where.id = { [Op.ne]: excludeClassId };
  if ((await ClassModel.count({ where })) > 0) {
    throw new AppError('Mã lớp học đã tồn tại', 409, 'Conflict');
  }
};

const assertDateRange = (startDate, endDate) => {
  if (startDate && endDate && endDate < startDate) {
    throw new AppError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu', 400, 'Bad Request');
  }
};

// ==========================================
// 1. QUẢN LÝ LỚP HỌC
// ==========================================

/**
 * GET /classes - danh sách lớp (phân trang, tìm kiếm, lọc)
 */
export const getClasses = async (query, currentUser) => {
  const { page = 1, limit = 10, search, courseId, status, teacherId } = query;
  const where = {};
  if (search) where.name = { [Op.iLike]: `%${search}%` };
  if (courseId) where.course_id = courseId;
  if (status) where.status = status;
  if (teacherId) where.teacher_id = teacherId;

  const { rows, count } = await ClassModel.findAndCountAll({
    where,
    include: [
      // required: lớp của khóa học đã xóa mềm không hiển thị
      { model: Course, attributes: COURSE_ATTRIBUTES, required: true },
      { model: User, as: 'teacher', attributes: TEACHER_ATTRIBUTES }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true
  });

  const totals = await countActiveStudents(rows.map((c) => c.id));
  const totalPages = Math.ceil(count / limit) || 1;

  return {
    items: rows.map((cls) => mapClass(cls, currentUser, { totalStudents: totals[cls.id] || 0 })),
    meta: {
      page,
      limit,
      totalItems: count,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

/**
 * GET /classes/my-classes
 * - Học viên: lớp đã ghi danh (active) kèm tiến độ học của mình
 * - Giảng viên: lớp mình phụ trách kèm sĩ số
 * - Quản lý/Admin: không phụ trách lớp nào -> mảng rỗng (dùng GET /classes)
 */
export const getMyClasses = async (currentUser) => {
  const include = [
    { model: Course, attributes: COURSE_ATTRIBUTES, required: true },
    { model: User, as: 'teacher', attributes: TEACHER_ATTRIBUTES }
  ];

  if (currentUser.role === 'student') {
    const enrollments = await Enrollment.findAll({
      where: { student_id: currentUser.id, status: 'active' },
      include: [{ model: ClassModel, as: 'class', required: true, include }],
      order: [['enrolled_at', 'DESC']]
    });
    const classes = enrollments.map((e) => e.class);

    // Gộp truy vấn cho mọi lớp: bài học theo thứ tự đề cương + các bài học viên đã hoàn thành
    const [lessonIdsOf, doneRows] = await Promise.all([
      getOrderedLessonIdsByCourse([...new Set(classes.map((c) => c.course_id))]),
      classes.length
        ? LessonProgress.findAll({
          attributes: ['class_id', 'lesson_id', 'completed_at'],
          where: { student_id: currentUser.id, class_id: classes.map((c) => c.id), is_completed: true },
          raw: true
        })
        : []
    ]);
    const doneOf = doneRows.reduce((acc, r) => {
      (acc[r.class_id] ||= []).push(r);
      return acc;
    }, {});

    // Học gần nhất lên đầu; lớp chưa học bài nào giữ thứ tự ghi danh mới nhất (sort ổn định)
    return enrollments.map((enrollment) => {
      const cls = enrollment.class;
      const lessonIds = lessonIdsOf[cls.course_id] || [];
      const lessonSet = new Set(lessonIds);
      // Cùng quy tắc với getStudentProgress (chỉ đếm bài còn thuộc khóa, lần học cuối = MAX completed_at)
      // nhưng gộp truy vấn cho nhiều lớp -> đổi quy tắc tiến độ thì sửa cả hai nơi
      const done = (doneOf[cls.id] || []).filter((r) => lessonSet.has(r.lesson_id));
      const lastActive = done.reduce((max, r) => (!max || new Date(r.completed_at) > new Date(max) ? r.completed_at : max), null);
      const data = mapClass(cls, currentUser);
      return {
        ...data,
        course: { ...data.course, status: cls.course.status },
        teacher: mapTeacherRef(cls.teacher),
        enrolledAt: enrollment.enrolled_at,
        progress: {
          totalLessons: lessonIds.length,
          completedLessons: done.length,
          progressPercentage: toPercentage(done.length, lessonIds.length),
          lastActiveAt: lastActive,
          nextLessonId: nextLessonIdOf(lessonIds, new Set(done.map((r) => r.lesson_id)))
        }
      };
    }).sort((a, b) => byLastActiveDesc(a.progress, b.progress));
  }

  if (currentUser.role === 'teacher') {
    const classes = await ClassModel.findAll({
      where: { teacher_id: currentUser.id },
      include,
      order: [['created_at', 'DESC']]
    });
    const totals = await countActiveStudents(classes.map((c) => c.id));
    return classes.map((cls) => mapClass(cls, currentUser, { totalStudents: totals[cls.id] || 0 }));
  }

  return [];
};

/**
 * GET /classes/:id
 */
export const getClassById = async (classId, currentUser) => {
  const cls = await findClassOrFail(classId);
  const totals = await countActiveStudents([cls.id]);

  const data = mapClass(cls, currentUser, { totalStudents: totals[cls.id] || 0 });
  data.permissions = {
    canManage: canManageClass(cls, currentUser),
    canManageMembers: currentUser.role === 'admin' || isClassTeacher(cls, currentUser),
    isMember: currentUser.role === 'student' ? await isActiveMember(cls.id, currentUser.id) : false
  };
  if (data.permissions.isMember) {
    data.progress = await getLessonProgressSummary(cls.id, cls.course_id, currentUser.id);
  }
  return data;
};

/**
 * POST /classes - mở lớp cho khóa học đã published
 * Giảng viên chỉ tự mở lớp cho khóa học của mình và luôn tự phụ trách (BR-023);
 * Quản lý/Admin mở lớp cho mọi khóa published và chỉ định teacherId (mặc định: chủ khóa học).
 */
export const createClass = async (data, currentUser) => {
  const course = await Course.findByPk(data.courseId, { attributes: ['id', 'status', 'owner_id'] });
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }
  if (course.status !== 'published') {
    throw new AppError('Khóa học chưa được công khai', 400, 'Bad Request');
  }
  if (currentUser.role === 'teacher' && course.owner_id !== currentUser.id) {
    throw new AppError('Giảng viên chỉ được mở lớp cho khóa học của mình. Muốn dạy khóa học của giảng viên khác, hãy liên hệ Quản lý đào tạo để được phân công.', 403, 'Forbidden');
  }

  let teacherId = currentUser.id;
  if (currentUser.role !== 'teacher') {
    teacherId = data.teacherId || course.owner_id;
    const teacher = await User.findByPk(teacherId, { attributes: ['id', 'role', 'is_active'] });
    if (!teacher || teacher.role !== 'teacher' || !teacher.is_active) {
      throw new AppError('Giảng viên phụ trách không hợp lệ (phải là tài khoản giảng viên đang hoạt động)', 400, 'Bad Request');
    }
  }

  assertDateRange(data.startDate, data.endDate);

  const classCode = data.classCode || await generateUniqueCode();
  await assertCodeAvailable(classCode);

  const cls = await ClassModel.create({
    course_id: course.id,
    teacher_id: teacherId,
    name: data.name,
    class_code: classCode,
    start_date: data.startDate || null,
    end_date: data.endDate || null,
    status: 'active'
  });

  return {
    id: cls.id,
    name: cls.name,
    classCode: cls.class_code,
    status: cls.status,
    teacherId: cls.teacher_id,
    createdAt: cls.created_at
  };
};

/**
 * PATCH /classes/:id
 */
export const updateClass = async (classId, data, currentUser) => {
  const cls = await findClassOrFail(classId);
  if (!canManageClass(cls, currentUser)) {
    throw new AppError('Không có quyền sửa lớp học này', 403, 'Forbidden');
  }

  const startDate = data.startDate !== undefined ? data.startDate : cls.start_date;
  const endDate = data.endDate !== undefined ? data.endDate : cls.end_date;
  assertDateRange(startDate, endDate);

  if (data.name !== undefined) cls.name = data.name;
  if (data.status !== undefined) cls.status = data.status;
  if (data.startDate !== undefined) cls.start_date = data.startDate;
  if (data.endDate !== undefined) cls.end_date = data.endDate;
  await cls.save();

  return {
    id: cls.id,
    name: cls.name,
    status: cls.status,
    startDate: cls.start_date,
    endDate: cls.end_date,
    updatedAt: cls.updated_at
  };
};

/**
 * DELETE /classes/:id - xóa mềm, mã lớp được giải phóng (partial unique index)
 */
export const deleteClass = async (classId, currentUser) => {
  const cls = await findClassOrFail(classId);
  if (!canManageClass(cls, currentUser)) {
    throw new AppError('Không có quyền xóa lớp học này', 403, 'Forbidden');
  }
  await cls.destroy();
  return true;
};

/**
 * POST /classes/:id/regenerate-code
 */
export const regenerateCode = async (classId, customCode, currentUser) => {
  const cls = await findClassOrFail(classId);
  assertTeacherOrAdmin(cls, currentUser, 'Không có quyền đổi mã lớp học này');

  const newCode = customCode || await generateUniqueCode();
  await assertCodeAvailable(newCode, cls.id);

  cls.class_code = newCode;
  await cls.save();

  return { id: cls.id, newClassCode: cls.class_code };
};

// ==========================================
// 2. GHI DANH & THÀNH VIÊN
// ==========================================

/**
 * Tạo bản ghi ghi danh. Bản ghi cũ đã bị xóa (dropped) không chặn nhờ partial unique index.
 */
const enrollStudent = async (cls, studentId, duplicateMessage) => {
  if (await isActiveMember(cls.id, studentId)) {
    throw new AppError(duplicateMessage, 409, 'Conflict');
  }
  try {
    return await Enrollment.create({ class_id: cls.id, student_id: studentId, status: 'active', enrolled_at: new Date() });
  } catch (error) {
    // Hai request ghi danh song song -> partial unique index chặn bản thứ hai
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError(duplicateMessage, 409, 'Conflict');
    }
    throw error;
  }
};

/**
 * POST /classes/enroll - học viên tham gia bằng mã lớp
 */
export const enrollByCode = async (classCode, currentUser) => {
  const cls = await ClassModel.findOne({
    where: { class_code: classCode },
    include: [{ model: Course, attributes: ['id', 'title', 'status'] }]
  });
  if (!cls || !cls.course) {
    throw new AppError('Mã lớp học không tồn tại', 404, 'Not Found');
  }
  if (cls.status !== 'active') {
    throw new AppError('Lớp học này hiện không nhận thêm học viên', 400, 'Bad Request');
  }

  const enrollment = await enrollStudent(cls, currentUser.id, 'Bạn đã là thành viên của lớp học này rồi');

  return {
    classId: cls.id,
    className: cls.name,
    courseId: cls.course.id,
    courseTitle: cls.course.title,
    enrolledAt: enrollment.enrolled_at
  };
};

/**
 * GET /classes/:id/members
 * Xem được: GV phụ trách, Quản lý, Admin, học viên đang trong lớp.
 * Học viên chỉ thấy bạn học đang active và không thấy email (bảo vệ dữ liệu cá nhân).
 */
export const getMembers = async (classId, query, currentUser) => {
  const cls = await findClassOrFail(classId);
  const manager = canManageClass(cls, currentUser);
  if (!manager && !(currentUser.role === 'student' && await isActiveMember(cls.id, currentUser.id))) {
    throw new AppError('Không có quyền xem danh sách thành viên', 403, 'Forbidden');
  }

  const { page = 1, limit = 20, search } = query;
  const status = manager ? (query.status || 'active') : 'active';

  const userWhere = {};
  if (search) {
    userWhere[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { rows, count } = await Enrollment.findAndCountAll({
    where: { class_id: cls.id, status },
    // Học viên bị xóa khỏi lớp là bản ghi đã xóa mềm -> cần paranoid: false để liệt kê 'dropped'
    paranoid: status === 'active',
    include: [{ model: User, as: 'student', attributes: ['id', 'full_name', 'email', 'avatar_url'], where: userWhere }],
    order: [['enrolled_at', 'ASC']],
    limit,
    offset: (page - 1) * limit
  });

  const totalPages = Math.ceil(count / limit) || 1;
  return {
    items: rows.map((e) => ({
      studentId: e.student.id,
      fullName: e.student.full_name,
      ...(manager ? { email: e.student.email } : {}),
      avatarUrl: e.student.avatar_url,
      enrolledAt: e.enrolled_at,
      status: e.status
    })),
    meta: {
      page,
      limit,
      totalItems: count,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

/**
 * POST /classes/:id/members - thêm học viên bằng email
 */
export const addMember = async (classId, email, currentUser) => {
  const cls = await findClassOrFail(classId);
  assertTeacherOrAdmin(cls, currentUser, 'Không có quyền thêm học viên');
  if (cls.status === 'closed') {
    throw new AppError('Lớp học đã kết thúc, không thể thêm học viên', 400, 'Bad Request');
  }

  const student = await User.findOne({ where: { email }, attributes: ['id', 'full_name', 'email', 'role', 'is_active'] });
  if (!student) {
    throw new AppError('Không tìm thấy tài khoản với email này', 404, 'Not Found');
  }
  if (student.role !== 'student') {
    throw new AppError('Chỉ có thể thêm tài khoản học viên vào lớp', 400, 'Bad Request');
  }
  if (!student.is_active) {
    throw new AppError('Tài khoản học viên này đang bị khóa', 400, 'Bad Request');
  }

  const enrollment = await enrollStudent(cls, student.id, 'Học viên đã có trong danh sách lớp');

  return {
    studentId: student.id,
    fullName: student.full_name,
    email: student.email,
    enrolledAt: enrollment.enrolled_at
  };
};

/**
 * DELETE /classes/:id/members/:studentId - chuyển 'dropped' + xóa mềm, học viên mất quyền xem nội dung
 */
export const removeMember = async (classId, studentId, currentUser) => {
  const cls = await findClassOrFail(classId);
  assertTeacherOrAdmin(cls, currentUser, 'Không có quyền xóa học viên');

  const enrollment = await Enrollment.findOne({ where: { class_id: cls.id, student_id: studentId, status: 'active' } });
  if (!enrollment) {
    throw new AppError('Không tìm thấy học viên trong lớp', 404, 'Not Found');
  }

  await sequelize.transaction(async (transaction) => {
    enrollment.status = 'dropped';
    await enrollment.save({ transaction });
    await enrollment.destroy({ transaction });
  });
  return true;
};

// ==========================================
// 3. BÁO CÁO TIẾN ĐỘ
// ==========================================

const progressStatus = (completed, total) => {
  if (completed === 0) return 'not_started';
  if (total > 0 && completed >= total) return 'completed';
  return 'in_progress';
};

/**
 * GET /classes/:id/progress
 * Tính trên toàn bộ học viên active rồi lọc/sắp xếp/phân trang trong bộ nhớ
 * (sĩ số lớp nhỏ, cần sắp xếp theo % tiến độ là giá trị tính toán).
 */
export const getClassProgress = async (classId, query, currentUser) => {
  const cls = await findClassOrFail(classId);
  if (!canManageClass(cls, currentUser)) {
    throw new AppError('Không có quyền xem tiến độ của lớp', 403, 'Forbidden');
  }

  const { page = 1, limit = 20, search, status, sortBy = 'progress', order = 'asc' } = query;

  const enrollments = await Enrollment.findAll({
    where: { class_id: cls.id, status: 'active' },
    include: [{ model: User, as: 'student', attributes: ['id', 'full_name', 'email', 'avatar_url'] }]
  });
  const lessonIds = await getCourseLessonIds(cls.course_id);
  const totalLessons = lessonIds.length;
  const progress = await getStudentProgress(cls.id, lessonIds, enrollments.map((e) => e.student_id));

  const all = enrollments.map((e) => {
    const completedLessons = progress[e.student_id]?.completedLessons || 0;
    return {
      student: {
        id: e.student.id,
        fullName: e.student.full_name,
        email: e.student.email,
        avatarUrl: e.student.avatar_url
      },
      completedLessons,
      totalLessons,
      progressPercentage: toPercentage(completedLessons, totalLessons),
      status: progressStatus(completedLessons, totalLessons),
      lastActiveAt: progress[e.student_id]?.lastActiveAt || null,
      enrolledAt: e.enrolled_at
    };
  });

  const summary = {
    classId: cls.id,
    className: cls.name,
    totalLessons,
    totalStudents: all.length,
    completedCount: all.filter((x) => x.status === 'completed').length,
    inProgressCount: all.filter((x) => x.status === 'in_progress').length,
    notStartedCount: all.filter((x) => x.status === 'not_started').length,
    averageProgressPercentage: all.length
      ? Math.round((all.reduce((sum, x) => sum + x.progressPercentage, 0) / all.length) * 10) / 10
      : 0
  };

  const keyword = search?.toLowerCase();
  const filtered = all.filter((x) =>
    (!status || x.status === status) &&
    (!keyword || x.student.fullName.toLowerCase().includes(keyword) || x.student.email.toLowerCase().includes(keyword))
  );

  const direction = order === 'desc' ? -1 : 1;
  const compare = {
    progress: (a, b) => a.progressPercentage - b.progressPercentage,
    name: (a, b) => a.student.fullName.localeCompare(b.student.fullName, 'vi'),
    // Chưa hoạt động lần nào xếp như thời điểm sớm nhất
    lastActiveAt: (a, b) => new Date(a.lastActiveAt || 0) - new Date(b.lastActiveAt || 0)
  }[sortBy];
  filtered.sort((a, b) => compare(a, b) * direction);

  const totalPages = Math.ceil(filtered.length / limit) || 1;
  return {
    summary,
    items: filtered.slice((page - 1) * limit, page * limit),
    meta: {
      page,
      limit,
      totalItems: filtered.length,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

export default {
  getClasses,
  getMyClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  regenerateCode,
  enrollByCode,
  getMembers,
  addMember,
  removeMember,
  getClassProgress,
  getLessonProgressSummary
};
