import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  updateLessonSchema,
  updateLessonProgressSchema,
  validateBody
} from '../validations/courseValidation.js';

const router = Router();

router.get('/lessons/:id', authenticateToken, courseController.getLessonById);
router.patch('/lessons/:id', authenticateToken, authorizeRoles('teacher', 'admin'), validateBody(updateLessonSchema), courseController.updateLesson);
router.delete('/lessons/:id', authenticateToken, authorizeRoles('teacher', 'admin'), courseController.deleteLesson);
router.post('/classes/:classId/lessons/:lessonId/progress', authenticateToken, authorizeRoles('student'), validateBody(updateLessonProgressSchema), courseController.markLessonProgress);

export default router;
