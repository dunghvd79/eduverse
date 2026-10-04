import { create } from 'zustand';
import axios from 'axios';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,

  setAuth: (user, token) => set({
    user,
    accessToken: token,
    isAuthenticated: true,
    isInitializing: false
  }),

  setAccessToken: (token) => set({
    accessToken: token,
    isAuthenticated: true
  }),

  updateUser: (partialUser) => set((state) => ({
    user: state.user ? { ...state.user, ...partialUser } : null
  })),

  logout: async () => {
    try {
      await axios.post('/api/v1/auth/logout', {}, { withCredentials: true });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isInitializing: false
      });
    }
  },

  initializeAuth: async () => {
    try {
      const res = await axios.post('/api/v1/auth/refresh-token', {}, { withCredentials: true });
      const newAccessToken = res.data?.data?.accessToken;
      if (newAccessToken) {
        // Fetch current user claims with the new token
        const meRes = await axios.get('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${newAccessToken}` },
          withCredentials: true
        });
        set({
          user: meRes.data?.data,
          accessToken: newAccessToken,
          isAuthenticated: true,
          isInitializing: false
        });
        return;
      }
    } catch {
      // Session expired or no cookie present
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitializing: false
    });
  }
}));

export default useAuthStore;
