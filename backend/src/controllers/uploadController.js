import * as uploadService from '../services/uploadService.js';
import * as materialService from '../services/materialService.js';
import { sendSuccess } from '../utils/response.js';

export const createPresignedUrl = async (req, res, next) => {
  try {
    const data = await uploadService.createPresignedUrl(req.body, req.user);
    return sendSuccess(res, 200, 'Khởi tạo URL tải tệp lên S3 thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getMaterials = async (req, res, next) => {
  try {
    const data = await materialService.getMaterials(req.params.lessonId, req.user);
    return sendSuccess(res, 200, 'Lấy danh sách tài liệu bài học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const createMaterial = async (req, res, next) => {
  try {
    const data = await materialService.createMaterial(req.params.lessonId, req.body, req.user);
    return sendSuccess(res, 201, 'Thêm tài liệu bài học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const updateMaterial = async (req, res, next) => {
  try {
    const data = await materialService.updateMaterial(req.params.lessonId, req.params.materialId, req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật tiêu đề tài liệu thành công', data);
  } catch (error) {
    next(error);
  }
};

export const deleteMaterial = async (req, res, next) => {
  try {
    await materialService.deleteMaterial(req.params.lessonId, req.params.materialId, req.user);
    return sendSuccess(res, 200, 'Xóa tài liệu bài học thành công', null);
  } catch (error) {
    next(error);
  }
};

export const getDownloadUrl = async (req, res, next) => {
  try {
    const data = await materialService.getDownloadUrl(req.params.lessonId, req.params.materialId, req.user);
    return sendSuccess(res, 200, 'Khởi tạo liên kết tải tài liệu thành công', data);
  } catch (error) {
    next(error);
  }
};

export default {
  createPresignedUrl,
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getDownloadUrl
};
