import * as discussionService from '../services/discussionService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/v1/classes/:classId/lessons/:lessonId/discussions
 */
export const listLessonDiscussions = async (req, res, next) => {
  try {
    const data = await discussionService.listLessonDiscussions(req.params.classId, req.params.lessonId, req.query, req.user);
    return sendSuccess(res, 200, 'Lấy danh sách thảo luận thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/classes/:classId/lessons/:lessonId/discussions
 */
export const createQuestion = async (req, res, next) => {
  try {
    const data = await discussionService.createQuestion(req.params.classId, req.params.lessonId, req.body, req.user);
    return sendSuccess(res, 201, 'Đăng câu hỏi thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/discussions/:id/replies
 */
export const createReply = async (req, res, next) => {
  try {
    const data = await discussionService.createReply(req.params.id, req.body, req.user);
    return sendSuccess(res, 201, 'Đăng câu trả lời thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/discussions/:id
 */
export const updateDiscussion = async (req, res, next) => {
  try {
    const data = await discussionService.updateDiscussion(req.params.id, req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật nội dung thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/discussions/:id
 */
export const deleteDiscussion = async (req, res, next) => {
  try {
    const data = await discussionService.deleteDiscussion(req.params.id, req.user);
    return sendSuccess(res, 200, 'Xóa bài thảo luận thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/discussions/:id/resolve
 */
export const setResolved = async (req, res, next) => {
  try {
    const data = await discussionService.setResolved(req.params.id, req.body.isResolved, req.user);
    return sendSuccess(res, 200, req.body.isResolved ? 'Đã đánh dấu đã giải đáp' : 'Đã bỏ đánh dấu đã giải đáp', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/classes/:classId/discussions
 */
export const listClassDiscussions = async (req, res, next) => {
  try {
    const data = await discussionService.listClassDiscussions(req.params.classId, req.query, req.user);
    return sendSuccess(res, 200, 'Lấy tổng quan thảo luận của lớp thành công', data);
  } catch (error) {
    next(error);
  }
};
