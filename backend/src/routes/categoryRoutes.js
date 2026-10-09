import { Router } from 'express';
import * as controller from '../controllers/categoryController.js';
import { authenticateToken, optionalAuthenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateBody, validateQuery, validateIdParam } from '../middlewares/validateMiddleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  queryCategoriesSchema
} from '../validations/courseValidation.js';

const router = Router();

// Router được mount tại /api/v1/categories (xem app.js).
// '/reorder' phải khai báo trước '/:id', nếu không Express sẽ hiểu nhầm 'reorder' là một :id.

const managerOrAdmin = [authenticateToken, authorizeRoles('training_manager', 'admin')];

// Danh sách danh mục đang hiển thị (manager/admin thêm ?includeHidden=true để xem cả danh mục ẩn) | Role: khách + mọi role
router.get('/', optionalAuthenticateToken, validateQuery(queryCategoriesSchema), controller.getCategories);
// Tạo danh mục mới (slug tự sinh từ tên) | Role: training_manager, admin
router.post('/', ...managerOrAdmin, validateBody(createCategorySchema), controller.createCategory);
// Sắp xếp lại thứ tự hiển thị (gửi đủ toàn bộ danh mục) | Role: training_manager, admin
router.patch('/reorder', ...managerOrAdmin, validateBody(reorderCategoriesSchema), controller.reorderCategories);
// Sửa tên / mô tả / thứ tự, ẩn hoặc hiện danh mục | Role: training_manager, admin
router.patch('/:id', ...managerOrAdmin, validateIdParam(), validateBody(updateCategorySchema), controller.updateCategory);
// Xóa danh mục (bị chặn 409 nếu còn khóa học sử dụng) | Role: training_manager, admin
router.delete('/:id', ...managerOrAdmin, validateIdParam(), controller.deleteCategory);

export default router;
