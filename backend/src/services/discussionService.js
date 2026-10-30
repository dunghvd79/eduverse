import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { findClassOrFail, isActiveMember } from './classService.js';
import { notifyDiscussionQuestion, notifyDiscussionReply } from './notificationService.js';
import {
  accessOf,
  permissionsOf,
  writeDenialOf,
  normalizeContent,
  isClassOpen,
  lastActivityOf
} from '../utils/discussionRules.js';

const { sequelize, LessonDiscussion, Lesson, Chapter, User } = models;

/**
 * Thảo luận / Hỏi đáp trong bài học (docs/api/api-discussions.md, BR-070 → BR-078).
 * Quy tắc quyền nằm ở utils/discussionRules.js (hàm thuần, có unit test); file này nạp dữ liệu và ghi CSDL.
 */

const AUTHOR_ATTRIBUTES = ['id', 'full_name', 'avatar_url', 'role'];
const authorInclude = { model: User, as: 'author', attributes: AUTHOR_ATTRIBUTES, paranoid: false };

const CLOSED_MESSAGE = 'Lớp học đã tạm dừng hoặc kết thúc, thảo luận chỉ có thể xem';

// ==========================================
// HELPERS: NGỮ CẢNH & QUYỀN
// ==========================================

/**
 * Nạp lớp và xác định vai trò của người xem. Không xem được -> 403.
 */
const loadClassContext = async (classId, user) => {
  const cls = await findClassOrFail(classId);
  const isActiveStudent = user.role === 'student' ? await isActiveMember(cls.id, user.id) : false;
  const access = accessOf({
    role: user.role,
    userId: user.id,
    classTeacherId: cls.teacher_id,
    isActiveStudent
  });
  if (!access.canView) {
    throw new AppError('Bạn không có quyền truy cập thảo luận của lớp học này', 403, 'Forbidden');
  }
  return { cls, access };
};

/**
 * Bài học phải thuộc khóa học của lớp, nếu không -> 404.
 */
const findLessonInClass = async (cls, lessonId) => {
  const lesson = await Lesson.findByPk(lessonId, {
    attributes: ['id', 'title'],
    include: [{ model: Chapter, attributes: ['id', 'course_id'], required: true, where: { course_id: cls.course_id } }]
  });
  if (!lesson) {
    throw new AppError('Không tìm thấy bài học trong lớp học này', 404, 'Not Found');
  }
  return lesson;
};

/**
 * Nạp một bài thảo luận (chưa xóa) cùng lớp và quyền của người xem.
 */
const loadDiscussion = async (id, user) => {
  const discussion = await LessonDiscussion.findByPk(id, { include: [authorInclude] });
  if (!discussion) {
    throw new AppError('Không tìm thấy bài thảo luận', 404, 'Not Found');
  }
  const { cls, access } = await loadClassContext(discussion.class_id, user);
  return { discussion, cls, access };
};

/**
 * Chặn thao tác ghi: Quản lý/Admin -> 403, lớp tạm dừng/kết thúc -> 409.
 */
const assertCanWrite = (cls, access) => {
  const denial = writeDenialOf({ access, classStatus: cls.status });
  if (denial === 'role') {
    throw new AppError('Chỉ học viên của lớp và giảng viên phụ trách được đăng và trả lời thảo luận', 403, 'Forbidden');
  }
  if (denial === 'closed') {
    throw new AppError(CLOSED_MESSAGE, 409, 'Conflict');
  }
};

// ==========================================
// HELPERS: MAP DỮ LIỆU
// ==========================================
const mapAuthor = (author) => (author ? {
  id: author.id,
  fullName: author.full_name,
  avatarUrl: author.avatar_url,
  role: author.role
} : null);

const permissionsFor = (d, cls, access, user) => permissionsOf({
  access,
  userId: user.id,
  classStatus: cls.status,
  discussion: { authorId: d.author_id, parentId: d.parent_id }
});

const mapReply = (d, cls, access, user) => {
  const perms = permissionsFor(d, cls, access, user);
  return {
    id: d.id,
    content: d.content,
    editedAt: d.edited_at,
    createdAt: d.created_at,
    author: mapAuthor(d.author),
    canEdit: perms.canEdit,
    canDelete: perms.canDelete
  };
};

const mapQuestion = (d, replies, cls, access, user) => {
  const perms = permissionsFor(d, cls, access, user);
  return {
    id: d.id,
    classId: d.class_id,
    lessonId: d.lesson_id,
    content: d.content,
    isResolved: d.is_resolved,
    editedAt: d.edited_at,
    createdAt: d.created_at,
    author: mapAuthor(d.author),
    canEdit: perms.canEdit,
    canDelete: perms.canDelete,
    canResolve: perms.canResolve,
    replies: replies.map((r) => mapReply(r, cls, access, user))
  };
};

const loadReplies = (parentId) => LessonDiscussion.findAll({
  where: { parent_id: parentId },
  include: [authorInclude],
  order: [['created_at', 'ASC']]
});

const groupReplies = (replies) => {
  const map = new Map();
  for (const reply of replies) {
    if (!map.has(reply.parent_id)) map.set(reply.parent_id, []);
    map.get(reply.parent_id).push(reply);
  }
  return map;
};

const buildMeta = (page, limit, count) => {
  const totalPages = Math.ceil(count / limit) || 1;
  return { page, limit, totalItems: count, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
};

const statusFilter = (status) => {
  if (status === 'open') return { is_resolved: false };
  if (status === 'resolved') return { is_resolved: true };
  return {};
};

// ==========================================
// 1. DANH SÁCH
// ==========================================

/**
 * GET /classes/:classId/lessons/:lessonId/discussions
 * Phân trang theo câu hỏi gốc (mới nhất trước); câu trả lời trả đầy đủ bên trong, cũ nhất trước.
 */
export const listLessonDiscussions = async (classId, lessonId, query, user) => {
  const { cls, access } = await loadClassContext(classId, user);
  await findLessonInClass(cls, lessonId);

  const { status = 'all', page = 1, limit = 20 } = query;
  const { rows, count } = await LessonDiscussion.findAndCountAll({
    where: { class_id: cls.id, lesson_id: lessonId, parent_id: null, ...statusFilter(status) },
    include: [authorInclude],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });

  const replies = rows.length === 0 ? [] : await LessonDiscussion.findAll({
    where: { parent_id: rows.map((r) => r.id) },
    include: [authorInclude],
    order: [['created_at', 'ASC']]
  });
  const repliesOf = groupReplies(replies);

  return {
    items: rows.map((d) => mapQuestion(d, repliesOf.get(d.id) || [], cls, access, user)),
    canPost: writeDenialOf({ access, classStatus: cls.status }) === null,
    totalReplies: replies.length,
    meta: buildMeta(page, limit, count)
  };
};

/**
 * GET /classes/:classId/discussions - tổng quan cả lớp cho giảng viên phụ trách, Quản lý, Admin.
 * Sắp theo hoạt động gần nhất (câu trả lời mới nhất, hoặc chính câu hỏi nếu chưa có trả lời).
 */
export const listClassDiscussions = async (classId, query, user) => {
  const { cls, access } = await loadClassContext(classId, user);
  if (!access.isStaff && !access.isClassTeacher) {
    throw new AppError('Chỉ giảng viên phụ trách, Quản lý đào tạo và Admin xem được tổng quan thảo luận của lớp', 403, 'Forbidden');
  }

  const { status = 'open', lessonId, page = 1, limit = 20 } = query;
  const lastActivity = sequelize.literal(
    `GREATEST("lesson_discussions"."created_at", COALESCE((SELECT MAX(r."created_at") FROM "lesson_discussions" r WHERE r."parent_id" = "lesson_discussions"."id" AND r."deleted_at" IS NULL), "lesson_discussions"."created_at"))`
  );
  const where = { class_id: cls.id, parent_id: null, ...statusFilter(status), ...(lessonId ? { lesson_id: lessonId } : {}) };

  const [{ rows, count }, resolvedCount, openCount] = await Promise.all([
    LessonDiscussion.findAndCountAll({
      where,
      attributes: { include: [[lastActivity, 'last_activity_at']] },
      include: [authorInclude, { model: Lesson, as: 'lesson', attributes: ['id', 'title'] }],
      order: [[lastActivity, 'DESC'], ['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    }),
    LessonDiscussion.count({ where: { class_id: cls.id, parent_id: null, is_resolved: true } }),
    LessonDiscussion.count({ where: { class_id: cls.id, parent_id: null, is_resolved: false } })
  ]);

  const replies = rows.length === 0 ? [] : await LessonDiscussion.findAll({
    where: { parent_id: rows.map((r) => r.id) },
    include: [authorInclude],
    order: [['created_at', 'ASC']]
  });
  const repliesOf = groupReplies(replies);

  return {
    items: rows.map((d) => {
      const mine = repliesOf.get(d.id) || [];
      return {
        ...mapQuestion(d, mine, cls, access, user),
        lesson: d.lesson ? { id: d.lesson.id, title: d.lesson.title } : null,
        replyCount: mine.length,
        lastActivityAt: lastActivityOf(d.created_at, [d.getDataValue('last_activity_at')])
      };
    }),
    canPost: writeDenialOf({ access, classStatus: cls.status }) === null,
    summary: { open: openCount, resolved: resolvedCount, total: openCount + resolvedCount },
    meta: buildMeta(page, limit, count)
  };
};

// ==========================================
// 2. ĐĂNG / TRẢ LỜI
// ==========================================

/**
 * POST /classes/:classId/lessons/:lessonId/discussions
 */
export const createQuestion = async (classId, lessonId, data, user) => {
  const { cls, access } = await loadClassContext(classId, user);
  assertCanWrite(cls, access);
  const lesson = await findLessonInClass(cls, lessonId);

  const created = await LessonDiscussion.create({
    class_id: cls.id,
    lesson_id: lesson.id,
    author_id: user.id,
    parent_id: null,
    content: normalizeContent(data.content)
  });
  created.author = user;

  // Học viên hỏi -> báo giảng viên phụ trách (giảng viên tự đăng thì không báo)
  if (access.isActiveStudent) {
    await notifyDiscussionQuestion(cls, lesson, user, created.content);
  }
  return mapQuestion(created, [], cls, access, user);
};

/**
 * POST /discussions/:id/replies - :id là câu hỏi gốc
 */
export const createReply = async (id, data, user) => {
  const { discussion: root, cls, access } = await loadDiscussion(id, user);
  assertCanWrite(cls, access);
  if (root.parent_id) {
    throw new AppError('Chỉ có thể trả lời câu hỏi gốc, không trả lời lồng nhau', 400, 'Bad Request');
  }

  const created = await LessonDiscussion.create({
    class_id: root.class_id,
    lesson_id: root.lesson_id,
    author_id: user.id,
    parent_id: root.id,
    content: normalizeContent(data.content)
  });
  created.author = user;

  // Báo người đặt câu hỏi (trừ khi chính họ trả lời)
  if (root.author_id !== user.id) {
    const [lesson, recipient] = await Promise.all([
      Lesson.findByPk(root.lesson_id, { attributes: ['id', 'title'] }),
      User.findByPk(root.author_id, { attributes: ['id', 'role', 'full_name'] })
    ]);
    if (lesson && recipient) {
      // Lớp luôn học đúng một khóa học nên courseId lấy từ lớp
      await notifyDiscussionReply(cls, lesson, cls.course_id, user, recipient, created.content);
    }
  }
  return mapReply(created, cls, access, user);
};

// ==========================================
// 3. SỬA / XÓA / ĐÁNH DẤU
// ==========================================

/**
 * PATCH /discussions/:id - chỉ tác giả sửa bài của mình
 */
export const updateDiscussion = async (id, data, user) => {
  const { discussion, cls, access } = await loadDiscussion(id, user);
  if (discussion.author_id !== user.id) {
    throw new AppError('Bạn chỉ được sửa bài của chính mình', 403, 'Forbidden');
  }
  assertCanWrite(cls, access);

  await discussion.update({ content: normalizeContent(data.content), edited_at: new Date() });
  if (discussion.parent_id) {
    return mapReply(discussion, cls, access, user);
  }
  return mapQuestion(discussion, await loadReplies(discussion.id), cls, access, user);
};

/**
 * DELETE /discussions/:id - xóa mềm; xóa câu hỏi gốc thì xóa luôn các câu trả lời
 */
export const deleteDiscussion = async (id, user) => {
  const { discussion, cls, access } = await loadDiscussion(id, user);
  const perms = permissionsFor(discussion, cls, access, user);
  if (!perms.canDelete) {
    // Tác giả đúng vai trò nhưng lớp đang chỉ đọc -> 409; còn lại -> 403
    if (discussion.author_id === user.id && access.canWriteRole && !isClassOpen(cls.status)) {
      throw new AppError(CLOSED_MESSAGE, 409, 'Conflict');
    }
    throw new AppError('Bạn không có quyền xóa bài thảo luận này', 403, 'Forbidden');
  }

  const deleted = await sequelize.transaction(async (transaction) => {
    let total = 0;
    if (!discussion.parent_id) {
      total += Number(await LessonDiscussion.destroy({ where: { parent_id: discussion.id }, transaction })) || 0;
    }
    total += Number(await LessonDiscussion.destroy({ where: { id: discussion.id }, transaction })) || 0;
    return total;
  });
  return { deleted };
};

/**
 * PATCH /discussions/:id/resolve - chỉ câu hỏi gốc
 */
export const setResolved = async (id, isResolved, user) => {
  const { discussion, cls, access } = await loadDiscussion(id, user);
  if (discussion.parent_id) {
    throw new AppError('Chỉ đánh dấu "đã giải đáp" được cho câu hỏi gốc', 400, 'Bad Request');
  }
  const perms = permissionsFor(discussion, cls, access, user);
  if (!perms.canResolve) {
    if (discussion.author_id === user.id && access.canWriteRole && !isClassOpen(cls.status)) {
      throw new AppError(CLOSED_MESSAGE, 409, 'Conflict');
    }
    throw new AppError('Bạn không có quyền đánh dấu câu hỏi này', 403, 'Forbidden');
  }

  await discussion.update({ is_resolved: Boolean(isResolved) });
  return mapQuestion(discussion, await loadReplies(discussion.id), cls, access, user);
};

export default {
  listLessonDiscussions,
  listClassDiscussions,
  createQuestion,
  createReply,
  updateDiscussion,
  deleteDiscussion,
  setResolved
};
