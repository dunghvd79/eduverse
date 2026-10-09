import * as courseService from '../services/courseService.js';
import * as chapterService from '../services/chapterService.js';
import * as lessonService from '../services/lessonService.js';
import { sendSuccess } from '../utils/response.js';

export const getCourses = async (req, res, next) => {
  try {
    const data = await courseService.getCourses(req.query, req.user || null);
    return sendSuccess(res, 200, 'Lấy danh sách khóa học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const data = await courseService.getCourseByIdOrSlug(req.params.id, req.user || null);
    return sendSuccess(res, 200, 'Lấy chi tiết khóa học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getCourseCurriculum = async (req, res, next) => {
  try {
    const data = await courseService.getCourseCurriculum(req.params.id, {
      classId: req.query.classId || null,
      currentUser: req.user || null
    });
    return sendSuccess(res, 200, 'Lấy cấu trúc đề cương khóa học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const data = await courseService.createCourse(req.body, req.user.id);
    return sendSuccess(res, 201, 'Tạo khóa học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const data = await courseService.updateCourse(req.params.id, req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật khóa học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    await courseService.deleteCourse(req.params.id, req.user);
    return sendSuccess(res, 200, 'Xóa khóa học thành công', { id: req.params.id });
  } catch (error) {
    next(error);
  }
};

export const publishCourseRequest = async (req, res, next) => {
  try {
    const data = await courseService.publishRequest(req.params.id, req.user);
    return sendSuccess(res, 200, 'Gửi yêu cầu phê duyệt khóa học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const approveCourse = async (req, res, next) => {
  try {
    const data = await courseService.approveCourse(req.params.id, req.user.id);
    return sendSuccess(res, 200, 'Phê duyệt khóa học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const rejectCourse = async (req, res, next) => {
  try {
    const data = await courseService.rejectCourse(req.params.id, req.user.id, req.body.reason);
    return sendSuccess(res, 200, 'Từ chối phê duyệt khóa học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getChapters = async (req, res, next) => {
  try {
    const data = await chapterService.getChapters(req.params.courseId, req.user || null);
    return sendSuccess(res, 200, 'Lấy danh sách chương học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const createChapter = async (req, res, next) => {
  try {
    const data = await chapterService.createChapter(req.params.courseId, req.body, req.user);
    return sendSuccess(res, 201, 'Tạo chương học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const updateChapter = async (req, res, next) => {
  try {
    const data = await chapterService.updateChapter(req.params.id, req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật chương học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const reorderChapters = async (req, res, next) => {
  try {
    await chapterService.reorderChapters(req.params.courseId, req.body.chapterIds, req.user);
    return sendSuccess(res, 200, 'Sắp xếp thứ tự chương học thành công', { courseId: req.params.courseId });
  } catch (error) {
    next(error);
  }
};

export const deleteChapter = async (req, res, next) => {
  try {
    await chapterService.deleteChapter(req.params.id, req.user);
    return sendSuccess(res, 200, 'Xóa chương học thành công', { id: req.params.id });
  } catch (error) {
    next(error);
  }
};

export const getLessons = async (req, res, next) => {
  try {
    const data = await lessonService.getLessons(req.params.chapterId, req.user || null);
    return sendSuccess(res, 200, 'Lấy danh sách bài học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getLessonById = async (req, res, next) => {
  try {
    const data = await lessonService.getLessonById(req.params.id, req.user || null);
    return sendSuccess(res, 200, 'Lấy chi tiết bài học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const createLesson = async (req, res, next) => {
  try {
    const data = await lessonService.createLesson(req.params.chapterId, req.body, req.user);
    return sendSuccess(res, 201, 'Tạo bài học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (req, res, next) => {
  try {
    const data = await lessonService.updateLesson(req.params.id, req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật bài học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const reorderLessons = async (req, res, next) => {
  try {
    await lessonService.reorderLessons(req.params.chapterId, req.body.lessonIds, req.user);
    return sendSuccess(res, 200, 'Sắp xếp thứ tự bài học thành công', { chapterId: req.params.chapterId });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (req, res, next) => {
  try {
    await lessonService.deleteLesson(req.params.id, req.user);
    return sendSuccess(res, 200, 'Xóa bài học thành công', { id: req.params.id });
  } catch (error) {
    next(error);
  }
};

export const markLessonProgress = async (req, res, next) => {
  try {
    const data = await lessonService.updateLessonProgress(
      req.params.classId,
      req.params.lessonId,
      req.user.id,
      req.body.isCompleted
    );
    return sendSuccess(res, 200, 'Cập nhật tiến độ bài học thành công', data);
  } catch (error) {
    next(error);
  }
};

export default {
  getCourses,
  getCourseById,
  getCourseCurriculum,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourseRequest,
  approveCourse,
  rejectCourse,
  getChapters,
  createChapter,
  updateChapter,
  reorderChapters,
  deleteChapter,
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  reorderLessons,
  deleteLesson,
  markLessonProgress
};
