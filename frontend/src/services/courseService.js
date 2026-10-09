import api from './api';

export const courseService = {
  getCourses: async (params = {}) => {
    const res = await api.get('/courses', { params });
    return res.data || { items: [], meta: {} };
  },

  getMyCourses: async (params = {}) => {
    const res = await api.get('/courses', { params });
    return res.data || { items: [], meta: {} };
  },

  getCourseById: async (id) => {
    const res = await api.get(`/courses/${id}`);
    return res.data;
  },

  getCourseCurriculum: async (id, params = {}) => {
    const res = await api.get(`/courses/${id}/curriculum`, { params });
    return res.data;
  },

  markLessonProgress: async (classId, lessonId, isCompleted) => {
    const res = await api.post(`/classes/${classId}/lessons/${lessonId}/progress`, { isCompleted });
    return res.data;
  },

  createCourse: async (payload) => {
    const res = await api.post('/courses', payload);
    return res.data;
  },

  updateCourse: async (id, payload) => {
    const res = await api.patch(`/courses/${id}`, payload);
    return res.data;
  },

  publishCourse: async (id) => {
    const res = await api.post(`/courses/${id}/publish-request`);
    return res.data;
  },

  approveCourse: async (id) => {
    const res = await api.patch(`/courses/${id}/approve`);
    return res.data;
  },

  rejectCourse: async (id, reason) => {
    const res = await api.patch(`/courses/${id}/reject`, { reason });
    return res.data;
  },

  deleteCourse: async (id) => {
    const res = await api.delete(`/courses/${id}`);
    return res.data;
  },

  createChapter: async (courseId, payload) => {
    const res = await api.post(`/courses/${courseId}/chapters`, payload);
    return res.data;
  },

  updateChapter: async (id, payload) => {
    const res = await api.patch(`/chapters/${id}`, payload);
    return res.data;
  },

  reorderChapters: async (courseId, chapterIds) => {
    const res = await api.patch(`/courses/${courseId}/chapters/reorder`, { chapterIds });
    return res.data;
  },

  createLesson: async (chapterId, payload) => {
    const res = await api.post(`/chapters/${chapterId}/lessons`, payload);
    return res.data;
  },

  updateLesson: async (id, payload) => {
    const res = await api.patch(`/lessons/${id}`, payload);
    return res.data;
  },

  reorderLessons: async (chapterId, lessonIds) => {
    const res = await api.patch(`/chapters/${chapterId}/lessons/reorder`, { lessonIds });
    return res.data;
  },

  deleteLesson: async (id) => {
    const res = await api.delete(`/lessons/${id}`);
    return res.data;
  }
};

export default courseService;
