import { Router } from 'express';
import * as controller from '../controllers/assignmentController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateBody, validateQuery, validateIdParam } from '../middlewares/validateMiddleware.js';
import {
  queryAssignmentsSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  scheduleAssignmentSchema,
  submissionUploadSchema,
  confirmSubmissionSchema,
  querySubmissionsSchema,
  gradeSubmissionSchema,
  requestResubmissionSchema,
  bulkGradeSchema,
  zipStatusQuerySchema
} from '../validations/assignmentValidation.js';

const router = Router();

// Router được mount tại /api/v1 (xem app.js) - đặc tả: docs/api/api-assignments.md
// Thứ tự middleware: xác thực -> phân quyền -> params -> query/body -> controller.
// Quyền theo khóa học/lớp (chủ khóa, GV phụ trách lớp, học viên trong lớp) kiểm tra trong assignmentService.

const teacherOrAdmin = [authenticateToken, authorizeRoles('teacher', 'admin')];
const studentOnly = [authenticateToken, authorizeRoles('student')];
const classAssignmentParams = validateIdParam('classId', 'assignmentId');
const CLASS_ASSIGNMENT = '/classes/:classId/assignments/:assignmentId';

// ==========================================
// 1. KHUNG BÀI TẬP (nội dung khóa học - sửa khi khóa draft/rejected)
// ==========================================
// Danh sách bài tập (học viên: khóa đang học) | Role: mọi role
router.get('/assignments', authenticateToken, validateQuery(queryAssignmentsSchema), controller.getAssignments);
// Tạo bài tập cho bài học loại 'assignment' | Role: chủ khóa (teacher), admin
router.post('/assignments', ...teacherOrAdmin, validateBody(createAssignmentSchema), controller.createAssignment);
// Chi tiết bài tập | Role: mọi role (theo quyền xem khóa học)
router.get('/assignments/:id', authenticateToken, validateIdParam(), controller.getAssignment);
// Sửa bài tập | Role: chủ khóa (teacher), admin
router.patch('/assignments/:id', ...teacherOrAdmin, validateIdParam(), validateBody(updateAssignmentSchema), controller.updateAssignment);
// Xóa mềm bài tập | Role: chủ khóa (teacher), admin
router.delete('/assignments/:id', ...teacherOrAdmin, validateIdParam(), controller.deleteAssignment);

// ==========================================
// 2. BÀI TẬP CỦA LỚP & LỊCH NỘP
// ==========================================
// Bài tập của lớp (HV: bài đã giao + bài nộp của mình; người quản lý lớp: mọi bài + thống kê) | Role: thành viên lớp, GV phụ trách, manager, admin
router.get('/classes/:classId/assignments', authenticateToken, validateIdParam('classId'), controller.getClassAssignments);
// Chi tiết bài tập trong lớp (đề bài + lịch nộp) | Role: như trên
router.get(CLASS_ASSIGNMENT, authenticateToken, classAssignmentParams, controller.getClassAssignment);
// Giao bài / đổi lịch nộp (deadline, nộp muộn, hạn chót tuyệt đối) | Role: GV phụ trách lớp, admin
router.put(`${CLASS_ASSIGNMENT}/schedule`, ...teacherOrAdmin, classAssignmentParams, validateBody(scheduleAssignmentSchema), controller.scheduleAssignment);

// ==========================================
// 3. NỘP BÀI (route tĩnh đặt trước '/submissions' để không trùng)
// ==========================================
// Xin Presigned PUT URL nộp bài | Role: student trong lớp
router.post(`${CLASS_ASSIGNMENT}/submissions/presigned-url`, ...studentOnly, classAssignmentParams, validateBody(submissionUploadSchema), controller.createUploadUrl);
// Xác nhận nộp / nộp lại | Role: student trong lớp
router.post(`${CLASS_ASSIGNMENT}/submissions`, ...studentOnly, classAssignmentParams, validateBody(confirmSubmissionSchema), controller.confirmSubmission);
// Bài nộp của tôi (link tải, điểm, nhận xét, có được nộp lại không) | Role: student trong lớp
router.get(`${CLASS_ASSIGNMENT}/my-submission`, ...studentOnly, classAssignmentParams, controller.getMySubmission);

// ==========================================
// 4. CHẤM BÀI
// ==========================================
// Tải ZIP toàn bộ bài nộp (≤50MB trả link ngay, lớn hơn chạy nền 202) | Role: GV phụ trách lớp, admin
router.get(`${CLASS_ASSIGNMENT}/submissions/download-all`, ...teacherOrAdmin, classAssignmentParams, controller.downloadAll);
// Tiến độ nén ZIP | Role: GV phụ trách lớp, admin
router.get(`${CLASS_ASSIGNMENT}/submissions/download-all/status`, ...teacherOrAdmin, classAssignmentParams, validateQuery(zipStatusQuerySchema), controller.downloadAllStatus);
// Chấm hàng loạt | Role: GV phụ trách lớp, admin
router.patch(`${CLASS_ASSIGNMENT}/submissions/bulk-grade`, ...teacherOrAdmin, classAssignmentParams, validateBody(bulkGradeSchema), controller.bulkGrade);
// Danh sách bài nộp cả lớp (kể cả chưa nộp - missing) | Role: GV phụ trách lớp, admin
router.get(`${CLASS_ASSIGNMENT}/submissions`, ...teacherOrAdmin, classAssignmentParams, validateQuery(querySubmissionsSchema), controller.getSubmissions);
// Chi tiết 1 bài nộp (link tải) | Role: GV phụ trách lớp, admin
router.get('/assignment-submissions/:id', ...teacherOrAdmin, validateIdParam(), controller.getSubmission);
// Chấm / chấm lại | Role: GV phụ trách lớp, admin
router.patch('/assignment-submissions/:id/grade', ...teacherOrAdmin, validateIdParam(), validateBody(gradeSubmissionSchema), controller.gradeSubmission);
// Yêu cầu nộp lại (giữ điểm cũ) | Role: GV phụ trách lớp, admin
router.post('/assignment-submissions/:id/request-resubmission', ...teacherOrAdmin, validateIdParam(), validateBody(requestResubmissionSchema), controller.requestResubmission);

export default router;
