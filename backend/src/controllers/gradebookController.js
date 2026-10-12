import * as gradebookService from '../services/gradebookService.js';
import * as exportService from '../services/gradebookExportService.js';
import { sendSuccess } from '../utils/response.js';

export const getGradebook = async (req, res, next) => {
  try {
    const data = await gradebookService.getClassGradebook(req.params.id, req.user);
    return sendSuccess(res, 200, 'Lấy bảng điểm lớp thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getMyGrades = async (req, res, next) => {
  try {
    const data = await gradebookService.getMyGrades(req.params.id, req.user);
    return sendSuccess(res, 200, 'Lấy điểm của bạn thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Trả file nhị phân (không bọc envelope) - api-classes.md 2.13
 */
export const exportGrades = async (req, res, next) => {
  try {
    const { buffer, fileName, contentType } = await exportService.exportGrades(req.params.id, req.user, req.query.format);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};

export default { getGradebook, getMyGrades, exportGrades };
