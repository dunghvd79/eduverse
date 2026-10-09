import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import { authenticateToken, optionalAuthenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  createCourseSchema,
  updateCourseSchema,
  queryCoursesSchema,
  courseCurriculumQuerySchema,
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

// ==========================================
// Courses
// ==========================================
router.get('/', optionalAuthenticateToken, validateQuery(queryCoursesSchema), courseController.getCourses);
router.get('/:id/curriculum', optionalAuthenticateToken, validateQuery(courseCurriculumQuerySchema), courseController.getCourseCurriculum);
router.get('/:id', optionalAuthenticateToken, courseController.getCourseById);

router.post('/', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(createCourseSchema), courseController.createCourse);
router.patch('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(updateCourseSchema), courseController.updateCourse);
router.delete('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), courseController.deleteCourse);
router.post('/:id/publish-request', authenticateToken, authorizeRoles('teacher', 'admin'), courseController.publishCourseRequest);
router.patch('/:id/approve', authenticateToken, authorizeRoles('training_manager', 'admin'), courseController.approveCourse);
router.patch('/:id/reject', authenticateToken, authorizeRoles('training_manager', 'admin'), validateBody(rejectCourseSchema), courseController.rejectCourse);

// ==========================================
// Course chapter operations
// ==========================================
router.get('/:courseId/chapters', optionalAuthenticateToken, courseController.getChapters);
router.post('/:courseId/chapters', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(createChapterSchema), courseController.createChapter);
router.patch('/:courseId/chapters/reorder', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(reorderChaptersSchema), courseController.reorderChapters);

export default router;
