import fs from 'fs';
import path from 'path';
import * as uploadService from '../services/uploadService.js';
import * as materialService from '../services/materialService.js';
import { resolveLocalFilePath, verifyDownloadSignature } from '../services/storageService.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';


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

export const handleLocalPut = async (req, res, next) => {
  try {
    const fileKey = req.query.key;
    if (!fileKey) {
      throw new AppError('Thiếu tham số key tải lên', 400, 'Bad Request');
    }

    const fullPath = resolveLocalFilePath(fileKey);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const writeStream = fs.createWriteStream(fullPath);
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      res.status(200).send('OK');
    });

    writeStream.on('error', (err) => {
      next(err);
    });
  } catch (error) {
    next(error);
  }
};

export const handleLocalDownload = async (req, res, next) => {
  try {
    const { key, filename, sig } = req.query;
    if (!key) {
      throw new AppError('Thiếu thông tin tệp tải về', 400, 'Bad Request');
    }

    if (!verifyDownloadSignature(key, sig)) {
      throw new AppError('Liên kết tải tệp không hợp lệ hoặc đã hết hạn', 403, 'Forbidden');
    }

    const fullPath = resolveLocalFilePath(key);
    if (!fs.existsSync(fullPath)) {
      throw new AppError('Tệp không tồn tại trên hệ thống lưu trữ', 404, 'Not Found');
    }

    return res.download(fullPath, filename || path.basename(fullPath));
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
  getDownloadUrl,
  handleLocalPut,
  handleLocalDownload
};

