import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';

const { Notification, Enrollment, User, Assignment } = models;

/**
 * Thông báo trong ứng dụng (docs/api/api-notifications.md).
 *
 * Các hàm `notify*` là phần phụ của nghiệp vụ chính (giao bài, chấm điểm, duyệt khóa học...):
 * KHÔNG BAO GIỜ ném lỗi, chỉ ghi log cảnh báo. Nhờ vậy dù bảng `notifications` chưa được tạo
 * (chưa chạy migration) hay CSDL lỗi thoáng qua, thao tác chính của giảng viên/quản lý vẫn thành công.
 */

const clip = (text, max) => (text && text.length > max ? `${text.slice(0, max - 1)}…` : text);

const formatDateTime = (value) =>
  new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
  });

const toDto = (notification) => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  link: notification.link,
  isRead: notification.is_read,
  readAt: notification.read_at,
  createdAt: notification.created_at
});

// ==========================================
// 1. TẠO THÔNG BÁO (gọi từ các service khác)
// ==========================================

/**
 * Tạo cùng một thông báo cho nhiều người dùng (trùng id chỉ tạo một lần).
 */
export const notifyUsers = async (userIds, { type, title, message, link = null }) => {
  try {
    const ids = [...new Set((userIds || []).filter(Boolean))];
    if (ids.length === 0) return 0;
    await Notification.bulkCreate(ids.map((userId) => ({
      user_id: userId,
      type,
      title: clip(title, 255),
      message,
      link: clip(link, 500)
    })));
    return ids.length;
  } catch (error) {
    console.warn('⚠️ Không tạo được thông báo:', error.message);
    return 0;
  }
};

/**
 * Thông báo cho học viên đang học trong lớp.
 */
export const notifyClassStudents = async (classId, payload) => {
  try {
    const enrollments = await Enrollment.findAll({ where: { class_id: classId, status: 'active' }, attributes: ['student_id'] });
    return await notifyUsers(enrollments.map((e) => e.student_id), payload);
  } catch (error) {
    console.warn('⚠️ Không tạo được thông báo cho lớp:', error.message);
    return 0;
  }
};

/**
 * Thông báo cho mọi Quản lý đào tạo đang hoạt động.
 */
export const notifyManagers = async (payload) => {
  try {
    const managers = await User.findAll({ where: { role: 'training_manager', is_active: true }, attributes: ['id'] });
    return await notifyUsers(managers.map((m) => m.id), payload);
  } catch (error) {
    console.warn('⚠️ Không tạo được thông báo cho Quản lý đào tạo:', error.message);
    return 0;
  }
};

/**
 * Giảng viên giao bài tập lần đầu cho lớp -> thông báo cho học viên trong lớp.
 */
export const notifyAssignmentScheduled = async (cls, assignment, deadline) => {
  try {
    return await notifyClassStudents(cls.id, {
      type: 'assignment_assigned',
      title: `Bài tập mới: ${assignment.title}`,
      message: `Lớp "${cls.name}" vừa được giao bài tập "${assignment.title}". Hạn nộp: ${formatDateTime(deadline)}.`,
      link: `/student/classes/${cls.id}/assignments/${assignment.id}`
    });
  } catch (error) {
    console.warn('⚠️ Không tạo được thông báo giao bài:', error.message);
    return 0;
  }
};

/**
 * Báo cho học viên biết bài nộp của mình đã được chấm (kind = 'graded') hoặc bị yêu cầu nộp lại (kind = 'resubmission').
 * `submissions` là bản ghi AssignmentSubmission đã nạp kèm class_assignment (một hoặc nhiều).
 */
export const notifySubmissionResult = async (submissions, kind, reason = null) => {
  try {
    const items = Array.isArray(submissions) ? submissions : [submissions];
    if (items.length === 0) return 0;

    const assignments = await Assignment.findAll({
      where: { id: [...new Set(items.map((s) => s.class_assignment.assignment_id))] },
      attributes: ['id', 'title'],
      paranoid: false
    });
    const titleOf = Object.fromEntries(assignments.map((a) => [a.id, a.title]));

    const rows = items.map((s) => {
      const { class_id: classId, assignment_id: assignmentId } = s.class_assignment;
      const title = titleOf[assignmentId] || 'bài tập';
      const link = `/student/classes/${classId}/assignments/${assignmentId}`;
      if (kind === 'graded') {
        return {
          user_id: s.student_id,
          type: 'assignment_graded',
          title: 'Bài tập đã được chấm điểm',
          message: `Giảng viên đã chấm bài "${title}" của bạn: ${Number(s.grade)}/10.`,
          link
        };
      }
      return {
        user_id: s.student_id,
        type: 'assignment_resubmission',
        title: 'Yêu cầu nộp lại bài tập',
        message: `Giảng viên yêu cầu bạn nộp lại bài "${title}".${reason ? ` Lý do: ${reason}` : ''}`,
        link
      };
    });
    await Notification.bulkCreate(rows.map((row) => ({ ...row, title: clip(row.title, 255), link: clip(row.link, 500) })));
    return rows.length;
  } catch (error) {
    console.warn('⚠️ Không tạo được thông báo bài nộp:', error.message);
    return 0;
  }
};

// ==========================================
// 2. API CHO NGƯỜI DÙNG (GET/PATCH /notifications)
// ==========================================

/**
 * GET /notifications - thông báo của chính người dùng, mới nhất trước
 */
export const getNotifications = async (query, user) => {
  const { page = 1, limit = 20, unreadOnly = false } = query;
  const where = { user_id: user.id, ...(unreadOnly ? { is_read: false } : {}) };

  const { rows, count } = await Notification.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });
  const unreadCount = await Notification.count({ where: { user_id: user.id, is_read: false } });
  const totalPages = Math.ceil(count / limit) || 1;

  return {
    items: rows.map(toDto),
    unreadCount,
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
 * GET /notifications/unread-count
 */
export const getUnreadCount = async (user) => ({
  unreadCount: await Notification.count({ where: { user_id: user.id, is_read: false } })
});

/**
 * PATCH /notifications/:id/read - chỉ đổi được thông báo của chính mình (của người khác trả 404)
 */
export const markAsRead = async (id, user) => {
  const notification = await Notification.findOne({ where: { id, user_id: user.id } });
  if (!notification) {
    throw new AppError('Không tìm thấy thông báo', 404, 'Not Found');
  }
  if (!notification.is_read) {
    await notification.update({ is_read: true, read_at: new Date() });
  }
  return toDto(notification);
};

/**
 * PATCH /notifications/read-all
 */
export const markAllAsRead = async (user) => {
  const [updated] = await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { user_id: user.id, is_read: false } }
  );
  return { updated };
};

export default {
  notifyUsers,
  notifyClassStudents,
  notifyManagers,
  notifyAssignmentScheduled,
  notifySubmissionResult,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
