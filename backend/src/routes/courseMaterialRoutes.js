import { Router } from 'express';
import * as courseMaterialController from '../controllers/courseMaterialController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validations/courseValidation.js';
import { createCourseMaterialSchema, updateCourseMaterialSchema } from '../validations/uploadValidation.js';

const router = Router();
const canManageMaterials = [authenticateToken, authorizeRoles('teacher', 'admin')];

router.get('/lessons/:lessonId/materials', authenticateToken, courseMaterialController.getLessonMaterials);
router.post(
  '/lessons/:lessonId/materials',
  ...canManageMaterials,
  validateBody(createCourseMaterialSchema),
  courseMaterialController.createLessonMaterial
);
router.patch(
  '/lessons/:lessonId/materials/:materialId',
  ...canManageMaterials,
  validateBody(updateCourseMaterialSchema),
  courseMaterialController.updateLessonMaterial
);
router.delete(
  '/lessons/:lessonId/materials/:materialId',
  ...canManageMaterials,
  courseMaterialController.deleteLessonMaterial
);
router.get(
  '/lessons/:lessonId/materials/:materialId/download-url',
  authenticateToken,
  courseMaterialController.getLessonMaterialDownloadUrl
);

export default router;
