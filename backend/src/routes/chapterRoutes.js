import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import { authenticateToken, optionalAuthenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  createChapterSchema,
  updateChapterSchema,
  createLessonSchema,
  reorderLessonsSchema,
  validateBody
} from '../validations/courseValidation.js';

const router = Router();

router.get('/chapters/:chapterId/lessons', optionalAuthenticateToken, courseController.getLessons);
router.post('/chapters/:chapterId/lessons', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(createLessonSchema), courseController.createLesson);
router.patch('/chapters/:chapterId/lessons/reorder', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(reorderLessonsSchema), courseController.reorderLessons);

router.patch('/chapters/:id', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(updateChapterSchema), courseController.updateChapter);
router.delete('/chapters/:id', authenticateToken, authorizeRoles('teacher', 'admin'), courseController.deleteChapter);

export default router;
