import * as categoryService from '../services/categoryService.js';
import { sendSuccess } from '../utils/response.js';

export const getCategories = async (req, res, next) => {
  try {
    const data = await categoryService.getCategories({
      includeInactive: req.user && ['training_manager', 'admin'].includes(req.user.role)
        ? req.query.includeInactive
        : false
    });
    return sendSuccess(res, 200, 'Lấy danh sách danh mục thành công', data);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const data = await categoryService.createCategory(req.body);
    return sendSuccess(res, 201, 'Tạo danh mục thành công', data);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const data = await categoryService.updateCategory(req.params.id, req.body);
    return sendSuccess(res, 200, 'Cập nhật danh mục thành công', data);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    return sendSuccess(res, 200, 'Xóa danh mục thành công', { id: req.params.id });
  } catch (error) {
    next(error);
  }
};
