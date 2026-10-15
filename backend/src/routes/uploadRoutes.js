import { Router } from 'express';
import * as controller from '../controllers/uploadController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateBody, validateIdParam } from '../middlewares/validateMiddleware.js';
import { presignedUrlSchema, createMaterialSchema, updateMaterialSchema } from '../validations/uploadValidation.js';

const router = Router();

// Router được mount tại /api/v1 (xem app.js) - đặc tả: docs/api/api-uploads.md
// Thứ tự middleware: xác thực -> phân quyền -> params -> query/body -> controller.

const teacherOrAdmin = [authenticateToken, authorizeRoles('teacher', 'admin')];

// ==========================================
// 1. PRESIGNED UPLOAD (AWS S3)
// ==========================================
// Xin Presigned PUT URL (avatar | course_thumbnail | lesson_material), quyền chi tiết kiểm tra theo purpose | Role: mọi role đã đăng nhập
router.post('/uploads/presigned-url', authenticateToken, validateBody(presignedUrlSchema), controller.createPresignedUrl);

// ==========================================
// 2. TÀI LIỆU BÀI HỌC (LESSON MATERIALS)
// ==========================================
// Danh sách tài liệu của bài học | Role: chủ khóa, manager, admin, GV dạy lớp, học viên đã ghi danh
router.get('/lessons/:lessonId/materials', authenticateToken, validateIdParam('lessonId'), controller.getMaterials);
// Gắn tệp đã upload S3 vào bài học (chỉ khi draft/rejected) | Role: chủ khóa (teacher), admin
router.post('/lessons/:lessonId/materials', ...teacherOrAdmin, validateIdParam('lessonId'), validateBody(createMaterialSchema), controller.createMaterial);
// Đổi tiêu đề tài liệu (chỉ khi draft/rejected) | Role: chủ khóa (teacher), admin
router.patch('/lessons/:lessonId/materials/:materialId', ...teacherOrAdmin, validateIdParam('lessonId', 'materialId'), validateBody(updateMaterialSchema), controller.updateMaterial);
// Xóa tài liệu và tệp S3 (chỉ khi draft/rejected) | Role: chủ khóa (teacher), admin
router.delete('/lessons/:lessonId/materials/:materialId', ...teacherOrAdmin, validateIdParam('lessonId', 'materialId'), controller.deleteMaterial);
// Presigned GET URL tải tài liệu (30 phút) | Role: như danh sách tài liệu
router.get('/lessons/:lessonId/materials/:materialId/download-url', authenticateToken, validateIdParam('lessonId', 'materialId'), controller.getDownloadUrl);

// ==========================================
// 3. LOCAL STORAGE FALLBACK ENDPOINTS
// ==========================================
// Nhận file tải lên bằng method PUT (tương thích hoàn toàn với luồng S3 của client)
router.put('/uploads/local-put', controller.handleLocalPut);
// Tải tệp bảo mật có chữ ký HMAC
router.get('/uploads/local-download', controller.handleLocalDownload);

export default router;

