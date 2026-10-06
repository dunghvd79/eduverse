import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { sendError } from '../utils/response.js';

/**
 * Standard handler when rate limit is exceeded
 */
const createRateLimitHandler = (message) => (req, res) => {
  return sendError(res, 429, 'Too Many Requests', message);
};

// 1. Login Limiter: Max 5 failed attempts per 5 minutes per email/IP
// Chỉ tính các lần đăng nhập THẤT BẠI (skipSuccessfulRequests: true) để không chặn người dùng đăng nhập đúng
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `login:${email}` : ipKeyGenerator(req.ip);
  },
  handler: createRateLimitHandler('Bạn đã nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau 5 phút.')
});

// 2. Register Limiter: Max 5 registrations per 1 hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Bạn đã tạo quá nhiều tài khoản trong thời gian ngắn. Vui lòng thử lại sau 1 giờ.')
});

// 3. Resend OTP Limiter: Max 3 requests per 1 hour per email
export const resendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `resend-otp:${email}` : ipKeyGenerator(req.ip);
  },
  handler: createRateLimitHandler('Vượt quá giới hạn gửi lại mã OTP cho email này (tối đa 3 lần/giờ). Vui lòng thử lại sau.')
});

// 4. Forgot Password Limiter: Max 3 requests per 1 hour per email
// Tính theo Email để chống spam ngập hòm thư nạn nhân và không làm ảnh hưởng người chung Wi-Fi
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `forgot:${email}` : ipKeyGenerator(req.ip);
  },
  handler: createRateLimitHandler('Vượt quá giới hạn yêu cầu đặt lại mật khẩu cho email này (tối đa 3 lần/giờ). Vui lòng thử lại sau 1 giờ.')
});

// 5. Verify OTP Limiter: Max 5 wrong attempts per 15 minutes per email
// Tính theo email (không theo IP) để chặn dò OTP của một tài khoản dù đổi IP liên tục
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `otp:${email}` : ipKeyGenerator(req.ip);
  },
  handler: createRateLimitHandler('Bạn đã nhập sai mã OTP quá nhiều lần. Vui lòng thử lại sau 15 phút hoặc yêu cầu gửi lại mã mới.')
});

// 6. Refresh Token Limiter: Max 30 attempts per 1 minute per IP (chống spam / infinite loop)
export const refreshTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Yêu cầu cấp lại token quá thường xuyên. Vui lòng thử lại sau 1 phút.')
});
