import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { changePasswordLimiter } from '../middlewares/rateLimiter.js';
import {
  updateMeSchema,
  changeMyPasswordSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminUpdateStatusSchema,
  validate
} from '../validations/userValidation.js';

const router = Router();

// ==========================================
// 1. PERSONAL PROFILE (Mọi role đã đăng nhập)
// ==========================================
router.get('/me', authenticateToken, userController.getMe);
router.get('/me/profile', authenticateToken, userController.getMe); // Alias
router.patch('/me', authenticateToken, validate(updateMeSchema), userController.updateMe);
router.put('/me/profile', authenticateToken, validate(updateMeSchema), userController.updateMe); // Alias
// Dùng chung limiter với PATCH /auth/change-password (đếm gộp theo user)
router.patch('/me/password', authenticateToken, changePasswordLimiter, validate(changeMyPasswordSchema), userController.changePassword);

// ==========================================
// 2. ADMIN USER & RBAC MANAGEMENT (Chỉ role Admin)
// ==========================================
router.get('/', authenticateToken, authorizeRoles('admin'), userController.getUsers);
router.post('/', authenticateToken, authorizeRoles('admin'), validate(adminCreateUserSchema), userController.createUser);

// Dynamic sub-routes
router.get('/:id/profile', authenticateToken, userController.getPublicProfile);
router.patch('/:id/status', authenticateToken, authorizeRoles('admin'), validate(adminUpdateStatusSchema), userController.updateStatus);
router.post('/:id/reset-password', authenticateToken, authorizeRoles('admin'), userController.resetPassword);

// Dynamic generic /:id
router.get('/:id', authenticateToken, authorizeRoles('admin'), userController.getUserById);
router.patch('/:id', authenticateToken, authorizeRoles('admin'), validate(adminUpdateUserSchema), userController.updateUser);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), userController.deleteUser);

export default router;
