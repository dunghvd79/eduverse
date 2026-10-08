import { create } from 'zustand';
import axios from 'axios';

// Backend xoay vòng Refresh Token: mỗi token chỉ dùng được 1 lần.
// Gộp các lần gọi refresh đồng thời thành 1 request (StrictMode, nhiều request cùng 401).
let refreshPromise = null;
let initPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestRefresh = () =>
  axios.post('/api/v1/auth/refresh-token', {}, { withCredentials: true })
    .then((res) => res.data?.data?.accessToken);

/**
 * Lấy Access Token mới. Nếu thất bại sẽ thử lại 1 lần sau 500ms, vì tab khác
 * có thể vừa xoay vòng token và trình duyệt chưa kịp nhận cookie mới.
 */
export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = requestRefresh()
      .catch(async () => {
        await sleep(500);
        return requestRefresh();
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

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

  // Khôi phục phiên đăng nhập khi tải lại trang (chỉ chạy 1 lần)
  initializeAuth: () => {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          const newAccessToken = await refreshAccessToken();
          if (newAccessToken) {
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
        // Không ghi đè nếu người dùng vừa đăng nhập trong lúc đang khôi phục phiên
        set((state) => (state.isAuthenticated
          ? { isInitializing: false }
          : { user: null, accessToken: null, isAuthenticated: false, isInitializing: false }));
      })();
    }
    return initPromise;
  }
}));

export default useAuthStore;
