import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import {
  validate,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
} from '../validations/authValidation.js';
import {
  loginLimiter,
  registerLimiter,
  resendOtpLimiter,
  forgotPasswordLimiter,
  verifyOtpLimiter,
  refreshTokenLimiter,
  resetPasswordLimiter,
  changePasswordLimiter
} from '../middlewares/rateLimiter.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes
router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/verify-otp', verifyOtpLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', resendOtpLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', refreshTokenLimiter, validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), authController.resetPassword);
// Logout xác định phiên qua Refresh Token cookie, không cần Access Token còn hạn
router.post('/logout', authController.logout);

// Authenticated routes
router.patch('/change-password', authenticateToken, changePasswordLimiter, validate(changePasswordSchema), authController.changePassword);
router.get('/me', authenticateToken, authController.getMe);

export default router;
