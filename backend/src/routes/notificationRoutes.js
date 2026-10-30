import { Router } from 'express';
import * as controller from '../controllers/notificationController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validateQuery, validateIdParam } from '../middlewares/validateMiddleware.js';
import { queryNotificationsSchema } from '../validations/notificationValidation.js';

const router = Router();

// Router được mount tại /api/v1/notifications (xem app.js). Mọi role đã đăng nhập chỉ thấy thông báo của chính mình.
// '/unread-count' và '/read-all' khai báo trước '/:id/read' cho rõ ràng.
router.use(authenticateToken);

// Danh sách thông báo của tôi (mới nhất trước, kèm unreadCount) | Role: mọi role
router.get('/', validateQuery(queryNotificationsSchema), controller.getNotifications);
// Số thông báo chưa đọc (nhẹ, dùng để cập nhật chuông) | Role: mọi role
router.get('/unread-count', controller.getUnreadCount);
// Đánh dấu tất cả là đã đọc | Role: mọi role
router.patch('/read-all', controller.markAllAsRead);
// Đánh dấu một thông báo là đã đọc | Role: mọi role (chỉ thông báo của mình)
router.patch('/:id/read', validateIdParam(), controller.markAsRead);

export default router;
