import api from './api';

export const QUESTION_TYPE = {
  single_choice: 'Một đáp án',
  multiple_choice: 'Nhiều đáp án',
  true_false: 'Đúng / Sai'
};

export const ATTEMPT_STATUS = {
  completed: ['Đã nộp', 'green'],
  timed_out: ['Hết giờ', 'orange'],
  in_progress: ['Đang làm', 'blue']
};

export const DIFFICULTY = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };

export const formatScore = (score) => (score === null || score === undefined ? '—' : Number(score).toFixed(2).replace(/\.?0+$/, ''));
export const formatDateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

export const quizService = {
  // Đề thi
  list: async (params = {}) => (await api.get('/quizzes', { params })).data,
  get: async (id, classId) => (await api.get(`/quizzes/${id}`, { params: classId ? { classId } : undefined })).data,
  create: async (payload) => (await api.post('/quizzes', payload)).data,
  update: async (id, payload) => (await api.patch(`/quizzes/${id}`, payload)).data,
  remove: async (id) => (await api.delete(`/quizzes/${id}`)).data,

  // Câu hỏi
  questions: async (quizId) => (await api.get(`/quizzes/${quizId}/questions`)).data,
  createQuestion: async (quizId, payload) => (await api.post(`/quizzes/${quizId}/questions`, payload)).data,
  bulkCreate: async (quizId, questions) => (await api.post(`/quizzes/${quizId}/questions/bulk`, { questions })).data,
  reorder: async (quizId, orders) => (await api.patch(`/quizzes/${quizId}/questions/reorder`, { orders })).data,
  setCommonPoints: async (quizId, questionIds, commonPoints) =>
    (await api.patch(`/quizzes/${quizId}/questions/bulk`, { mode: 'common_points', questionIds, commonPoints })).data,
  bulkDelete: async (quizId, questionIds) => (await api.delete(`/quizzes/${quizId}/questions/bulk`, { data: { questionIds } })).data,
  updateQuestion: async (id, payload) => (await api.patch(`/questions/${id}`, payload)).data,
  deleteQuestion: async (id) => (await api.delete(`/questions/${id}`)).data,

  // Làm bài & kết quả
  start: async (quizId, classId) => (await api.post(`/quizzes/${quizId}/attempts`, {}, { params: classId ? { classId } : undefined })).data,
  submit: async (attemptId, answers) => (await api.post(`/quiz-attempts/${attemptId}/submit`, { answers })).data,
  attempt: async (attemptId) => (await api.get(`/quiz-attempts/${attemptId}`)).data,
  myAttempts: async (quizId, params = {}) => (await api.get(`/quizzes/${quizId}/my-attempts`, { params })).data,
  attempts: async (quizId, params = {}) => (await api.get(`/quizzes/${quizId}/attempts`, { params })).data,

  // Đề thi theo lớp
  classQuizzes: async (classId) => (await api.get(`/classes/${classId}/quizzes`)).data,
  updateClassQuiz: async (classId, quizId, payload) => (await api.put(`/classes/${classId}/quizzes/${quizId}`, payload)).data,

  // Gemini AI
  generate: async (payload) => (await api.post('/ai/generate-questions', payload)).data,
  regenerate: async (payload) => (await api.post('/ai/regenerate-single', payload)).data
};

export default quizService;
