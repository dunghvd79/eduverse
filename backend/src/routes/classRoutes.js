import { Router } from 'express';
import * as controller from '../controllers/classController.js';
import * as quizController from '../controllers/quizController.js';
import * as gradebookController from '../controllers/gradebookController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateBody, validateQuery, validateIdParam } from '../middlewares/validateMiddleware.js';
import {
  queryClassesSchema,
  createClassSchema,
  updateClassSchema,
  regenerateCodeSchema,
  enrollClassSchema,
  queryMembersSchema,
  addMemberSchema,
  queryProgressSchema
} from '../validations/classValidation.js';
import { updateClassQuizSchema } from '../validations/quizValidation.js';
import Joi from 'joi';

const exportGradesQuerySchema = Joi.object({
  format: Joi.string().valid('xlsx', 'csv').default('xlsx').messages({ 'any.only': 'format phải là xlsx hoặc csv' })
});

const router = Router();

// Router được mount tại /api/v1/classes (xem app.js) - đặc tả: docs/api/api-classes.md
// Thứ tự middleware: xác thực -> phân quyền -> params -> query/body -> controller.
// Quyền chi tiết theo từng lớp (GV phụ trách, học viên trong lớp) kiểm tra trong classService.

const classStaff = [authenticateToken, authorizeRoles('teacher', 'training_manager', 'admin')];
const teacherOrAdmin = [authenticateToken, authorizeRoles('teacher', 'admin')];

// ==========================================
// 1. QUẢN LÝ LỚP HỌC
// ==========================================
// Danh sách lớp (phân trang, tìm kiếm, lọc khóa học/trạng thái/giảng viên); mã lớp chỉ hiện với người quản lý lớp | Role: mọi role
router.get('/', authenticateToken, validateQuery(queryClassesSchema), controller.getClasses);
// Lớp của tôi: học viên = lớp đã ghi danh (kèm tiến độ), giảng viên = lớp phụ trách | Role: mọi role
// Đặt TRƯỚC '/:id' để 'my-classes' không bị hiểu là :id
router.get('/my-classes', authenticateToken, controller.getMyClasses);
// Học viên tham gia lớp bằng mã | Role: student
router.post('/enroll', authenticateToken, authorizeRoles('student'), validateBody(enrollClassSchema), controller.enroll);
// Mở lớp cho khóa học đã published | Role: teacher (tự phụ trách), training_manager, admin (chỉ định teacherId)
router.post('/', ...classStaff, validateBody(createClassSchema), controller.createClass);
// Chi tiết lớp (kèm quyền của người xem, tiến độ nếu là học viên trong lớp) | Role: mọi role
router.get('/:id', authenticateToken, validateIdParam(), controller.getClass);
// Sửa tên/ngày/trạng thái lớp | Role: GV phụ trách, training_manager, admin
router.patch('/:id', ...classStaff, validateIdParam(), validateBody(updateClassSchema), controller.updateClass);
// Xóa mềm lớp, giải phóng mã lớp | Role: GV phụ trách, training_manager, admin
router.delete('/:id', ...classStaff, validateIdParam(), controller.deleteClass);
// Đổi mã tham gia (tự sinh hoặc customCode) | Role: GV phụ trách, admin
router.post('/:id/regenerate-code', ...teacherOrAdmin, validateIdParam(), validateBody(regenerateCodeSchema), controller.regenerateCode);

// ==========================================
// 2. THÀNH VIÊN
// ==========================================
// Danh sách học viên (học viên trong lớp chỉ thấy bạn học active, không thấy email) | Role: thành viên lớp, GV phụ trách, manager, admin
router.get('/:id/members', authenticateToken, validateIdParam(), validateQuery(queryMembersSchema), controller.getMembers);
// Thêm học viên bằng email | Role: GV phụ trách, admin
router.post('/:id/members', ...teacherOrAdmin, validateIdParam(), validateBody(addMemberSchema), controller.addMember);
// Xóa học viên khỏi lớp (dropped + xóa mềm) | Role: GV phụ trách, admin
router.delete('/:id/members/:studentId', ...teacherOrAdmin, validateIdParam('id', 'studentId'), controller.removeMember);

// ==========================================
// 3. BÁO CÁO
// ==========================================
// Báo cáo tiến độ học tập cả lớp | Role: GV phụ trách, training_manager, admin
router.get('/:id/progress', ...classStaff, validateIdParam(), validateQuery(queryProgressSchema), controller.getProgress);

// ==========================================
// 4. BÀI KIỂM TRA CỦA LỚP (bổ sung - xem api-quizzes.md mục 4)
// ==========================================
// Đề thi của khóa học trong lớp: học viên thấy đề công khai + lượt làm của mình; người quản lý lớp thấy lịch & thống kê | Role: thành viên lớp, GV phụ trách, manager, admin
router.get('/:id/quizzes', authenticateToken, validateIdParam(), quizController.getClassQuizzes);
// Đặt lịch mở/đóng, bật/tắt đề cho lớp | Role: GV phụ trách, training_manager, admin
router.put('/:id/quizzes/:quizId', ...classStaff, validateIdParam('id', 'quizId'), validateBody(updateClassQuizSchema), quizController.updateClassQuiz);

// ==========================================
// 5. BẢNG ĐIỂM (docs/requirements/grading-policy.md)
// ==========================================
// Xuất bảng điểm Excel/CSV (?format=xlsx|csv) | Role: GV phụ trách, training_manager, admin
router.get('/:id/grades/export-excel', ...classStaff, validateIdParam(), validateQuery(exportGradesQuerySchema), gradebookController.exportGrades);
// Bảng điểm dạng JSON cho trang Sổ điểm (bổ sung) | Role: GV phụ trách, training_manager, admin
router.get('/:id/gradebook', ...classStaff, validateIdParam(), gradebookController.getGradebook);
// Điểm của chính học viên trong lớp (bổ sung) | Role: student trong lớp
router.get('/:id/my-grades', authenticateToken, authorizeRoles('student'), validateIdParam(), gradebookController.getMyGrades);

export default router;
