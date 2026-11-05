import { Router } from 'express';
import * as controller from '../controllers/auditLogController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateQuery } from '../middlewares/validateMiddleware.js';
import { queryAuditLogsSchema, exportAuditLogsSchema } from '../validations/auditLogValidation.js';

const router = Router();

// Router được mount tại /api/v1/audit-logs (xem app.js). Chỉ Admin; nhật ký chỉ đọc, không có API sửa/xóa (UC-ADMIN-005).
router.use(authenticateToken, authorizeRoles('admin'));

// Xuất CSV theo bộ lọc (UC-ADMIN-006) — khai báo trước '/' cho rõ ràng
router.get('/export', validateQuery(exportAuditLogsSchema), controller.exportAuditLogs);
// Danh sách nhật ký, mới nhất trước, kèm số liệu 24 giờ qua
router.get('/', validateQuery(queryAuditLogsSchema), controller.getAuditLogs);

export default router;
