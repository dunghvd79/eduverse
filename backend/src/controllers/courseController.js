import * as courseService from '../services/courseService.js';
import * as chapterService from '../services/chapterService.js';
import * as lessonService from '../services/lessonService.js';
import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

const { LessonProgress, Enrollment, ClassModel, Lesson } = models;

export const getCourses = async (req, res, next) => {
  try {
    const data = await courseService.getCourses(req.query, req.user || null);
    return sendSuccess(res, 200, 'Lấy danh sách khóa học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getCourse = async (req, res, next) => {
  try {
    const data = await courseService.getCourseByIdOrSlug(req.params.id, req.user || null);
    return sendSuccess(res, 200, 'Lấy chi tiết khóa học thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getCurriculum = async (req, res, next) => {
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
    return sendSuccess(res, 200, 'Xóa khóa học thành công', null);
  } catch (error) {
    next(error);
  }
};

export const publishRequest = async (req, res, next) => {
  try {
    const data = await courseService.publishRequest(req.params.id, req.user);
    return sendSuccess(res, 200, 'Đã gửi yêu cầu phê duyệt khóa học tới Quản lý đào tạo.', data);
  } catch (error) {
    next(error);
  }
};

export const approveCourse = async (req, res, next) => {
  try {
    const data = await courseService.approveCourse(req.params.id, req.user.id);
    return sendSuccess(res, 200, 'Phê duyệt khóa học thành công. Khóa học đã được công khai.', data);
  } catch (error) {
    next(error);
  }
};

export const rejectCourse = async (req, res, next) => {
  try {
    const data = await courseService.rejectCourse(req.params.id, req.user.id, req.body.reason);
    return sendSuccess(res, 200, 'Đã từ chối duyệt khóa học và lưu lý do phản hồi.', data);
  } catch (error) {
    next(error);
  }
};

export const getChapters = async (req, res, next) => {
  try {
    const data = await chapterService.getChapters(req.params.courseId, req.user || null);
    return sendSuccess(res, 200, 'Lấy danh sách chương thành công', data);
  } catch (error) {
    next(error);
  }
};

export const createChapter = async (req, res, next) => {
  try {
    const data = await chapterService.createChapter(req.params.courseId, req.body, req.user);
    return sendSuccess(res, 201, 'Thêm chương học thành công', data);
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
    return sendSuccess(res, 200, 'Sắp xếp chương học thành công', null);
  } catch (error) {
    next(error);
  }
};

export const deleteChapter = async (req, res, next) => {
  try {
    await chapterService.deleteChapter(req.params.id, req.user);
    return sendSuccess(res, 200, 'Xóa chương học thành công', null);
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

export const getLesson = async (req, res, next) => {
  try {
    const data = await lessonService.getLessonById(req.params.id, req.user);
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
    return sendSuccess(res, 200, 'Sắp xếp bài học thành công', null);
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (req, res, next) => {
  try {
    await lessonService.deleteLesson(req.params.id, req.user);
    return sendSuccess(res, 200, 'Xóa bài học thành công', null);
  } catch (error) {
    next(error);
  }
};

export const updateLessonProgress = async (req, res, next) => {
  try {
    const { classId, lessonId } = req.params;
    const studentId = req.user.id;

    const lesson = await Lesson.findByPk(lessonId, {
      include: [{
        model: models.Chapter,
        attributes: ['id', 'course_id']
      }]
    });

    if (!lesson) {
      throw new AppError('Không tìm thấy bài học', 404, 'Not Found');
    }

    const enrollment = await Enrollment.findOne({
      where: { class_id: classId, student_id: studentId, status: 'active' }
    });

    if (!enrollment) {
      throw new AppError('Bạn chưa ghi danh vào lớp học này', 403, 'Forbidden');
    }

    const classRecord = await ClassModel.findByPk(classId, {
      attributes: ['id', 'course_id']
    });

    if (!classRecord || classRecord.course_id !== lesson.chapter?.course_id) {
      throw new AppError('Bài học không thuộc khóa học của lớp này', 400, 'Bad Request');
    }

    const [progress] = await LessonProgress.findOrCreate({
      where: {
        class_id: classId,
        student_id: studentId,
        lesson_id: lessonId
      },
      defaults: {
        is_completed: req.body.isCompleted,
        completed_at: new Date()
      }
    });

    if (progress.is_completed !== req.body.isCompleted) {
      progress.is_completed = req.body.isCompleted;
      progress.completed_at = new Date();
      await progress.save();
    }

    return sendSuccess(res, 200, 'Cập nhật tiến độ bài học thành công', {
      id: progress.id,
      classId,
      lessonId,
      isCompleted: progress.is_completed,
      completedAt: progress.completed_at
    });
  } catch (error) {
    next(error);
  }
};
export default {
  getCourses,
  getCourse,
  getCurriculum,
  createCourse,
  updateCourse,
  deleteCourse,
  publishRequest,
  approveCourse,
  rejectCourse,
  getChapters,
  createChapter,
  updateChapter,
  reorderChapters,
  deleteChapter,
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  reorderLessons,
  deleteLesson,
  updateLessonProgress
};
