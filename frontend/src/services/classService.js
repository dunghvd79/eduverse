import api from './api';

export const CLASS_STATUS = {
  active: ['Đang hoạt động', 'green'],
  paused: ['Tạm dừng', 'orange'],
  closed: ['Đã kết thúc', 'gray']
};

export const PROGRESS_STATUS = {
  completed: ['Hoàn thành', 'green'],
  in_progress: ['Đang học', 'blue'],
  not_started: ['Chưa bắt đầu', 'gray']
};

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '—');

export const classService = {
  list: async (params = {}) => {
    const response = await api.get('/classes', { params });
    return response.data;
  },

  myClasses: async () => {
    const response = await api.get('/classes/my-classes');
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post('/classes', payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await api.patch(`/classes/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },

  regenerateCode: async (id, customCode) => {
    const response = await api.post(`/classes/${id}/regenerate-code`, customCode ? { customCode } : {});
    return response.data;
  },

  enroll: async (classCode) => {
    const response = await api.post('/classes/enroll', { classCode });
    return response.data;
  },

  members: async (id, params = {}) => {
    const response = await api.get(`/classes/${id}/members`, { params });
    return response.data;
  },

  addMember: async (id, email) => {
    const response = await api.post(`/classes/${id}/members`, { email });
    return response.data;
  },

  removeMember: async (id, studentId) => {
    const response = await api.delete(`/classes/${id}/members/${studentId}`);
    return response.data;
  },

  progress: async (id, params = {}) => {
    const response = await api.get(`/classes/${id}/progress`, { params });
    return response.data;
  }
};

export default classService;
