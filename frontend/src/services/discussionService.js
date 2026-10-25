import api from './api';

// Đặc tả: docs/api/api-discussions.md - thảo luận / hỏi đáp trong bài học (theo lớp + bài học)
export const MAX_CONTENT_LENGTH = 2000;

export const discussionService = {
  // { items[{..., replies[]}], canPost, totalReplies, meta } - câu hỏi mới nhất trước
  listByLesson: async (classId, lessonId, params = {}) =>
    (await api.get(`/classes/${classId}/lessons/${lessonId}/discussions`, { params })).data,
  ask: async (classId, lessonId, content) =>
    (await api.post(`/classes/${classId}/lessons/${lessonId}/discussions`, { content })).data,
  reply: async (id, content) => (await api.post(`/discussions/${id}/replies`, { content })).data,
  edit: async (id, content) => (await api.patch(`/discussions/${id}`, { content })).data,
  remove: async (id) => (await api.delete(`/discussions/${id}`)).data,
  resolve: async (id, isResolved) => (await api.patch(`/discussions/${id}/resolve`, { isResolved })).data,
  // Tổng quan cả lớp (giảng viên phụ trách / manager / admin): { items, canPost, summary{open,resolved,total}, meta }
  listByClass: async (classId, params = {}) => (await api.get(`/classes/${classId}/discussions`, { params })).data
};

export default discussionService;
