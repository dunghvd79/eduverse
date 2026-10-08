import api from './api';

export const userService = {
  // 1. Personal Profile
  getMe: async () => {
    const res = await api.get('/users/me');
    return res.data;
  },

  updateMe: async (data) => {
    const res = await api.patch('/users/me', data);
    return res.data;
  },

  changePassword: async (data) => {
    const res = await api.patch('/users/me/password', data);
    return res.data;
  },

  getPublicProfile: async (id) => {
    const res = await api.get(`/users/${id}/profile`);
    return res.data;
  },

  // 2. Admin User & RBAC Management
  getAdminUsers: async (params = {}) => {
    const res = await api.get('/users', { params });
    return res.data; // { items, meta }
  },

  getUserById: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  adminCreateUser: async (data) => {
    const res = await api.post('/users', data);
    return res.data;
  },

  adminUpdateUser: async (id, data) => {
    const res = await api.patch(`/users/${id}`, data);
    return res.data;
  },

  adminUpdateStatus: async (id, { isActive, reason }) => {
    const res = await api.patch(`/users/${id}/status`, { isActive, reason });
    return res.data;
  },

  adminResetPassword: async (id) => {
    const res = await api.post(`/users/${id}/reset-password`);
    return res.data;
  },

  adminDeleteUser: async (id) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  }
};

export default userService;
