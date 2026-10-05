import '../config/env.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Không có giá trị dự phòng: env.js đã dừng server nếu thiếu secret
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Sign 15-minute Access Token
 */
export const signAccessToken = (payload) => {
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Sign 7-day Refresh Token
 */
export const signRefreshToken = (payload) => {
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

/**
 * Compute SHA-256 hash of a string (token, OTP)
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

/**
 * Compute hash of an OTP bound to its owner.
 * OTP chỉ có 900.000 giá trị nên phải gắn user_id để hai người nhận cùng mã
 * không sinh ra cùng token_hash (cột token_hash là UNIQUE).
 */
export const hashOtp = (userId, otp) => {
  return hashToken(`${userId}:${otp}`);
};

/**
 * Generate a cryptographically secure 6-digit OTP string
 */
export const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Generate a cryptographically secure random token (e.g. for reset password)
 */
export const generateSecureRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};
