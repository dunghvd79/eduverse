import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { assertCourseVisible, assertCourseEditable } from './courseService.js';

const { sequelize, Course, Chapter, Lesson } = models;

/**
 * 1. Lấy danh sách các chương của một khóa học
 */
export const getChapters = async (courseId, currentUser = null) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }
  assertCourseVisible(course, currentUser);

  const chapters = await Chapter.findAll({
    where: { course_id: courseId },
    order: [['order_index', 'ASC']],
    include: [{ model: Lesson, attributes: ['id', 'title', 'lesson_type', 'order_index'] }]
  });

  return chapters.map(ch => ({
    id: ch.id,
    courseId: ch.course_id,
    title: ch.title,
    orderIndex: ch.order_index,
    totalLessons: ch.lessons ? ch.lessons.length : 0,
    lessons: ch.lessons || [],
    createdAt: ch.created_at,
    updatedAt: ch.updated_at
  }));
};

/**
 * 2. Thêm chương học mới vào khóa học
 */
export const createChapter = async (courseId, data, currentUser) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }

  const isOwner = course.owner_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError('Bạn không có quyền thêm chương học vào khóa học này', 403, 'Forbidden');
  }
  assertCourseEditable(course);

  let orderIndex = data.orderIndex;
  if (orderIndex === undefined || orderIndex === null) {
    const maxChapter = await Chapter.findOne({
      where: { course_id: courseId },
      order: [['order_index', 'DESC']]
    });
    orderIndex = maxChapter ? maxChapter.order_index + 1 : 1;
  }

  const chapter = await Chapter.create({
    course_id: courseId,
    title: data.title.trim(),
    order_index: orderIndex
  });

  return {
    id: chapter.id,
    courseId: chapter.course_id,
    title: chapter.title,
    orderIndex: chapter.order_index,
    createdAt: chapter.created_at
  };
};

/**
 * 3. Cập nhật tiêu đề chương học
 */
export const updateChapter = async (chapterId, data, currentUser) => {
  const chapter = await Chapter.findByPk(chapterId, {
    include: [{ model: Course, attributes: ['id', 'owner_id', 'status'] }]
  });

  if (!chapter) {
    throw new AppError('Không tìm thấy chương học', 404, 'Not Found');
  }

  const isOwner = chapter.course && chapter.course.owner_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError('Bạn không có quyền chỉnh sửa chương học này', 403, 'Forbidden');
  }
  assertCourseEditable(chapter.course);

  chapter.title = data.title.trim();
  await chapter.save();

  return {
    id: chapter.id,
    courseId: chapter.course_id,
    title: chapter.title,
    orderIndex: chapter.order_index,
    updatedAt: chapter.updated_at
  };
};

/**
 * 4. Sắp xếp lại thứ tự chương học hàng loạt (Batch Reorder trong Database Transaction)
 */
export const reorderChapters = async (courseId, chapterIds, currentUser) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }

  const isOwner = course.owner_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError('Bạn không có quyền sắp xếp lại chương học của khóa này', 403, 'Forbidden');
  }
  assertCourseEditable(course);

  const existingChapters = await Chapter.findAll({
    where: { course_id: courseId }
  });

  // Phải gửi đủ và đúng toàn bộ chương của khóa, nếu không order_index sẽ bị trùng
  const existingIds = new Set(existingChapters.map(c => c.id));
  if (existingIds.size !== chapterIds.length || chapterIds.some(id => !existingIds.has(id))) {
    throw new AppError('Danh sách chương sắp xếp không khớp với khóa học', 400, 'Bad Request');
  }

  await sequelize.transaction(async (t) => {
    for (let i = 0; i < chapterIds.length; i++) {
      await Chapter.update(
        { order_index: i + 1 },
        { where: { id: chapterIds[i], course_id: courseId }, transaction: t }
      );
    }
  });

  return true;
};

/**
 * 5. Xóa chương học (Cascade xóa các bài học bên trong)
 */
export const deleteChapter = async (chapterId, currentUser) => {
  const chapter = await Chapter.findByPk(chapterId, {
    include: [{ model: Course, attributes: ['id', 'owner_id', 'status'] }]
  });

  if (!chapter) {
    throw new AppError('Không tìm thấy chương học', 404, 'Not Found');
  }

  const isOwner = chapter.course && chapter.course.owner_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError('Bạn không có quyền xóa chương học này', 403, 'Forbidden');
  }
  assertCourseEditable(chapter.course);

  await chapter.destroy();
  return true;
};

export default {
  getChapters,
  createChapter,
  updateChapter,
  reorderChapters,
  deleteChapter
};
