import * as categoryService from '../services/categoryService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/v1/categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const data = await categoryService.getCategories(req.query, req.user || null);
    return sendSuccess(res, 200, 'Lấy danh sách danh mục thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/categories
 */
export const createCategory = async (req, res, next) => {
  try {
    const data = await categoryService.createCategory(req.body);
    return sendSuccess(res, 201, 'Tạo danh mục thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/categories/:id
 */
export const updateCategory = async (req, res, next) => {
  try {
    const data = await categoryService.updateCategory(req.params.id, req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật danh mục thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/categories/reorder
 */
export const reorderCategories = async (req, res, next) => {
  try {
    await categoryService.reorderCategories(req.body.categoryIds);
    return sendSuccess(res, 200, 'Sắp xếp danh mục thành công', null);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/categories/:id
 */
export const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    return sendSuccess(res, 200, 'Xóa danh mục thành công', null);
  } catch (error) {
    next(error);
  }
};

export default {
  getCategories,
  createCategory,
  updateCategory,
  reorderCategories,
  deleteCategory
};
