import * as courseMaterialService from '../services/courseMaterialService.js';
import { sendSuccess } from '../utils/response.js';

export const getLessonMaterials = async (req, res, next) => {
  try {
    const data = await courseMaterialService.getLessonMaterials(req.params.lessonId, req.user);
    return sendSuccess(res, 200, 'Lấy danh sách tài liệu bài học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const createLessonMaterial = async (req, res, next) => {
  try {
    const data = await courseMaterialService.createLessonMaterial(req.params.lessonId, req.body, req.user);
    return sendSuccess(res, 201, 'Thêm tài liệu bài học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const updateLessonMaterial = async (req, res, next) => {
  try {
    const data = await courseMaterialService.updateLessonMaterial(
      req.params.lessonId,
      req.params.materialId,
      req.body.title,
      req.user
    );
    return sendSuccess(res, 200, 'Cập nhật tiêu đề tài liệu thành công', data);
  } catch (error) {
    next(error);
  }
};

export const deleteLessonMaterial = async (req, res, next) => {
  try {
    await courseMaterialService.deleteLessonMaterial(req.params.lessonId, req.params.materialId, req.user);
    return sendSuccess(res, 200, 'Xóa tài liệu bài học thành công', null);
  } catch (error) {
    next(error);
  }
};

export const getLessonMaterialDownloadUrl = async (req, res, next) => {
  try {
    const data = await courseMaterialService.getLessonMaterialDownloadUrl(
      req.params.lessonId,
      req.params.materialId,
      req.user
    );
    return sendSuccess(res, 200, 'Tạo liên kết tải tài liệu thành công', data);
  } catch (error) {
    next(error);
  }
};

export default {
  getLessonMaterials,
  createLessonMaterial,
  updateLessonMaterial,
  deleteLessonMaterial,
  getLessonMaterialDownloadUrl
};
