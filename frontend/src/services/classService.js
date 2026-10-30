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

// "vừa xong", "5 phút trước", "3 ngày trước"...; từ `maxDays` ngày trở đi thì hiện ngày cụ thể (dùng chung với chuông thông báo)
export const formatRelativeTime = (value, { maxDays = 30 } = {}) => {
  if (!value) return '—';
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (!(minutes >= 1)) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return days < maxDays ? `${days} ngày trước` : formatDate(value);
};

// Trang học bài của học viên (trình phát bài học), classId để ghi tiến độ đúng lớp
export const learnUrl = (courseId, lessonId, classId) =>
  `/student/courses/${courseId}/learn/${lessonId}${classId ? `?classId=${classId}` : ''}`;

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
