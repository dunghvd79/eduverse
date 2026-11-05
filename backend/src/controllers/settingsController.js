import * as settingsService from '../services/settingsService.js';
import { sendSuccess } from '../utils/response.js';

export const getPublicSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getPublicSettings();
    return sendSuccess(res, 200, 'Lấy cài đặt công khai thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getAdminSettings();
    return sendSuccess(res, 200, 'Lấy cài đặt hệ thống thành công', data);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const data = await settingsService.updateSettings(req.body, req.user);
    const message = data.changed.length ? 'Đã lưu cài đặt hệ thống' : 'Không có thay đổi nào cần lưu';
    return sendSuccess(res, 200, message, data);
  } catch (error) {
    next(error);
  }
};

export default { getPublicSettings, getSettings, updateSettings };
