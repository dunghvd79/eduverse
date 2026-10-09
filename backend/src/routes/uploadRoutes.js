import { Router } from 'express';
import * as uploadController from '../controllers/uploadController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { presignUploadSchema } from '../validations/uploadValidation.js';
import { validateBody } from '../validations/courseValidation.js';

const router = Router();

// Quyền theo từng loại upload được kiểm tra trong uploadService (theo purpose)
router.post('/presign', authenticateToken, validateBody(presignUploadSchema), uploadController.createPresignedUpload);

export default router;
