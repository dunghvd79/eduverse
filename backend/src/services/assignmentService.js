import crypto from 'crypto';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Op } from 'sequelize';
import models from '../models/index.js';
import { getS3Client, getS3Config } from '../config/s3.js';
import { AppError } from '../utils/AppError.js';
import { assertCourseEditable } from './courseService.js';
import { canViewAsStaff } from './quizService.js';
import { findClassOrFail, canManageClass, isActiveMember } from './classService.js';
import { createSignedPutUrl, getFileExtension, isMimeAllowed, sanitizeFileName, UPLOAD_URL_EXPIRES_IN } from './uploadService.js';
import { headObject } from './materialService.js';

const {
  sequelize, Assignment, ClassAssignment, AssignmentSubmission, Lesson, Chapter, Course,
  ClassModel, Enrollment, LessonProgress, User
} = models;

const COURSE_ATTRIBUTES = ['id', 'title', 'owner_id', 'status'];
const DOWNLOAD_URL_EXPIRES_IN = 30 * 60;
const MB = 1024 * 1024;

// ==========================================
// HELPERS: KHUNG BÀI TẬP
// ==========================================
const assignmentInclude = [{
  model: Lesson,
  attributes: ['id', 'title', 'lesson_type', 'chapter_id', 'order_index'],
  include: [{ model: Chapter, attributes: ['id', 'course_id', 'order_index'], include: [{ model: Course, attributes: COURSE_ATTRIBUTES }] }]
}];

const courseOf = (assignment) => assignment.lesson?.chapter?.course || null;

export const findAssignmentOrFail = async (assignmentId) => {
  const assignment = await Assignment.findByPk(assignmentId, { include: assignmentInclude });
  if (!assignment || !courseOf(assignment)) {
    throw new AppError('Không tìm thấy bài tập', 404, 'Not Found');
  }
  return assignment;
};

const isOwnerOrAdmin = (course, user) => user.role === 'admin' || course.owner_id === user.id;

/**
 * Bài tập là nội dung khóa học: chỉ chủ khóa/Admin sửa, khi khóa học đang draft/rejected
 */
const assertCanEditAssignment = (assignment, user) => {
  const course = courseOf(assignment);
  if (!isOwnerOrAdmin(course, user)) {
    throw new AppError('Không có quyền sửa bài tập này', 403, 'Forbidden');
  }
  assertCourseEditable(course);
};

export const parseFileTypes = (value) => value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

const mapAssignment = (assignment, extra = {}) => {
  const course = courseOf(assignment);
  return {
    id: assignment.id,
    lessonId: assignment.lesson_id,
    lessonTitle: assignment.lesson?.title || null,
    course: course ? { id: course.id, title: course.title, status: course.status } : null,
    title: assignment.title,
    instruction: assignment.instruction,
    allowedFileTypes: assignment.allowed_file_types,
    maxFileSizeMb: assignment.max_file_size_mb,
    createdAt: assignment.created_at,
    updatedAt: assignment.updated_at,
    ...extra
  };
};

const paginate = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return { page, limit, totalItems, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
};

const enrolledCourseIds = async (studentId) => {
  const enrollments = await Enrollment.findAll({
    where: { student_id: studentId, status: 'active' },
    include: [{ model: ClassModel, as: 'class', attributes: ['course_id'], required: true }]
  });
  return [...new Set(enrollments.map((e) => e.class.course_id))];
};

/**
 * Bài nộp đã xong thì bài học dạng assignment được tính hoàn thành trong tiến độ lớp
 */
const markLessonCompleted = async (classId, studentId, lessonId, transaction) => {
  const now = new Date();
  const [progress] = await LessonProgress.findOrCreate({
    where: { class_id: classId, student_id: studentId, lesson_id: lessonId },
    defaults: { is_completed: true, completed_at: now },
    transaction
  });
  if (!progress.is_completed) {
    progress.is_completed = true;
    progress.completed_at = now;
    await progress.save({ transaction });
  }
};

// ==========================================
// 1. KHUNG BÀI TẬP
// ==========================================

/**
 * GET /assignments - phạm vi giống bài kiểm tra:
 * học viên: khóa published đang học; giảng viên: khóa sở hữu hoặc có lớp mình dạy; Quản lý/Admin: toàn bộ
 */
export const getAssignments = async (query, user) => {
  const { page = 1, limit = 10, lessonId, courseId, search } = query;
  const where = {};
  if (lessonId) where.lesson_id = lessonId;
  if (search) where.title = { [Op.iLike]: `%${search}%` };

  const courseWhere = {};
  if (courseId) courseWhere.id = courseId;
  if (user.role === 'student') {
    courseWhere.status = 'published';
    const ids = await enrolledCourseIds(user.id);
    courseWhere.id = courseId ? (ids.includes(courseId) ? courseId : null) : ids;
  } else if (user.role === 'teacher') {
    const taught = await ClassModel.findAll({ where: { teacher_id: user.id }, attributes: ['course_id'], raw: true });
    courseWhere[Op.or] = [{ owner_id: user.id }, { id: taught.map((c) => c.course_id) }];
  }

  const { rows, count } = await Assignment.findAndCountAll({
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

  return {
    items: rows.map((a) => {
      const { instruction, ...rest } = mapAssignment(a);
      return rest;
    }),
    meta: paginate(page, limit, count)
  };
};

/**
 * GET /assignments/:id
 */
export const getAssignmentById = async (assignmentId, user) => {
  const assignment = await findAssignmentOrFail(assignmentId);
  const course = courseOf(assignment);

  if (user.role === 'student') {
    const ids = await enrolledCourseIds(user.id);
    if (course.status !== 'published' || !ids.includes(course.id)) {
      throw new AppError('Không tìm thấy bài tập', 404, 'Not Found');
    }
    return mapAssignment(assignment);
  }

  if (!(await canViewAsStaff(course, user))) {
    throw new AppError('Không có quyền xem bài tập này', 403, 'Forbidden');
  }
  const canEdit = isOwnerOrAdmin(course, user) && ['draft', 'rejected'].includes(course.status);
  return mapAssignment(assignment, { canEdit });
};

/**
 * POST /assignments - gắn 1:1 với bài học loại 'assignment'
 */
export const createAssignment = async (data, user) => {
  const lesson = await Lesson.findByPk(data.lessonId, {
    include: [{ model: Chapter, include: [{ model: Course, attributes: COURSE_ATTRIBUTES }] }]
  });
  const course = lesson?.chapter?.course;
  if (!lesson || !course) {
    throw new AppError('Không tìm thấy bài học liên kết', 404, 'Not Found');
  }
  if (!isOwnerOrAdmin(course, user)) {
    throw new AppError('Không có quyền tạo bài tập cho khóa học này', 403, 'Forbidden');
  }
  assertCourseEditable(course);
  if (lesson.lesson_type !== 'assignment') {
    throw new AppError('Chỉ tạo được bài tập cho bài học loại "Bài tập"', 400, 'Bad Request');
  }
  if ((await Assignment.count({ where: { lesson_id: lesson.id } })) > 0) {
    throw new AppError('Bài học này đã có bài tập', 409, 'Conflict');
  }

  const assignment = await Assignment.create({
    lesson_id: lesson.id,
    title: data.title,
    instruction: data.instruction,
    allowed_file_types: data.allowedFileTypes,
    max_file_size_mb: data.maxFileSizeMb
  });
  return mapAssignment(await findAssignmentOrFail(assignment.id));
};

/**
 * PATCH /assignments/:id
 */
export const updateAssignment = async (assignmentId, data, user) => {
  const assignment = await findAssignmentOrFail(assignmentId);
  assertCanEditAssignment(assignment, user);
  const fields = { title: 'title', instruction: 'instruction', allowedFileTypes: 'allowed_file_types', maxFileSizeMb: 'max_file_size_mb' };
  Object.entries(fields).forEach(([key, column]) => {
    if (data[key] !== undefined) assignment[column] = data[key];
  });
  await assignment.save();
  return mapAssignment(assignment);
};

/**
 * DELETE /assignments/:id - xóa mềm
 */
export const deleteAssignment = async (assignmentId, user) => {
  const assignment = await findAssignmentOrFail(assignmentId);
  assertCanEditAssignment(assignment, user);
  await assignment.destroy();
  return true;
};

// ==========================================
// HELPERS: LỚP & LỊCH NỘP
// ==========================================

/**
 * Quyền xem bài tập của lớp: người quản lý lớp (GV phụ trách, Quản lý, Admin) hoặc học viên đang học
 */
const resolveClassViewer = async (classId, user) => {
  const cls = await findClassOrFail(classId);
  const manager = canManageClass(cls, user);
  if (!manager && !(user.role === 'student' && await isActiveMember(cls.id, user.id))) {
    throw new AppError(user.role === 'student' ? 'Bạn không thuộc lớp học này' : 'Không có quyền truy cập lớp học này', 403, 'Forbidden');
  }
  return { cls, manager };
};

/**
 * Giao bài, chấm bài: GV phụ trách lớp hoặc Admin (api-assignments.md: [teacher, admin])
 */
const assertClassGrader = (cls, user, message = 'Không có quyền quản lý bài tập của lớp này') => {
  if (user.role !== 'admin' && !(user.role === 'teacher' && cls.teacher_id === user.id)) {
    throw new AppError(message, 403, 'Forbidden');
  }
};

/**
 * Bài tập phải thuộc khóa học của lớp
 */
const findClassAssignmentContext = async (cls, assignmentId) => {
  const assignment = await findAssignmentOrFail(assignmentId);
  if (courseOf(assignment).id !== cls.course_id) {
    throw new AppError('Không tìm thấy bài tập trong khóa học của lớp này', 404, 'Not Found');
  }
  const classAssignment = await ClassAssignment.findOne({ where: { class_id: cls.id, assignment_id: assignment.id } });
  return { assignment, classAssignment };
};

/**
 * Trạng thái cửa sổ nộp bài:
 * not_scheduled (chưa giao) | not_open (chưa mở) | on_time | late (được nộp muộn) | closed
 */
const windowOf = (classAssignment, now = new Date()) => {
  if (!classAssignment) return 'not_scheduled';
  const open = classAssignment.open_time ? new Date(classAssignment.open_time) : null;
  const deadline = new Date(classAssignment.deadline);
  const cutoff = classAssignment.cutoff_time ? new Date(classAssignment.cutoff_time) : null;
  if (open && now < open) return 'not_open';
  if (now <= deadline) return 'on_time';
  if (classAssignment.allow_late_submission && (!cutoff || now <= cutoff)) return 'late';
  return 'closed';
};

const scheduleOf = (classAssignment) => ({
  classAssignmentId: classAssignment?.id || null,
  openTime: classAssignment?.open_time || null,
  deadline: classAssignment?.deadline || null,
  cutoffTime: classAssignment?.cutoff_time || null,
  allowLateSubmission: classAssignment ? classAssignment.allow_late_submission : null
});

const windowFlags = (classAssignment, now = new Date()) => {
  const window = windowOf(classAssignment, now);
  return {
    isScheduled: Boolean(classAssignment),
    isOpen: window === 'on_time' || window === 'late',
    isLatePeriod: window === 'late',
    isClosed: window === 'closed',
    isExpired: Boolean(classAssignment) && now > new Date(classAssignment.deadline)
  };
};

/**
 * Học viên có được nộp (hoặc nộp lại) không. Trả lý do nếu không.
 * - GV yêu cầu nộp lại -> luôn được nộp (bỏ qua hạn)
 * - Đã chấm -> không tự nộp lại được
 * - Còn lại theo cửa sổ nộp bài
 */
const submitBlockReason = (cls, classAssignment, submission, now = new Date()) => {
  if (submission?.status === 'resubmission_requested') return null;
  if (!classAssignment) return 'Bài tập chưa được giao cho lớp';
  if (cls.status !== 'active') return 'Lớp học không còn hoạt động';
  if (submission && submission.grade !== null) return 'Bài tập đã được chấm, không thể nộp lại';
  const window = windowOf(classAssignment, now);
  if (window === 'not_open') return 'Bài tập chưa mở nhận bài';
  if (window === 'closed') {
    return classAssignment.allow_late_submission
      ? 'Bài tập đã khóa hoàn toàn (quá hạn chót nhận bài muộn)'
      : 'Bài tập đã hết hạn nộp và không cho phép nộp muộn';
  }
  return null;
};

const lateMinutes = (classAssignment, submittedAt) => {
  if (!classAssignment) return 0;
  const diff = new Date(submittedAt) - new Date(classAssignment.deadline);
  return diff > 0 ? Math.floor(diff / 60000) : 0;
};

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

/**
 * Bài cần chấm: chưa có điểm, hoặc nộp lại sau lần chấm gần nhất
 */
const needsGrading = (submission) =>
  ['submitted', 'late_submitted'].includes(submission.status)
  && (submission.grade === null || (submission.graded_at && new Date(submission.submitted_at) > new Date(submission.graded_at)));

const signDownloadUrl = async (key, fileName) => {
  try {
    const { bucket } = getS3Config();
    const disposition = `attachment; filename="${sanitizeFileName(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
    return await getSignedUrl(getS3Client(), new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: disposition }), { expiresIn: DOWNLOAD_URL_EXPIRES_IN });
  } catch {
    // Chưa cấu hình S3 -> vẫn trả thông tin bài nộp, chỉ thiếu link tải
    return null;
  }
};

const mapSubmission = (submission, classAssignment, extra = {}) => ({
  id: submission.id,
  fileName: submission.file_name,
  fileSize: Number(submission.file_size),
  studentNote: submission.student_note,
  submittedAt: submission.submitted_at,
  status: submission.status,
  isLate: submission.status === 'late_submitted' || lateMinutes(classAssignment, submission.submitted_at) > 0,
  lateDurationMinutes: lateMinutes(classAssignment, submission.submitted_at),
  grade: toNumber(submission.grade),
  feedback: submission.feedback,
  gradedAt: submission.graded_at,
  needsGrading: needsGrading(submission),
  resubmissionReason: submission.resubmission_reason,
  resubmissionRequestedAt: submission.resubmission_requested_at,
  ...extra
});

// ==========================================
// 2. BÀI TẬP CỦA LỚP & LỊCH NỘP
// ==========================================

const courseAssignments = (courseId) => Assignment.findAll({
  include: [{
    model: Lesson,
    attributes: ['id', 'title', 'order_index'],
    required: true,
    include: [{ model: Chapter, attributes: ['id', 'order_index'], where: { course_id: courseId }, required: true }]
  }],
  order: [[Lesson, Chapter, 'order_index', 'ASC'], [Lesson, 'order_index', 'ASC']]
});

/**
 * GET /classes/:classId/assignments
 * - Học viên: bài đã được giao (có lịch) + bài nộp của mình
 * - Người quản lý lớp: mọi bài tập của khóa (kể cả chưa giao) + thống kê nộp bài
 */
export const getClassAssignments = async (classId, user) => {
  const { cls, manager } = await resolveClassViewer(classId, user);
  if (!manager && cls.course.status !== 'published') return { items: [] };

  const assignments = await courseAssignments(cls.course_id);
  const classAssignments = await ClassAssignment.findAll({ where: { class_id: cls.id, assignment_id: assignments.map((a) => a.id) } });
  const byAssignment = Object.fromEntries(classAssignments.map((ca) => [ca.assignment_id, ca]));
  const submissions = await AssignmentSubmission.findAll({
    where: {
      class_assignment_id: classAssignments.map((ca) => ca.id),
      ...(manager ? {} : { student_id: user.id })
    }
  });

  let activeStudentIds = new Set();
  if (manager) {
    const enrollments = await Enrollment.findAll({ where: { class_id: cls.id, status: 'active' }, attributes: ['student_id'], raw: true });
    activeStudentIds = new Set(enrollments.map((e) => e.student_id));
  }
  const now = new Date();

  const items = assignments
    .filter((a) => manager || byAssignment[a.id])
    .map((assignment) => {
      const classAssignment = byAssignment[assignment.id];
      const base = {
        id: assignment.id,
        title: assignment.title,
        lessonId: assignment.lesson_id,
        lessonTitle: assignment.lesson.title,
        allowedFileTypes: assignment.allowed_file_types,
        maxFileSizeMb: assignment.max_file_size_mb,
        ...scheduleOf(classAssignment),
        ...windowFlags(classAssignment, now)
      };
      const own = submissions.filter((s) => s.class_assignment_id === classAssignment?.id);

      if (!manager) {
        const mine = own[0];
        return {
          ...base,
          mySubmission: mine ? {
            id: mine.id,
            status: mine.status,
            submittedAt: mine.submitted_at,
            grade: toNumber(mine.grade),
            isLate: mine.status === 'late_submitted'
          } : null,
          canSubmit: !submitBlockReason(cls, classAssignment, mine, now)
        };
      }

      // Thống kê chỉ tính học viên đang học (bỏ bài của học viên đã rời lớp)
      const active = own.filter((s) => activeStudentIds.has(s.student_id));
      return {
        ...base,
        stats: {
          totalEnrolled: activeStudentIds.size,
          submittedCount: active.length,
          lateCount: active.filter((s) => s.status === 'late_submitted').length,
          gradedCount: active.filter((s) => s.grade !== null && !needsGrading(s)).length,
          needsGradingCount: active.filter(needsGrading).length,
          resubmissionRequestedCount: active.filter((s) => s.status === 'resubmission_requested').length,
          missingCount: activeStudentIds.size - active.length
        }
      };
    });

  return { items };
};

/**
 * GET /classes/:classId/assignments/:assignmentId
 */
export const getClassAssignment = async (classId, assignmentId, user) => {
  const { cls, manager } = await resolveClassViewer(classId, user);
  const { assignment, classAssignment } = await findClassAssignmentContext(cls, assignmentId);
  if (!manager && (!classAssignment || cls.course.status !== 'published')) {
    throw new AppError('Bài tập chưa được giao cho lớp', 404, 'Not Found');
  }
  const data = {
    ...mapAssignment(assignment),
    classId: cls.id,
    className: cls.name,
    ...scheduleOf(classAssignment),
    ...windowFlags(classAssignment)
  };
  if (manager) {
    data.canSchedule = user.role === 'admin' || (user.role === 'teacher' && cls.teacher_id === user.id);
  }
  return data;
};

/**
 * PUT /classes/:classId/assignments/:assignmentId/schedule
 */
export const scheduleAssignment = async (classId, assignmentId, data, user) => {
  const cls = await findClassOrFail(classId);
  assertClassGrader(cls, user, 'Không có quyền quản lý lớp học này');
  const { assignment, classAssignment } = await findClassAssignmentContext(cls, assignmentId);

  const openTime = data.openTime ? new Date(data.openTime) : (classAssignment?.open_time || new Date());
  const deadline = new Date(data.deadline);
  const allowLate = data.allowLateSubmission ?? true;
  let cutoffTime = data.cutoffTime ? new Date(data.cutoffTime) : null;

  if (deadline <= openTime) {
    throw new AppError('Thời gian deadline không hợp lệ: phải sau thời điểm mở đề', 400, 'Bad Request');
  }
  if (!allowLate) {
    cutoffTime = deadline;
  } else if (cutoffTime && cutoffTime < deadline) {
    throw new AppError('Hạn chót nhận bài muộn (cutoffTime) phải sau hoặc bằng deadline', 400, 'Bad Request');
  }

  const values = { open_time: openTime, deadline, cutoff_time: cutoffTime, allow_late_submission: allowLate };
  let saved;
  if (classAssignment) {
    saved = await classAssignment.update(values);
  } else {
    try {
      saved = await ClassAssignment.create({ class_id: cls.id, assignment_id: assignment.id, ...values });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        saved = await (await ClassAssignment.findOne({ where: { class_id: cls.id, assignment_id: assignment.id } })).update(values);
      } else {
        throw error;
      }
    }
  }

  return { classId: cls.id, assignmentId: assignment.id, ...scheduleOf(saved), ...windowFlags(saved), updatedAt: new Date() };
};

// ==========================================
// 3. NỘP BÀI (HỌC VIÊN)
// ==========================================

const submissionKeyPrefix = (classId, assignmentId, studentId) => `private/assignments/${classId}/${assignmentId}/${studentId}/`;

/**
 * Ngữ cảnh nộp bài của học viên: lớp đang học, bài đã giao, bài nộp hiện có
 */
const studentSubmitContext = async (classId, assignmentId, user, transaction) => {
  const cls = await findClassOrFail(classId);
  if (!(await isActiveMember(cls.id, user.id))) {
    throw new AppError('Bạn chưa ghi danh vào lớp học này', 403, 'Forbidden');
  }
  const { assignment, classAssignment } = await findClassAssignmentContext(cls, assignmentId);
  if (!classAssignment || cls.course.status !== 'published') {
    throw new AppError('Bài tập chưa được giao cho lớp', 404, 'Not Found');
  }
  const submission = await AssignmentSubmission.findOne({
    where: { class_assignment_id: classAssignment.id, student_id: user.id },
    ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {})
  });
  return { cls, assignment, classAssignment, submission };
};

const assertFileAllowed = (assignment, fileName, fileSize) => {
  const ext = getFileExtension(fileName);
  const allowed = parseFileTypes(assignment.allowed_file_types);
  if (!allowed.includes(ext)) {
    throw new AppError(`Định dạng tệp không được hỗ trợ (chỉ nhận: ${allowed.join(', ')})`, 400, 'Bad Request');
  }
  if (fileSize > assignment.max_file_size_mb * MB) {
    throw new AppError(`Dung lượng tệp vượt quá giới hạn (tối đa ${assignment.max_file_size_mb}MB)`, 400, 'Bad Request');
  }
  return ext;
};

/**
 * POST /classes/:classId/assignments/:assignmentId/submissions/presigned-url
 */
export const createSubmissionUploadUrl = async (classId, assignmentId, user, { fileName, fileSize, contentType }) => {
  const { cls, assignment, classAssignment, submission } = await studentSubmitContext(classId, assignmentId, user);
  const ext = assertFileAllowed(assignment, fileName, fileSize);
  if (!isMimeAllowed(ext, contentType)) {
    throw new AppError('Định dạng tệp không được hỗ trợ (MIME type không khớp đuôi tệp)', 400, 'Bad Request');
  }
  const blocked = submitBlockReason(cls, classAssignment, submission);
  if (blocked) {
    throw new AppError(blocked, 403, 'Forbidden');
  }

  const fileKey = `${submissionKeyPrefix(cls.id, assignment.id, user.id)}${crypto.randomUUID()}_${sanitizeFileName(fileName)}`;
  const uploadUrl = await createSignedPutUrl({ key: fileKey, contentType, fileSize });
  return { uploadUrl, fileKey, expiresInSeconds: UPLOAD_URL_EXPIRES_IN };
};

/**
 * POST /classes/:classId/assignments/:assignmentId/submissions - xác nhận nộp / nộp lại
 */
export const confirmSubmission = async (classId, assignmentId, user, { fileKey, fileName, fileSize, studentNote }) => {
  const { bucket } = getS3Config();
  let oldKey = null;

  const result = await sequelize.transaction(async (transaction) => {
    const { cls, assignment, classAssignment, submission } = await studentSubmitContext(classId, assignmentId, user, transaction);
    const blocked = submitBlockReason(cls, classAssignment, submission);
    if (blocked) {
      throw new AppError(blocked, 403, 'Forbidden');
    }

    const prefix = submissionKeyPrefix(cls.id, assignment.id, user.id);
    const keyName = fileKey.startsWith(prefix) ? fileKey.slice(prefix.length) : '';
    if (!keyName || keyName.includes('/')) {
      throw new AppError('Tệp tải lên không thuộc bài nộp của bạn', 400, 'Bad Request');
    }
    const ext = assertFileAllowed(assignment, fileName, fileSize);
    if (getFileExtension(keyName) !== ext) {
      throw new AppError('Tên tệp không khớp với tệp đã tải lên', 400, 'Bad Request');
    }
    if (submission && submission.file_url === fileKey) {
      throw new AppError('Tệp này đã được nộp trước đó', 409, 'Conflict');
    }

    const head = await headObject(bucket, fileKey);
    if (!head) {
      throw new AppError('Tệp chưa được tải lên máy chủ lưu trữ', 400, 'Bad Request');
    }
    if (Number(head.ContentLength) !== fileSize) {
      throw new AppError('Dung lượng tệp không khớp với tệp đã tải lên', 400, 'Bad Request');
    }

    const now = new Date();
    const isLate = now > new Date(classAssignment.deadline);
    const values = {
      file_url: fileKey,
      file_name: fileName,
      file_size: fileSize,
      student_note: studentNote || null,
      submitted_at: now,
      // Điểm & nhận xét cũ được GIỮ khi nộp lại (grading-policy.md E3) - GV chấm lại sẽ ghi đè
      status: isLate ? 'late_submitted' : 'submitted'
    };

    let saved;
    if (submission) {
      oldKey = submission.file_url;
      saved = await submission.update(values, { transaction });
    } else {
      saved = await AssignmentSubmission.create({ class_assignment_id: classAssignment.id, student_id: user.id, ...values }, { transaction });
    }
    await markLessonCompleted(cls.id, user.id, assignment.lesson_id, transaction);

    return {
      submissionId: saved.id,
      fileName: saved.file_name,
      fileSize: Number(saved.file_size),
      status: saved.status,
      isLate,
      lateDurationMinutes: lateMinutes(classAssignment, now),
      submittedAt: saved.submitted_at,
      isResubmission: Boolean(submission)
    };
  });

  // Xóa tệp cũ sau khi đã lưu bản mới; lỗi chỉ ghi log (tệp mồ côi được Lifecycle Rule dọn)
  if (oldKey && oldKey !== fileKey) {
    getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: oldKey }))
      .catch((error) => console.error(`⚠️ Không xóa được tệp bài nộp cũ "${oldKey}":`, error.name, error.message));
  }
  return result;
};

/**
 * GET /classes/:classId/assignments/:assignmentId/my-submission
 */
export const getMySubmission = async (classId, assignmentId, user) => {
  const { cls, classAssignment, submission } = await studentSubmitContext(classId, assignmentId, user);
  const blocked = submitBlockReason(cls, classAssignment, submission);
  const window = { ...scheduleOf(classAssignment), ...windowFlags(classAssignment) };

  if (!submission) {
    return { hasSubmitted: false, submission: null, canSubmit: !blocked, submitBlockedReason: blocked, ...window };
  }
  return {
    hasSubmitted: true,
    canSubmit: !blocked,
    submitBlockedReason: blocked,
    ...window,
    submission: mapSubmission(submission, classAssignment, {
      downloadUrl: await signDownloadUrl(submission.file_url, submission.file_name),
      canResubmit: !blocked
    })
  };
};

// ==========================================
// 4. CHẤM BÀI (GIẢNG VIÊN)
// ==========================================

/**
 * GET /classes/:classId/assignments/:assignmentId/submissions
 * Danh sách theo học viên đang học: có bài nộp hoặc 'missing' (chưa nộp)
 */
export const getSubmissions = async (classId, assignmentId, user, query) => {
  const cls = await findClassOrFail(classId);
  assertClassGrader(cls, user, 'Không có quyền xem danh sách này');
  const { classAssignment } = await findClassAssignmentContext(cls, assignmentId);
  const { page = 1, limit = 20, status, search, sortBy = 'submittedAt', sortOrder = 'DESC' } = query;

  const enrollments = await Enrollment.findAll({
    where: { class_id: cls.id, status: 'active' },
    include: [{ model: User, as: 'student', attributes: ['id', 'full_name', 'email', 'avatar_url'] }]
  });
  const submissions = classAssignment
    ? await AssignmentSubmission.findAll({ where: { class_assignment_id: classAssignment.id } })
    : [];
  const byStudent = Object.fromEntries(submissions.map((s) => [s.student_id, s]));

  const all = enrollments.map((e) => {
    const s = byStudent[e.student_id];
    return {
      submissionId: s?.id || null,
      student: { id: e.student.id, fullName: e.student.full_name, email: e.student.email, avatarUrl: e.student.avatar_url },
      fileName: s?.file_name || null,
      fileSize: s ? Number(s.file_size) : null,
      submittedAt: s?.submitted_at || null,
      status: s?.status || 'missing',
      isLate: s ? s.status === 'late_submitted' : false,
      lateDurationMinutes: s ? lateMinutes(classAssignment, s.submitted_at) : 0,
      grade: s ? toNumber(s.grade) : null,
      needsGrading: s ? needsGrading(s) : false
    };
  });

  const summary = {
    totalEnrolled: all.length,
    submittedCount: all.filter((x) => x.status !== 'missing').length,
    lateCount: all.filter((x) => x.status === 'late_submitted').length,
    gradedCount: all.filter((x) => x.grade !== null && !x.needsGrading).length,
    needsGradingCount: all.filter((x) => x.needsGrading).length,
    resubmissionRequestedCount: all.filter((x) => x.status === 'resubmission_requested').length,
    missingCount: all.filter((x) => x.status === 'missing').length
  };

  const keyword = search?.toLowerCase();
  const filtered = all.filter((x) =>
    (!status || (status === 'needs_grading' ? x.needsGrading : x.status === status)) &&
    (!keyword || x.student.fullName.toLowerCase().includes(keyword) || x.student.email.toLowerCase().includes(keyword))
  );
  const direction = sortOrder === 'ASC' ? 1 : -1;
  const compare = {
    submittedAt: (a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0),
    studentName: (a, b) => a.student.fullName.localeCompare(b.student.fullName, 'vi'),
    grade: (a, b) => (a.grade ?? -1) - (b.grade ?? -1)
  }[sortBy];
  filtered.sort((a, b) => compare(a, b) * direction);

  return {
    ...scheduleOf(classAssignment),
    items: filtered.slice((page - 1) * limit, page * limit),
    meta: paginate(page, limit, filtered.length),
    summary
  };
};

/**
 * Bài nộp + lớp + bài tập, kiểm tra người chấm
 */
const findSubmissionForGrader = async (submissionId, user, transaction) => {
  const submission = await AssignmentSubmission.findByPk(submissionId, {
    include: [{ model: ClassAssignment, include: [{ model: ClassModel, attributes: ['id', 'name', 'teacher_id', 'course_id'] }] }],
    transaction
  });
  if (!submission || !submission.class_assignment?.class) {
    throw new AppError('Không tìm thấy bản ghi bài nộp', 404, 'Not Found');
  }
  assertClassGrader(submission.class_assignment.class, user, 'Không có quyền chấm bài này');
  return submission;
};

/**
 * GET /assignment-submissions/:id
 */
export const getSubmissionDetail = async (submissionId, user) => {
  const submission = await findSubmissionForGrader(submissionId, user);
  const classAssignment = submission.class_assignment;
  const [student, assignment] = await Promise.all([
    User.findByPk(submission.student_id, { attributes: ['id', 'full_name', 'email', 'avatar_url'], paranoid: false }),
    Assignment.findByPk(classAssignment.assignment_id, { attributes: ['id', 'title', 'max_file_size_mb'], paranoid: false })
  ]);
  return mapSubmission(submission, classAssignment, {
    student: { id: student.id, fullName: student.full_name, email: student.email, avatarUrl: student.avatar_url },
    assignment: { id: assignment.id, title: assignment.title },
    class: { id: classAssignment.class.id, name: classAssignment.class.name },
    deadline: classAssignment.deadline,
    downloadUrl: await signDownloadUrl(submission.file_url, submission.file_name)
  });
};

const applyGrade = async (submission, { grade, feedback }, user, transaction) => {
  submission.grade = grade;
  if (feedback !== undefined) submission.feedback = feedback || null;
  submission.status = 'graded';
  submission.graded_by = user.id;
  submission.graded_at = new Date();
  await submission.save({ transaction });

  const assignment = await Assignment.findByPk(submission.class_assignment.assignment_id, { attributes: ['lesson_id'], paranoid: false, transaction });
  await markLessonCompleted(submission.class_assignment.class_id, submission.student_id, assignment.lesson_id, transaction);
};

/**
 * PATCH /assignment-submissions/:id/grade - chấm / chấm lại
 */
export const gradeSubmission = async (submissionId, user, data) => {
  const submission = await sequelize.transaction(async (transaction) => {
    const found = await findSubmissionForGrader(submissionId, user, transaction);
    await applyGrade(found, data, user, transaction);
    return found;
  });
  return {
    id: submission.id,
    grade: toNumber(submission.grade),
    feedback: submission.feedback,
    status: submission.status,
    gradedBy: submission.graded_by,
    gradedAt: submission.graded_at
  };
};

/**
 * POST /assignment-submissions/:id/request-resubmission
 * Giữ điểm & nhận xét cũ (grading-policy.md E3), lưu lý do riêng; học viên được nộp lại kể cả quá hạn.
 */
export const requestResubmission = async (submissionId, user, reason) => {
  const submission = await findSubmissionForGrader(submissionId, user);
  submission.status = 'resubmission_requested';
  submission.resubmission_reason = reason;
  submission.resubmission_requested_at = new Date();
  await submission.save();
  return {
    id: submission.id,
    status: submission.status,
    grade: toNumber(submission.grade),
    resubmissionReason: submission.resubmission_reason,
    requestedAt: submission.resubmission_requested_at
  };
};

/**
 * PATCH /classes/:classId/assignments/:assignmentId/submissions/bulk-grade
 */
export const bulkGrade = async (classId, assignmentId, user, grades) => {
  const cls = await findClassOrFail(classId);
  assertClassGrader(cls, user, 'Không có quyền chấm bài lớp này');
  const { classAssignment } = await findClassAssignmentContext(cls, assignmentId);
  if (!classAssignment) {
    throw new AppError('Bài tập chưa được giao cho lớp', 404, 'Not Found');
  }

  await sequelize.transaction(async (transaction) => {
    const submissions = await AssignmentSubmission.findAll({
      where: { id: grades.map((g) => g.submissionId), class_assignment_id: classAssignment.id },
      include: [{ model: ClassAssignment, include: [{ model: ClassModel, attributes: ['id', 'teacher_id'] }] }],
      transaction
    });
    if (submissions.length !== grades.length) {
      throw new AppError('Có bài nộp không thuộc bài tập của lớp này', 404, 'Not Found');
    }
    const byId = Object.fromEntries(submissions.map((s) => [s.id, s]));
    for (const item of grades) {
      await applyGrade(byId[item.submissionId], item, user, transaction);
    }
  });
  return { totalUpdated: grades.length };
};

// Dùng cho dịch vụ nén ZIP
export const getZipContext = async (classId, assignmentId, user) => {
  const cls = await findClassOrFail(classId);
  assertClassGrader(cls, user, 'Không có quyền tải bài làm lớp này');
  const { assignment, classAssignment } = await findClassAssignmentContext(cls, assignmentId);
  const submissions = classAssignment
    ? await AssignmentSubmission.findAll({
      where: { class_assignment_id: classAssignment.id },
      include: [{ model: User, as: 'student', attributes: ['id', 'full_name', 'email'] }],
      order: [['submitted_at', 'ASC']]
    })
    : [];
  return { cls, assignment, submissions };
};

export default {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getClassAssignments,
  getClassAssignment,
  scheduleAssignment,
  createSubmissionUploadUrl,
  confirmSubmission,
  getMySubmission,
  getSubmissions,
  getSubmissionDetail,
  gradeSubmission,
  requestResubmission,
  bulkGrade
};
