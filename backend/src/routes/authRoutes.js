import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateBody } from '../middlewares/validateMiddleware.js';
import {
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
router.post('/register', registerLimiter, validateBody(registerSchema), authController.register);
router.post('/verify-otp', verifyOtpLimiter, validateBody(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', resendOtpLimiter, validateBody(resendOtpSchema), authController.resendOtp);
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh-token', refreshTokenLimiter, validateBody(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', forgotPasswordLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
// Logout xác định phiên qua Refresh Token cookie, không cần Access Token còn hạn
router.post('/logout', authController.logout);

// Authenticated routes
router.patch('/change-password', authenticateToken, changePasswordLimiter, validateBody(changePasswordSchema), authController.changePassword);
router.get('/me', authenticateToken, authController.getMe);

export default router;
