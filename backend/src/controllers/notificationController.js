import * as notificationService from '../services/notificationService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/v1/notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getNotifications(req.query, req.user);
    return sendSuccess(res, 200, 'Lấy danh sách thông báo thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notifications/unread-count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const data = await notificationService.getUnreadCount(req.user);
    return sendSuccess(res, 200, 'Lấy số thông báo chưa đọc thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/notifications/read-all
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const data = await notificationService.markAllAsRead(req.user);
    return sendSuccess(res, 200, 'Đã đánh dấu tất cả thông báo là đã đọc', data);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/notifications/:id/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const data = await notificationService.markAsRead(req.params.id, req.user);
    return sendSuccess(res, 200, 'Đã đánh dấu thông báo là đã đọc', data);
  } catch (error) {
    next(error);
  }
};
