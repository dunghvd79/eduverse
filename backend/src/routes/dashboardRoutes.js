import { Router } from 'express';
import * as controller from '../controllers/dashboardController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

// Router được mount tại /api/v1/dashboard (xem app.js) - đặc tả: docs/api/api-dashboard.md
// Mỗi vai trò một endpoint; phạm vi dữ liệu lấy từ người đăng nhập nên không có tham số.

// Tổng quan học tập: lớp đang học, điểm TB, việc cần làm | Role: student
router.get('/student', authenticateToken, authorizeRoles('student'), controller.getStudentDashboard);
// Tổng quan giảng dạy: khóa học, lớp phụ trách, bài chờ chấm | Role: teacher
router.get('/teacher', authenticateToken, authorizeRoles('teacher'), controller.getTeacherDashboard);
// Tổng quan đào tạo: hàng đợi duyệt, lớp theo trạng thái | Role: training_manager
router.get('/manager', authenticateToken, authorizeRoles('training_manager'), controller.getManagerDashboard);
// Tổng quan hệ thống: người dùng, tình trạng dịch vụ | Role: admin
router.get('/admin', authenticateToken, authorizeRoles('admin'), controller.getAdminDashboard);

export default router;
