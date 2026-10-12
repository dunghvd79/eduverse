import api from './api';

export const categoryService = {
  // includeHidden chỉ có tác dụng với Quản lý đào tạo / Admin
  list: async ({ includeHidden = false } = {}) => {
    const response = await api.get('/categories', { params: includeHidden ? { includeHidden: true } : undefined });
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post('/categories', payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await api.patch(`/categories/${id}`, payload);
    return response.data;
  },

  reorder: async (categoryIds) => {
    const response = await api.patch('/categories/reorder', { categoryIds });
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
};

export default categoryService;
