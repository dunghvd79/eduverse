import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';

const { sequelize, Chapter, Course, Lesson, LessonProgress, ClassModel, Enrollment } = models;

const requireCourseAccessForRead = async (course, currentUser = null) => {
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }

  if (course.status === 'published') {
    return;
  }

  if (!currentUser) {
    throw new AppError('Khóa học chưa được công khai', 403, 'Forbidden');
  }

  const isOwner = course.owner_id === currentUser.id;
  const isStaff = currentUser.role === 'training_manager' || currentUser.role === 'admin';
  if (!isOwner && !isStaff) {
    throw new AppError('Khóa học chưa được công khai', 403, 'Forbidden');
  }
};

const requireCoursePermission = (course, currentUser) => {
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }

  const isOwner = course.owner_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError('Bạn không có quyền thao tác trên khóa học này', 403, 'Forbidden');
  }
};

export const getLessons = async (chapterId, currentUser = null) => {
  const chapter = await Chapter.findByPk(chapterId, {
    include: [{ model: Course, attributes: ['id', 'owner_id', 'status'] }, { model: Lesson, order: [['order_index', 'ASC']] }]
  });

  if (!chapter) {
    throw new AppError('Không tìm thấy chương học', 404, 'Not Found');
  }

  await requireCourseAccessForRead(chapter.course, currentUser);

  return (chapter.lessons || []).map(lesson => ({
    id: lesson.id,
    chapterId: lesson.chapter_id,
    title: lesson.title,
    lessonType: lesson.lesson_type,
    contentText: lesson.content_text,
    videoUrl: lesson.video_url,
    orderIndex: lesson.order_index,
    createdAt: lesson.created_at,
    updatedAt: lesson.updated_at
  }));
};

export const getLessonById = async (lessonId, currentUser = null) => {
  const lesson = await Lesson.findByPk(lessonId, {
    include: [{
      model: Chapter,
      include: [{ model: Course, attributes: ['id', 'title', 'owner_id', 'status'] }]
    }]
  });

  if (!lesson) {
    throw new AppError('Không tìm thấy bài học', 404, 'Not Found');
  }

  await requireCourseAccessForRead(lesson.chapter?.course, currentUser);

  return {
    id: lesson.id,
    chapterId: lesson.chapter_id,
    chapterTitle: lesson.chapter?.title || null,
    courseId: lesson.chapter?.course?.id || null,
    courseTitle: lesson.chapter?.course?.title || null,
    title: lesson.title,
    lessonType: lesson.lesson_type,
    contentText: lesson.content_text,
    videoUrl: lesson.video_url,
    orderIndex: lesson.order_index,
    createdAt: lesson.created_at,
    updatedAt: lesson.updated_at
  };
};

export const createLesson = async (chapterId, data, currentUser) => {
  const chapter = await Chapter.findByPk(chapterId, {
    include: [{ model: Course, attributes: ['id', 'owner_id', 'status'] }]
  });

  if (!chapter) {
    throw new AppError('Không tìm thấy chương học', 404, 'Not Found');
  }

  requireCoursePermission(chapter.course, currentUser);

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

  return {
    id: lesson.id,
    chapterId: lesson.chapter_id,
    title: lesson.title,
    lessonType: lesson.lesson_type,
    contentText: lesson.content_text,
    videoUrl: lesson.video_url,
    orderIndex: lesson.order_index,
    createdAt: lesson.created_at
  };
};

export const updateLesson = async (lessonId, data, currentUser) => {
  const lesson = await Lesson.findByPk(lessonId, {
    include: [{ model: Chapter, include: [{ model: Course, attributes: ['id', 'owner_id', 'status'] }] }]
  });

  if (!lesson) {
    throw new AppError('Không tìm thấy bài học', 404, 'Not Found');
  }

  requireCoursePermission(lesson.chapter?.course, currentUser);

  if (data.title !== undefined) {
    lesson.title = data.title.trim();
  }
  if (data.lessonType !== undefined) {
    lesson.lesson_type = data.lessonType;
  }
  if (data.contentText !== undefined) {
    lesson.content_text = data.contentText || null;
  }
  if (data.videoUrl !== undefined) {
    lesson.video_url = data.videoUrl || null;
  }
  if (data.orderIndex !== undefined) {
    lesson.order_index = data.orderIndex;
  }

  await lesson.save();

  return {
    id: lesson.id,
    chapterId: lesson.chapter_id,
    title: lesson.title,
    lessonType: lesson.lesson_type,
    contentText: lesson.content_text,
    videoUrl: lesson.video_url,
    orderIndex: lesson.order_index,
    updatedAt: lesson.updated_at
  };
};

export const reorderLessons = async (chapterId, lessonIds, currentUser) => {
  const chapter = await Chapter.findByPk(chapterId, {
    include: [{ model: Course, attributes: ['id', 'owner_id', 'status'] }]
  });

  if (!chapter) {
    throw new AppError('Không tìm thấy chương học', 404, 'Not Found');
  }

  requireCoursePermission(chapter.course, currentUser);

  const existingLessons = await Lesson.findAll({ where: { chapter_id: chapterId } });
  const existingIds = new Set(existingLessons.map(item => item.id));
  if (lessonIds.length !== existingLessons.length) {
    throw new AppError('Danh sách sắp xếp phải bao gồm toàn bộ bài học', 400, 'Bad Request');
  }
  for (const id of lessonIds) {
    if (!existingIds.has(id)) {
      throw new AppError(`Bài học ${id} không thuộc chương học này`, 400, 'Bad Request');
    }
  }

  await sequelize.transaction(async (t) => {
    for (let i = 0; i < lessonIds.length; i += 1) {
      await Lesson.update(
        { order_index: i + 1 },
        { where: { id: lessonIds[i], chapter_id: chapterId }, transaction: t }
      );
    }
  });

  return true;
};

export const deleteLesson = async (lessonId, currentUser) => {
  const lesson = await Lesson.findByPk(lessonId, {
    include: [{ model: Chapter, include: [{ model: Course, attributes: ['id', 'owner_id', 'status'] }] }]
  });

  if (!lesson) {
    throw new AppError('Không tìm thấy bài học', 404, 'Not Found');
  }

  requireCoursePermission(lesson.chapter?.course, currentUser);

  await lesson.destroy();
  return true;
};

export const updateLessonProgress = async (classId, lessonId, studentId, isCompleted) => {
  const lesson = await Lesson.findByPk(lessonId, {
    include: [{ model: Chapter, include: [{ model: Course, attributes: ['id', 'title'] }] }]
  });

  if (!lesson) {
    throw new AppError('Không tìm thấy bài học', 404, 'Not Found');
  }

  const classRecord = await ClassModel.findByPk(classId);
  if (!classRecord) {
    throw new AppError('Không tìm thấy lớp học', 404, 'Not Found');
  }

  if (classRecord.course_id !== lesson.chapter.course_id) {
    throw new AppError('Bài học không thuộc lớp học này', 400, 'Bad Request');
  }

  const enrollment = await Enrollment.findOne({
    where: {
      class_id: classId,
      student_id: studentId,
      status: 'active'
    }
  });

  if (!enrollment) {
    throw new AppError('Bạn chưa tham gia lớp học này', 403, 'Forbidden');
  }

  let progress = await LessonProgress.findOne({
    where: {
      class_id: classId,
      student_id: studentId,
      lesson_id: lessonId
    }
  });

  if (!isCompleted) {
    if (progress) {
      await progress.destroy();
    }
    return {
      id: progress?.id || null,
      classId,
      lessonId,
      studentId,
      isCompleted: false,
      completedAt: null
    };
  }

  if (!progress) {
    progress = await LessonProgress.create({
      class_id: classId,
      student_id: studentId,
      lesson_id: lessonId,
      is_completed: true,
      completed_at: new Date()
    });
  } else {
    progress.is_completed = true;
    progress.completed_at = new Date();
    await progress.save();
  }

  return {
    id: progress.id,
    classId: progress.class_id,
    lessonId: progress.lesson_id,
    studentId: progress.student_id,
    isCompleted: progress.is_completed,
    completedAt: progress.completed_at
  };
};

export default {
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  reorderLessons,
  deleteLesson,
  updateLessonProgress
};
