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
  forgotPasswordLimiter 
} from '../middlewares/rateLimiter.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes
router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', resendOtpLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Authenticated routes
router.post('/logout', authenticateToken, authController.logout);
router.patch('/change-password', authenticateToken, validate(changePasswordSchema), authController.changePassword);
router.get('/me', authenticateToken, authController.getMe);

export default router;
