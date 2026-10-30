import api from './api';

// Đặc tả: docs/api/api-notifications.md - thông báo trong ứng dụng, mỗi người chỉ thấy thông báo của mình
export const notificationService = {
  // { items, unreadCount, meta } - mới nhất trước
  list: async ({ page = 1, limit = 15, unreadOnly = false } = {}) =>
    (await api.get('/notifications', { params: { page, limit, ...(unreadOnly ? { unreadOnly: true } : {}) } })).data,
  // { unreadCount } - nhẹ, dùng cho polling
  unreadCount: async () => (await api.get('/notifications/unread-count')).data,
  markRead: async (id) => (await api.patch(`/notifications/${id}/read`)).data,
  markAllRead: async () => (await api.patch('/notifications/read-all')).data
};

export default notificationService;
