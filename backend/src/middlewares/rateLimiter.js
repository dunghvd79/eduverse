import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { sendError } from '../utils/response.js';

// ==========================================
// Reusable DRY Helpers
// ==========================================

/**
 * Key generator theo Email (fallback về IP nếu không có email)
 */
const emailKeyGenerator = (prefix) => (req) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return email ? `${prefix}:${email}` : ipKeyGenerator(req.ip);
};

/**
 * Key generator theo User ID (dành cho authenticated routes, fallback về IP)
 */
const userKeyGenerator = (prefix) => (req) => {
  return req.user?.id ? `${prefix}:${req.user.id}` : ipKeyGenerator(req.ip);
};

/**
 * Danh sách giới hạn đang áp dụng (một nguồn duy nhất), hiển thị ở trang Cài đặt hệ thống của Admin.
 * label: hành động bị giới hạn; scope: tính theo 'email' | 'user' | 'ip'.
 */
export const RATE_LIMIT_RULES = [];

/**
 * Factory function tạo limiter chuẩn hóa (DRY)
 */
const createLimiter = ({ windowMs, max, message, label, scope, ...extraOptions }) => {
  RATE_LIMIT_RULES.push({ label, scope, max, windowMinutes: windowMs / 60000 });
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => sendError(res, 429, 'Too Many Requests', message),
    ...extraOptions
  });
};

// ==========================================
// Rate Limiters
// ==========================================

// 1. Login: Max 5 failed attempts per 5 minutes per email/IP
export const loginLimiter = createLimiter({
  label: 'Đăng nhập sai',
  scope: 'email',
  windowMs: 5 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: emailKeyGenerator('login'),
  message: 'Bạn đã nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau 5 phút.'
});

// 2. Register: Max 5 registrations per 1 hour per IP
export const registerLimiter = createLimiter({
  label: 'Đăng ký tài khoản',
  scope: 'ip',
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Bạn đã tạo quá nhiều tài khoản trong thời gian ngắn. Vui lòng thử lại sau 1 giờ.'
});

// 3. Resend OTP: Max 3 requests per 1 hour per email
export const resendOtpLimiter = createLimiter({
  label: 'Gửi lại mã OTP',
  scope: 'email',
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: emailKeyGenerator('resend-otp'),
  message: 'Vượt quá giới hạn gửi lại mã OTP cho email này (tối đa 3 lần/giờ). Vui lòng thử lại sau.'
});

// 4. Forgot Password: Max 3 requests per 1 hour per email
export const forgotPasswordLimiter = createLimiter({
  label: 'Yêu cầu đặt lại mật khẩu',
  scope: 'email',
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: emailKeyGenerator('forgot'),
  message: 'Vượt quá giới hạn yêu cầu đặt lại mật khẩu cho email này (tối đa 3 lần/giờ). Vui lòng thử lại sau 1 giờ.'
});

// 5. Verify OTP: Max 5 wrong attempts per 15 minutes per email
export const verifyOtpLimiter = createLimiter({
  label: 'Nhập sai mã OTP',
  scope: 'email',
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: emailKeyGenerator('otp'),
  message: 'Bạn đã nhập sai mã OTP quá nhiều lần. Vui lòng thử lại sau 15 phút hoặc yêu cầu gửi lại mã mới.'
});

// 6. Refresh Token: Max 30 attempts per 1 minute per IP
export const refreshTokenLimiter = createLimiter({
  label: 'Cấp lại phiên đăng nhập (refresh token)',
  scope: 'ip',
  windowMs: 60 * 1000,
  max: 30,
  message: 'Yêu cầu cấp lại token quá thường xuyên. Vui lòng thử lại sau 1 phút.'
});

// 7. Reset Password: Max 5 attempts per 15 minutes per IP
export const resetPasswordLimiter = createLimiter({
  label: 'Đặt lại mật khẩu',
  scope: 'ip',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Bạn đã thử đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.'
});

// 8. Change Password: Max 5 attempts per 15 minutes per user/IP
export const changePasswordLimiter = createLimiter({
  label: 'Đổi mật khẩu',
  scope: 'user',
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: userKeyGenerator('change-pwd'),
  message: 'Bạn đã thử đổi mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.'
});

// 9. AI sinh câu hỏi (Gemini): Max 10 requests per 1 minute per user - bảo vệ quota API key
export const aiLimiter = createLimiter({
  label: 'Sinh câu hỏi bằng AI',
  scope: 'user',
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: userKeyGenerator('ai'),
  message: 'Vượt quá giới hạn gọi AI (tối đa 10 lần/phút). Vui lòng thử lại sau ít phút.'
});

// 10. Thảo luận / hỏi đáp: Max 10 bài đăng hoặc trả lời mỗi phút mỗi người dùng - chống spam (docs/api/api-discussions.md)
export const discussionLimiter = createLimiter({
  label: 'Đăng bài thảo luận',
  scope: 'user',
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: userKeyGenerator('discussion'),
  message: 'Bạn thao tác quá nhanh (tối đa 10 bài mỗi phút). Vui lòng thử lại sau ít phút.'
});
