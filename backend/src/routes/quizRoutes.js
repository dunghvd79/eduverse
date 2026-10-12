import { Router } from 'express';
import * as controller from '../controllers/quizController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateBody, validateQuery, validateIdParam } from '../middlewares/validateMiddleware.js';
import { aiLimiter } from '../middlewares/rateLimiter.js';
import {
  queryQuizzesSchema,
  classContextQuerySchema,
  createQuizSchema,
  updateQuizSchema,
  createQuestionSchema,
  bulkCreateQuestionsSchema,
  updateQuestionSchema,
  reorderQuestionsSchema,
  bulkUpdateQuestionsSchema,
  bulkDeleteQuestionsSchema,
  submitAttemptSchema,
  myAttemptsQuerySchema,
  quizAttemptsQuerySchema,
  generateQuestionsSchema,
  regenerateSingleSchema
} from '../validations/quizValidation.js';

const router = Router();

// Router được mount tại /api/v1 (xem app.js) - đặc tả: docs/api/api-quizzes.md
// Thứ tự middleware: xác thực -> phân quyền -> params -> query/body -> controller.
// Quyền theo từng khóa học/lớp (chủ khóa, GV phụ trách lớp, học viên trong lớp) kiểm tra trong service.

const teacherOrAdmin = [authenticateToken, authorizeRoles('teacher', 'admin')];
const studentOnly = [authenticateToken, authorizeRoles('student')];

// ==========================================
// 1. LÀM BÀI (đặt trước '/quizzes/:id' để alias '/quizzes/attempts/...' không bị hiểu là :id)
// ==========================================
// Nộp bài & chấm tự động (ân hạn 30s) | Role: student (chủ phiên thi)
router.post('/quiz-attempts/:attemptId/submit', ...studentOnly, validateIdParam('attemptId'), validateBody(submitAttemptSchema), controller.submitAttempt);
router.post('/quizzes/attempts/:attemptId/submit', ...studentOnly, validateIdParam('attemptId'), validateBody(submitAttemptSchema), controller.submitAttempt);
// Xem lại bài làm (đáp án đúng tùy showAnswersAfterSubmit) | Role: học viên chủ bài, GV phụ trách, chủ khóa, manager, admin
router.get('/quiz-attempts/:attemptId', authenticateToken, validateIdParam('attemptId'), controller.getAttempt);
router.get('/quizzes/attempts/:attemptId', authenticateToken, validateIdParam('attemptId'), controller.getAttempt);

// ==========================================
// 2. ĐỀ THI
// ==========================================
// Danh sách đề (học viên: đề đã công khai của khóa đang học) | Role: mọi role
router.get('/quizzes', authenticateToken, validateQuery(queryQuizzesSchema), controller.getQuizzes);
// Tạo đề cho bài học loại quiz (khóa draft/rejected) | Role: chủ khóa (teacher), admin
router.post('/quizzes', ...teacherOrAdmin, validateBody(createQuizSchema), controller.createQuiz);
// Thông tin đề (?classId: học viên học nhiều lớp cùng khóa) | Role: mọi role
router.get('/quizzes/:id', authenticateToken, validateIdParam(), validateQuery(classContextQuerySchema), controller.getQuiz);
// Sửa cấu hình đề | Role: chủ khóa (teacher), admin
router.patch('/quizzes/:id', ...teacherOrAdmin, validateIdParam(), validateBody(updateQuizSchema), controller.updateQuiz);
// Xóa mềm đề | Role: chủ khóa (teacher), admin
router.delete('/quizzes/:id', ...teacherOrAdmin, validateIdParam(), controller.deleteQuiz);

// Bắt đầu / tiếp tục làm bài (?classId) | Role: student đã ghi danh
router.post('/quizzes/:id/attempts', ...studentOnly, validateIdParam(), validateQuery(classContextQuerySchema), controller.startAttempt);
// Lịch sử làm bài của tôi | Role: student
router.get('/quizzes/:id/my-attempts', ...studentOnly, validateIdParam(), validateQuery(myAttemptsQuerySchema), controller.getMyAttempts);
// Kết quả của học viên (GV phụ trách lớp chỉ thấy lớp mình) | Role: chủ khóa, GV phụ trách lớp, admin
router.get('/quizzes/:id/attempts', ...teacherOrAdmin, validateIdParam(), validateQuery(quizAttemptsQuerySchema), controller.getQuizAttempts);

// ==========================================
// 3. CÂU HỎI (route '/bulk', '/reorder' đặt trước để không trùng ':id')
// ==========================================
// Danh sách câu hỏi kèm đáp án đúng | Role: chủ khóa, GV dạy lớp của khóa, admin
router.get('/quizzes/:quizId/questions', ...teacherOrAdmin, validateIdParam('quizId'), controller.getQuestions);
// Thêm 1 câu hỏi | Role: chủ khóa (teacher), admin
router.post('/quizzes/:quizId/questions', ...teacherOrAdmin, validateIdParam('quizId'), validateBody(createQuestionSchema), controller.createQuestion);
// Thêm hàng loạt (kết quả Gemini AI) trong 1 transaction | Role: chủ khóa (teacher), admin
router.post('/quizzes/:quizId/questions/bulk', ...teacherOrAdmin, validateIdParam('quizId'), validateBody(bulkCreateQuestionsSchema), controller.bulkCreateQuestions);
// Sắp xếp lại thứ tự câu hỏi | Role: chủ khóa (teacher), admin
router.patch('/quizzes/:quizId/questions/reorder', ...teacherOrAdmin, validateIdParam('quizId'), validateBody(reorderQuestionsSchema), controller.reorderQuestions);
// Sửa hàng loạt (details | common_points) | Role: chủ khóa (teacher), admin
router.patch('/quizzes/:quizId/questions/bulk', ...teacherOrAdmin, validateIdParam('quizId'), validateBody(bulkUpdateQuestionsSchema), controller.bulkUpdateQuestions);
// Xóa hàng loạt | Role: chủ khóa (teacher), admin
router.delete('/quizzes/:quizId/questions/bulk', ...teacherOrAdmin, validateIdParam('quizId'), validateBody(bulkDeleteQuestionsSchema), controller.bulkDeleteQuestions);
// Sửa 1 câu hỏi (choices thay thế toàn bộ) | Role: chủ khóa (teacher), admin
router.patch('/questions/:id', ...teacherOrAdmin, validateIdParam(), validateBody(updateQuestionSchema), controller.updateQuestion);
// Xóa 1 câu hỏi | Role: chủ khóa (teacher), admin
router.delete('/questions/:id', ...teacherOrAdmin, validateIdParam(), controller.deleteQuestion);

// ==========================================
// 4. GEMINI AI (giới hạn 10 lần/phút/người)
// ==========================================
// Sinh danh sách câu hỏi xem trước từ tài liệu | Role: teacher, admin
router.post('/ai/generate-questions', ...teacherOrAdmin, aiLimiter, validateBody(generateQuestionsSchema), controller.generateQuestions);
// Sinh lại 1 câu hỏi thay thế | Role: teacher, admin
router.post('/ai/regenerate-single', ...teacherOrAdmin, aiLimiter, validateBody(regenerateSingleSchema), controller.regenerateSingle);

export default router;
