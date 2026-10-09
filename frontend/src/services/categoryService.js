import api from './api';

export const categoryService = {
  getCategories: async (params = {}) => {
    const response = await api.get('/categories', { params });
    return response.data || [];
  },

  createCategory: async (payload) => {
    const response = await api.post('/categories', payload);
    return response.data;
  },

  updateCategory: async (id, payload) => {
    const response = await api.patch(`/categories/${id}`, payload);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
};
