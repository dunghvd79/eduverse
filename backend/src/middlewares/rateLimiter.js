import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

/**
 * Standard handler when rate limit is exceeded
 */
const createRateLimitHandler = (message) => (req, res) => {
  return sendError(res, 429, 'Too Many Requests', message);
};

// 1. Login Limiter: Max 5 attempts per 5 minutes
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 5 phút.')
});

// 2. Register Limiter: Max 5 registrations per 1 hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Bạn đã tạo quá nhiều tài khoản trong thời gian ngắn. Vui lòng thử lại sau 1 giờ.')
});

// 3. Resend OTP Limiter: Max 3 requests per 1 hour
export const resendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Vượt quá giới hạn gửi lại mã OTP (tối đa 3 lần/giờ). Vui lòng thử lại sau.')
});

// 4. Forgot Password Limiter: Max 3 requests per 1 hour
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Vượt quá giới hạn yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ.')
});
