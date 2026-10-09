import { Router } from 'express';
import * as controller from '../controllers/categoryController.js';
import { authenticateToken, optionalAuthenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  queryCategoriesSchema,
  validateBody,
  validateQuery
} from '../validations/courseValidation.js';

const router = Router();
const manage = [authenticateToken, authorizeRoles('training_manager', 'admin')];

router.get('/', optionalAuthenticateToken, validateQuery(queryCategoriesSchema), controller.getCategories);
router.post('/', ...manage, validateBody(createCategorySchema), controller.createCategory);
// '/reorder' phải khai báo trước '/:id'
router.patch('/reorder', ...manage, validateBody(reorderCategoriesSchema), controller.reorderCategories);
router.patch('/:id', ...manage, validateBody(updateCategorySchema), controller.updateCategory);
router.delete('/:id', ...manage, controller.deleteCategory);

export default router;
