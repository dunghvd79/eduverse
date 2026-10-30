import * as classService from '../services/classService.js';
import { withTodoSummary } from '../services/studentTodoService.js';
import { sendSuccess } from '../utils/response.js';

export const getClasses = async (req, res, next) => {
  try {
    const data = await classService.getClasses(req.query, req.user);
    return sendSuccess(res, 200, 'Lấy danh sách lớp học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getMyClasses = async (req, res, next) => {
  try {
    const classes = await classService.getMyClasses(req.user);
    // Học viên: kèm số việc cần làm từng lớp (studentTodoService tách riêng để tránh vòng import với classService)
    const data = req.user.role === 'student' ? await withTodoSummary(classes, req.user.id) : classes;
    return sendSuccess(res, 200, 'Lấy danh sách lớp học cá nhân thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getClass = async (req, res, next) => {
  try {
    const data = await classService.getClassById(req.params.id, req.user);
    return sendSuccess(res, 200, 'Lấy thông tin lớp học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const createClass = async (req, res, next) => {
  try {
    const data = await classService.createClass(req.body, req.user);
    return sendSuccess(res, 201, 'Tạo lớp học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req, res, next) => {
  try {
    const data = await classService.updateClass(req.params.id, req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật lớp học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (req, res, next) => {
  try {
    await classService.deleteClass(req.params.id, req.user);
    return sendSuccess(res, 200, 'Xóa lớp học thành công', null);
  } catch (error) {
    next(error);
  }
};

export const regenerateCode = async (req, res, next) => {
  try {
    const data = await classService.regenerateCode(req.params.id, req.body?.customCode, req.user);
    return sendSuccess(res, 200, 'Làm mới mã lớp học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const enroll = async (req, res, next) => {
  try {
    const data = await classService.enrollByCode(req.body.classCode, req.user);
    return sendSuccess(res, 201, 'Ghi danh thành công vào lớp học!', data);
  } catch (error) {
    next(error);
  }
};

export const getMembers = async (req, res, next) => {
  try {
    const data = await classService.getMembers(req.params.id, req.query, req.user);
    return sendSuccess(res, 200, 'Lấy danh sách thành viên lớp học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const data = await classService.addMember(req.params.id, req.body.email, req.user);
    return sendSuccess(res, 201, 'Thêm học viên vào lớp thành công', data);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    await classService.removeMember(req.params.id, req.params.studentId, req.user);
    return sendSuccess(res, 200, 'Đã xóa học viên ra khỏi lớp học thành công', null);
  } catch (error) {
    next(error);
  }
};

export const getProgress = async (req, res, next) => {
  try {
    const data = await classService.getClassProgress(req.params.id, req.query, req.user);
    return sendSuccess(res, 200, 'Lấy báo cáo tiến độ học tập của lớp thành công', data);
  } catch (error) {
    next(error);
  }
};

export default {
  getClasses,
  getMyClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  regenerateCode,
  enroll,
  getMembers,
  addMember,
  removeMember,
  getProgress
};
