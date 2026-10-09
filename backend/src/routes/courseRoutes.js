import { Router } from 'express';
import * as controller from '../controllers/courseController.js';
import { authenticateToken, optionalAuthenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  createCourseSchema,
  updateCourseSchema,
  queryCoursesSchema,
  rejectCourseSchema,
  createChapterSchema,
  updateChapterSchema,
  reorderChaptersSchema,
  createLessonSchema,
  updateLessonSchema,
  reorderLessonsSchema,
  updateLessonProgressSchema,
  validateBody,
  validateQuery
} from '../validations/courseValidation.js';

const router = Router();

// Courses
router.get('/courses', optionalAuthenticateToken, validateQuery(queryCoursesSchema), controller.getCourses);
router.get('/courses/:id/curriculum', optionalAuthenticateToken, controller.getCurriculum);
router.get('/courses/:id', optionalAuthenticateToken, controller.getCourse);
router.post('/courses', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(createCourseSchema), controller.createCourse);
router.patch('/courses/:id', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(updateCourseSchema), controller.updateCourse);
router.delete('/courses/:id', authenticateToken, authorizeRoles('teacher', 'admin'), controller.deleteCourse);
router.post('/courses/:id/publish-request', authenticateToken, authorizeRoles('teacher'), controller.publishRequest);
router.patch('/courses/:id/approve', authenticateToken, authorizeRoles('training_manager', 'admin'), controller.approveCourse);
router.patch('/courses/:id/reject', authenticateToken, authorizeRoles('training_manager', 'admin'), validateBody(rejectCourseSchema), controller.rejectCourse);

// Chapters
router.get('/courses/:courseId/chapters', optionalAuthenticateToken, controller.getChapters);
router.post('/courses/:courseId/chapters', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(createChapterSchema), controller.createChapter);
router.patch('/courses/:courseId/chapters/reorder', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(reorderChaptersSchema), controller.reorderChapters);
router.patch('/chapters/:id', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(updateChapterSchema), controller.updateChapter);
router.delete('/chapters/:id', authenticateToken, authorizeRoles('teacher', 'admin'), controller.deleteChapter);

// Lessons
router.get('/chapters/:chapterId/lessons', optionalAuthenticateToken, controller.getLessons);
router.get('/lessons/:id', authenticateToken, controller.getLesson);
router.post('/chapters/:chapterId/lessons', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(createLessonSchema), controller.createLesson);
router.patch('/lessons/:id', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(updateLessonSchema), controller.updateLesson);
router.patch('/chapters/:chapterId/lessons/reorder', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(reorderLessonsSchema), controller.reorderLessons);
router.delete('/lessons/:id', authenticateToken, authorizeRoles('teacher', 'admin'), controller.deleteLesson);

// Progress
router.post('/classes/:classId/lessons/:lessonId/progress', authenticateToken, authorizeRoles('student'), validateBody(updateLessonProgressSchema), controller.updateLessonProgress);

export default router;
