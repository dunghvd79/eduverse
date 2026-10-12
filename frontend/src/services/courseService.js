import api from './api';

export const courseService = {
  list: async (params = {}) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  curriculum: async (id, classId) => {
    const response = await api.get(`/courses/${id}/curriculum`, {
      params: classId ? { classId } : undefined
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post('/courses', payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await api.patch(`/courses/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  requestApproval: async (id) => {
    const response = await api.post(`/courses/${id}/publish-request`);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.patch(`/courses/${id}/approve`);
    return response.data;
  },

  reject: async (id, reason) => {
    const response = await api.patch(`/courses/${id}/reject`, { reason });
    return response.data;
  },

  chapters: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/chapters`);
    return response.data;
  },

  createChapter: async (courseId, payload) => {
    const response = await api.post(`/courses/${courseId}/chapters`, payload);
    return response.data;
  },

  updateChapter: async (id, payload) => {
    const response = await api.patch(`/chapters/${id}`, payload);
    return response.data;
  },

  deleteChapter: async (id) => {
    const response = await api.delete(`/chapters/${id}`);
    return response.data;
  },

  reorderChapters: async (courseId, chapterIds) => {
    const response = await api.patch(`/courses/${courseId}/chapters/reorder`, { chapterIds });
    return response.data;
  },

  lessons: async (chapterId) => {
    const response = await api.get(`/chapters/${chapterId}/lessons`);
    return response.data;
  },

  getLesson: async (id) => {
    const response = await api.get(`/lessons/${id}`);
    return response.data;
  },

  createLesson: async (chapterId, payload) => {
    const response = await api.post(`/chapters/${chapterId}/lessons`, payload);
    return response.data;
  },

  updateLesson: async (id, payload) => {
    const response = await api.patch(`/lessons/${id}`, payload);
    return response.data;
  },

  deleteLesson: async (id) => {
    const response = await api.delete(`/lessons/${id}`);
    return response.data;
  },

  reorderLessons: async (chapterId, lessonIds) => {
    const response = await api.patch(`/chapters/${chapterId}/lessons/reorder`, { lessonIds });
    return response.data;
  },

  updateProgress: async (classId, lessonId, isCompleted) => {
    const response = await api.post(
      `/classes/${classId}/lessons/${lessonId}/progress`,
      { isCompleted }
    );
    return response.data;
  }
};

export default courseService;
