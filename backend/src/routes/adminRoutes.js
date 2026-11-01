import { Router } from 'express';
import * as controller from '../controllers/auditController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateQuery } from '../middlewares/validateMiddleware.js';
import { queryAuditLogsSchema, exportAuditLogsSchema } from '../validations/auditValidation.js';

const router = Router();

// Router được mount tại /api/v1/admin (xem app.js). Toàn bộ chỉ dành cho Admin.
const adminOnly = [authenticateToken, authorizeRoles('admin')];

// Danh mục hành động + nhóm (để dựng bộ lọc) | Role: admin
router.get('/audit-logs/actions', ...adminOnly, controller.getActions);
// Xuất CSV theo bộ lọc, tối đa 5.000 dòng mới nhất; việc xuất cũng được ghi nhật ký | Role: admin
router.get('/audit-logs/export', ...adminOnly, validateQuery(exportAuditLogsSchema), controller.exportAuditLogs);
// Nhật ký hệ thống (phân trang, lọc theo hành động/nhóm/kết quả/thời gian/từ khóa) | Role: admin
router.get('/audit-logs', ...adminOnly, validateQuery(queryAuditLogsSchema), controller.getAuditLogs);
// Cấu hình nền tảng chỉ đọc (JWT, giới hạn tần suất, lưu trữ, email, AI) + tình trạng dịch vụ | Role: admin
router.get('/settings', ...adminOnly, controller.getSettings);

export default router;
