import * as dashboardService from '../services/dashboardService.js';
import { sendSuccess } from '../utils/response.js';

const MESSAGE = 'Lấy dữ liệu tổng quan thành công';

export const getStudentDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getStudentDashboard(req.user);
    return sendSuccess(res, 200, MESSAGE, data);
  } catch (error) {
    next(error);
  }
};

export const getTeacherDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getTeacherDashboard(req.user);
    return sendSuccess(res, 200, MESSAGE, data);
  } catch (error) {
    next(error);
  }
};

export const getManagerDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getManagerDashboard();
    return sendSuccess(res, 200, MESSAGE, data);
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getAdminDashboard();
    return sendSuccess(res, 200, MESSAGE, data);
  } catch (error) {
    next(error);
  }
};

export default { getStudentDashboard, getTeacherDashboard, getManagerDashboard, getAdminDashboard };
