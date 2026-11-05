import { Router } from 'express';
import * as controller from '../controllers/settingsController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../middlewares/validateMiddleware.js';
import { updateSettingsSchema } from '../validations/settingsValidation.js';

const router = Router();

// Router được mount tại /api/v1/settings (xem app.js). Khóa bí mật và cấu hình hạ tầng không có ở đây (biến môi trường).

// Cài đặt công khai: trạng thái mở đăng ký + thông báo toàn hệ thống | Không cần đăng nhập
router.get('/public', controller.getPublicSettings);
// Tình trạng hệ thống, chính sách vận hành (chỉ xem) và cài đặt sửa được | Role: admin
router.get('/', authenticateToken, authorizeRoles('admin'), controller.getSettings);
// Đổi cài đặt (ghi nhật ký SETTING_CHANGED) | Role: admin
router.patch('/', authenticateToken, authorizeRoles('admin'), validateBody(updateSettingsSchema), controller.updateSettings);

export default router;
