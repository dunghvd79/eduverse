import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';

const { sequelize, Course, Chapter, Lesson } = models;

const mapLesson = (lesson) => ({
  id: lesson.id,
  chapterId: lesson.chapter_id,
  title: lesson.title,
  lessonType: lesson.lesson_type,
  contentText: lesson.content_text,
  videoUrl: lesson.video_url,
  orderIndex: lesson.order_index,
  createdAt: lesson.created_at,
  updatedAt: lesson.updated_at
});

const getChapterWithCourse = async (chapterId) => {
  const chapter = await Chapter.findByPk(chapterId, {
    include: [{ model: Course, attributes: ['id', 'owner_id', 'status'] }]
  });

  if (!chapter) {
    throw new AppError('Không tìm thấy chương học', 404, 'Not Found');
  }

  return chapter;
};

const assertCanManageChapter = async (chapterId, currentUser) => {
  const chapter = await getChapterWithCourse(chapterId);
  const isOwner = chapter.course?.owner_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('Bạn không có quyền thao tác với chương học này', 403, 'Forbidden');
  }

  return chapter;
};

const assertCanManageLesson = async (lessonId, currentUser) => {
  const lesson = await Lesson.findByPk(lessonId, {
    include: [{
      model: Chapter,
      include: [{ model: Course, attributes: ['id', 'owner_id', 'status'] }]
    }]
  });

  if (!lesson) {
    throw new AppError('Không tìm thấy bài học', 404, 'Not Found');
  }

  const isOwner = lesson.chapter?.course?.owner_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('Bạn không có quyền thao tác với bài học này', 403, 'Forbidden');
  }

  return lesson;
};

export const getLessons = async (chapterId) => {
  const chapter = await Chapter.findByPk(chapterId);
  if (!chapter) {
    throw new AppError('Không tìm thấy chương học', 404, 'Not Found');
  }

  const lessons = await Lesson.findAll({
    where: { chapter_id: chapterId },
    order: [['order_index', 'ASC']]
  });

  return lessons.map(mapLesson);
};

export const getLessonById = async (lessonId) => {
  const lesson = await Lesson.findByPk(lessonId, {
    include: [{
      model: Chapter,
      include: [{ model: Course, attributes: ['id', 'title', 'owner_id', 'status'] }]
    }]
  });

  if (!lesson) {
    throw new AppError('Không tìm thấy bài học', 404, 'Not Found');
  }

  const data = mapLesson(lesson);
  data.course = lesson.chapter?.course ? {
    id: lesson.chapter.course.id,
    title: lesson.chapter.course.title,
    status: lesson.chapter.course.status
  } : null;

  return data;
};

export const createLesson = async (chapterId, data, currentUser) => {
  await assertCanManageChapter(chapterId, currentUser);

  let orderIndex = data.orderIndex;
  if (orderIndex === undefined || orderIndex === null) {
    const maxLesson = await Lesson.findOne({
      where: { chapter_id: chapterId },
      order: [['order_index', 'DESC']]
    });
    orderIndex = maxLesson ? maxLesson.order_index + 1 : 1;
  }

  const lesson = await Lesson.create({
    chapter_id: chapterId,
    title: data.title.trim(),
    lesson_type: data.lessonType || 'theory',
    content_text: data.contentText ?? null,
    video_url: data.videoUrl || null,
    order_index: orderIndex
  });

  return mapLesson(lesson);
};

export const updateLesson = async (lessonId, data, currentUser) => {
  const lesson = await assertCanManageLesson(lessonId, currentUser);

  if (data.title !== undefined) lesson.title = data.title.trim();
  if (data.lessonType !== undefined) lesson.lesson_type = data.lessonType;
  if (data.contentText !== undefined) lesson.content_text = data.contentText || null;
  if (data.videoUrl !== undefined) lesson.video_url = data.videoUrl || null;
  if (data.orderIndex !== undefined) lesson.order_index = data.orderIndex;

  await lesson.save();
  return mapLesson(lesson);
};

export const reorderLessons = async (chapterId, lessonIds, currentUser) => {
  await assertCanManageChapter(chapterId, currentUser);

  const existing = await Lesson.findAll({
    where: { chapter_id: chapterId },
    attributes: ['id']
  });

  const existingIds = new Set(existing.map(item => item.id));
  if (existingIds.size !== lessonIds.length || lessonIds.some(id => !existingIds.has(id))) {
    throw new AppError('Danh sách bài học sắp xếp không khớp với chương học', 400, 'Bad Request');
  }

  await sequelize.transaction(async (transaction) => {
    for (let index = 0; index < lessonIds.length; index += 1) {
      await Lesson.update(
        { order_index: index + 1 },
        { where: { id: lessonIds[index], chapter_id: chapterId }, transaction }
      );
    }
  });

  return true;
};

export const deleteLesson = async (lessonId, currentUser) => {
  const lesson = await assertCanManageLesson(lessonId, currentUser);
  await lesson.destroy();
  return true;
};

export default {
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  reorderLessons,
  deleteLesson
};
