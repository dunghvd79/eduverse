import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { changePasswordLimiter } from '../middlewares/rateLimiter.js';
import { validateBody, validateQuery, validateIdParam } from '../middlewares/validateMiddleware.js';
import {
    updateMeSchema,
    changeMyPasswordSchema,
    adminCreateUserSchema,
    adminUpdateUserSchema,
    adminUpdateStatusSchema,
    queryUsersSchema
} from '../validations/userValidation.js';

const router = Router();

// Router được mount tại /api/v1/users (xem app.js).
// Thứ tự khai báo quan trọng: '/me' phải đứng trước '/:id', và '/:id/xxx' đứng trước '/:id',
// nếu không Express sẽ hiểu nhầm 'me' là một :id.

// ==========================================
// 1. HỒ SƠ CÁ NHÂN — mọi role đã đăng nhập
// ==========================================
// Lấy hồ sơ của chính mình | Role: student, teacher, training_manager, admin
router.get('/me', authenticateToken, userController.getMe);
// Cập nhật hồ sơ của chính mình (họ tên, SĐT, bio, avatar) | Role: mọi role
router.patch('/me', authenticateToken, validateBody(updateMeSchema), userController.updateMe);
// Tự đổi mật khẩu, thu hồi phiên ở thiết bị khác (limiter dùng chung với /auth/change-password) | Role: mọi role
router.patch('/me/password', authenticateToken, changePasswordLimiter, validateBody(changeMyPasswordSchema), userController.changePassword);

// ==========================================
// 2. HỒ SƠ CÔNG KHAI — mọi role đã đăng nhập
// ==========================================
// Xem hồ sơ công khai của người khác (VD: học viên xem giảng viên), ẩn thông tin nhạy cảm | Role: mọi role
router.get('/:id/profile', authenticateToken, validateIdParam(), userController.getPublicProfile);

// ==========================================
// 3. QUẢN TRỊ TÀI KHOẢN (RBAC) — chỉ Admin
// ==========================================
// Gom middleware vào một biến để route Admin mới không thể quên kiểm tra quyền
const adminOnly = [authenticateToken, authorizeRoles('admin')];

// Danh sách người dùng toàn trường (phân trang, tìm kiếm, lọc role/trạng thái) | Role: admin
router.get('/', ...adminOnly, validateQuery(queryUsersSchema), userController.getUsers);
// Tạo tài khoản teacher / training_manager / admin, sinh mật khẩu tạm | Role: admin
router.post('/', ...adminOnly, validateBody(adminCreateUserSchema), userController.createUser);
// Khóa / mở khóa tài khoản kèm lý do | Role: admin
router.patch('/:id/status', ...adminOnly, validateIdParam(), validateBody(adminUpdateStatusSchema), userController.updateStatus);
// Đặt lại mật khẩu khẩn cấp (sinh mật khẩu tạm, bắt đổi khi đăng nhập) | Role: admin
router.post('/:id/reset-password', ...adminOnly, validateIdParam(), userController.resetPassword);
// Xem chi tiết đầy đủ một tài khoản | Role: admin
router.get('/:id', ...adminOnly, validateIdParam(), userController.getUserById);
// Sửa thông tin và gán / đổi role cho tài khoản | Role: admin
router.patch('/:id', ...adminOnly, validateIdParam(), validateBody(adminUpdateUserSchema), userController.updateUser);
// Xóa mềm tài khoản (deleted_at = now()) | Role: admin
router.delete('/:id', ...adminOnly, validateIdParam(), userController.deleteUser);

export default router;
