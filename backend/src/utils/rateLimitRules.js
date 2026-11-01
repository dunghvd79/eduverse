/**
 * Giới hạn tần suất của các API nhạy cảm — NGUỒN DUY NHẤT cho middlewares/rateLimiter.js
 * và trang Cài đặt hệ thống của Admin (GET /admin/settings), để số hiển thị luôn khớp với thực tế.
 *   windowMs: độ dài cửa sổ đếm; max: số lần tối đa trong cửa sổ; scope: tính theo email / IP / người dùng.
 */
export const RATE_LIMIT_RULES = {
  login: { label: 'Đăng nhập sai', scope: 'email', windowMs: 5 * 60 * 1000, max: 5 },
  register: { label: 'Đăng ký tài khoản', scope: 'ip', windowMs: 60 * 60 * 1000, max: 5 },
  resendOtp: { label: 'Gửi lại mã OTP', scope: 'email', windowMs: 60 * 60 * 1000, max: 3 },
  forgotPassword: { label: 'Quên mật khẩu', scope: 'email', windowMs: 60 * 60 * 1000, max: 3 },
  verifyOtp: { label: 'Nhập sai mã OTP', scope: 'email', windowMs: 15 * 60 * 1000, max: 5 },
  refreshToken: { label: 'Cấp lại Access Token', scope: 'ip', windowMs: 60 * 1000, max: 30 },
  resetPassword: { label: 'Đặt lại mật khẩu', scope: 'ip', windowMs: 15 * 60 * 1000, max: 5 },
  changePassword: { label: 'Đổi mật khẩu', scope: 'user', windowMs: 15 * 60 * 1000, max: 5 },
  ai: { label: 'AI sinh câu hỏi', scope: 'user', windowMs: 60 * 1000, max: 10 },
  discussion: { label: 'Đăng thảo luận / trả lời', scope: 'user', windowMs: 60 * 1000, max: 10 }
};
