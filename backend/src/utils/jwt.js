import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'eduverse_jwt_super_secret_access_key_2026_!@#';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'eduverse_refresh_super_secret_refresh_key_2026_$%^';
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
 * Generate a random 6-digit OTP string
 */
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a cryptographically secure random token (e.g. for reset password)
 */
export const generateSecureRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};
