import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticateToken, optionalAuthenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { categoryQuerySchema, saveCategorySchema, validateBody, validateQuery } from '../validations/courseValidation.js';

const router = Router();
const canManageCategories = [authenticateToken, authorizeRoles('training_manager', 'admin')];

router.get('/', optionalAuthenticateToken, validateQuery(categoryQuerySchema), categoryController.getCategories);
router.post('/', ...canManageCategories, validateBody(saveCategorySchema), categoryController.createCategory);
router.patch('/:id', ...canManageCategories, validateBody(saveCategorySchema), categoryController.updateCategory);
router.delete('/:id', ...canManageCategories, categoryController.deleteCategory);

export default router;
