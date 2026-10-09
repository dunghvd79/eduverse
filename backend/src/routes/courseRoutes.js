import { Router } from 'express';
import * as controller from '../controllers/courseController.js';
import { authenticateToken, optionalAuthenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  validateBody,
  validateQuery,
  validateIdParam,
  validateIdOrSlugParam
} from '../middlewares/validateMiddleware.js';
import {
  createCourseSchema,
  updateCourseSchema,
  queryCoursesSchema,
  queryCurriculumSchema,
  rejectCourseSchema,
  createChapterSchema,
  updateChapterSchema,
  reorderChaptersSchema,
  createLessonSchema,
  updateLessonSchema,
  reorderLessonsSchema,
  updateLessonProgressSchema
} from '../validations/courseValidation.js';

const router = Router();

// Router được mount tại /api/v1 (xem app.js).
// Thứ tự middleware: xác thực -> phân quyền -> params -> query/body -> controller.

// Middleware dùng chung
const teacherOrAdmin = [authenticateToken, authorizeRoles('teacher', 'admin')];
const managerOrAdmin = [authenticateToken, authorizeRoles('training_manager', 'admin')];
const courseIdOrSlug = validateIdOrSlugParam('id');

// ==========================================
// 1. KHÓA HỌC (COURSES)
// ==========================================
// Danh sách khóa học (lọc trạng thái/danh mục/mine, tìm kiếm, phân trang) | Role: khách + mọi role (quyền xem tùy role)
router.get('/courses', optionalAuthenticateToken, validateQuery(queryCoursesSchema), controller.getCourses);
// Cây đề cương Course -> Chapters -> Lessons, ?classId để lấy tiến độ | Role: khách + mọi role (khóa chưa published: chủ khóa, manager, admin)
router.get('/courses/:id/curriculum', optionalAuthenticateToken, courseIdOrSlug, validateQuery(queryCurriculumSchema), controller.getCurriculum);
// Chi tiết khóa học theo UUID hoặc slug | Role: khách + mọi role (khóa chưa published: chủ khóa, manager, admin)
router.get('/courses/:id', optionalAuthenticateToken, courseIdOrSlug, controller.getCourse);
// Tạo khóa học mới (trạng thái draft) | Role: teacher, admin
router.post('/courses', ...teacherOrAdmin, validateBody(createCourseSchema), controller.createCourse);
// Sửa thông tin khóa học (chỉ khi draft/rejected) | Role: chủ khóa (teacher), admin
router.patch('/courses/:id', ...teacherOrAdmin, validateIdParam(), validateBody(updateCourseSchema), controller.updateCourse);
// Xóa mềm khóa học (giảng viên chỉ xóa khi draft/rejected, admin xóa được mọi trạng thái) | Role: chủ khóa (teacher), admin
router.delete('/courses/:id', ...teacherOrAdmin, validateIdParam(), controller.deleteCourse);
// Gửi duyệt khóa học (draft/rejected -> pending) | Role: chủ khóa (teacher), admin
router.post('/courses/:id/publish-request', ...teacherOrAdmin, validateIdParam(), controller.publishRequest);
// Phê duyệt khóa học (pending -> published) | Role: training_manager, admin
router.patch('/courses/:id/approve', ...managerOrAdmin, validateIdParam(), controller.approveCourse);
// Từ chối khóa học kèm lý do (pending -> rejected) | Role: training_manager, admin
router.patch('/courses/:id/reject', ...managerOrAdmin, validateIdParam(), validateBody(rejectCourseSchema), controller.rejectCourse);

// ==========================================
// 2. CHƯƠNG HỌC (CHAPTERS)
// ==========================================
// Danh sách chương của khóa học | Role: khách + mọi role (khóa chưa published: chủ khóa, manager, admin)
router.get('/courses/:courseId/chapters', optionalAuthenticateToken, validateIdParam('courseId'), controller.getChapters);
// Thêm chương (chỉ khi khóa draft/rejected) | Role: chủ khóa (teacher), admin
router.post('/courses/:courseId/chapters', ...teacherOrAdmin, validateIdParam('courseId'), validateBody(createChapterSchema), controller.createChapter);
// Sắp xếp lại thứ tự chương (gửi đủ danh sách) | Role: chủ khóa (teacher), admin
router.patch('/courses/:courseId/chapters/reorder', ...teacherOrAdmin, validateIdParam('courseId'), validateBody(reorderChaptersSchema), controller.reorderChapters);
// Đổi tên chương | Role: chủ khóa (teacher), admin
router.patch('/chapters/:id', ...teacherOrAdmin, validateIdParam(), validateBody(updateChapterSchema), controller.updateChapter);
// Xóa chương (xóa kèm các bài học bên trong) | Role: chủ khóa (teacher), admin
router.delete('/chapters/:id', ...teacherOrAdmin, validateIdParam(), controller.deleteChapter);

// ==========================================
// 3. BÀI HỌC (LESSONS)
// ==========================================
// Danh sách bài học của chương (chỉ tiêu đề + loại bài, không có nội dung/video) | Role: khách + mọi role (khóa chưa published: chủ khóa, manager, admin)
router.get('/chapters/:chapterId/lessons', optionalAuthenticateToken, validateIdParam('chapterId'), controller.getLessons);
// Nội dung đầy đủ bài học (lý thuyết, video) | Role: chủ khóa, manager, admin, giảng viên dạy lớp, học viên đã ghi danh
router.get('/lessons/:id', authenticateToken, validateIdParam(), controller.getLesson);
// Thêm bài học vào chương | Role: chủ khóa (teacher), admin
router.post('/chapters/:chapterId/lessons', ...teacherOrAdmin, validateIdParam('chapterId'), validateBody(createLessonSchema), controller.createLesson);
// Sửa bài học | Role: chủ khóa (teacher), admin
router.patch('/lessons/:id', ...teacherOrAdmin, validateIdParam(), validateBody(updateLessonSchema), controller.updateLesson);
// Sắp xếp lại thứ tự bài học trong chương (gửi đủ danh sách) | Role: chủ khóa (teacher), admin
router.patch('/chapters/:chapterId/lessons/reorder', ...teacherOrAdmin, validateIdParam('chapterId'), validateBody(reorderLessonsSchema), controller.reorderLessons);
// Xóa bài học | Role: chủ khóa (teacher), admin
router.delete('/lessons/:id', ...teacherOrAdmin, validateIdParam(), controller.deleteLesson);

// ==========================================
// 4. TIẾN ĐỘ HỌC TẬP (LESSON PROGRESS)
// ==========================================
// Đánh dấu hoàn thành / bỏ hoàn thành bài học trong lớp đã ghi danh | Role: student
router.post('/classes/:classId/lessons/:lessonId/progress', authenticateToken, authorizeRoles('student'), validateIdParam('classId', 'lessonId'), validateBody(updateLessonProgressSchema), controller.updateLessonProgress);

export default router;
