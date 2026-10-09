import { Op } from 'sequelize';
import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { generateUniqueSlug } from '../utils/slugify.js';

const { Course, CourseCategory, Chapter, Lesson, LessonProgress, ClassModel, Enrollment, User } = models;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 1. Lấy danh sách khóa học (Phân trang, Tìm kiếm, Lọc trạng thái, Phân quyền)
 */
export const getCourses = async (query = {}, currentUser = null) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const { search, status, categoryId, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

  const whereClause = {};
  if (categoryId) whereClause.category_id = categoryId;

  // 1. Phân quyền xem theo trạng thái
  if (!currentUser || currentUser.role === 'student') {
    // Khách hoặc Học viên: CHỈ ĐƯỢC XEM published
    whereClause.status = 'published';
  } else if (currentUser.role === 'teacher') {
    // Giảng viên: Xem published của mọi người + các trạng thái khác của chính mình
    if (status) {
      if (status === 'published') {
        whereClause.status = 'published';
      } else {
        whereClause.status = status;
        whereClause.owner_id = currentUser.id;
      }
    } else {
      whereClause[Op.or] = [
        { status: 'published' },
        { owner_id: currentUser.id }
      ];
    }
  } else if (currentUser.role === 'training_manager' || currentUser.role === 'admin') {
    // Quản lý đào tạo & Admin: Xem được tất cả, lọc theo status nếu có truyền
    if (status) {
      whereClause.status = status;
    }
  }

  // 2. Tìm kiếm theo tiêu đề hoặc mô tả
  if (search && search.trim()) {
    const searchPattern = `%${search.trim()}%`;
    const searchCondition = {
      [Op.or]: [
        { title: { [Op.iLike]: searchPattern } },
        { description: { [Op.iLike]: searchPattern } }
      ]
    };
    whereClause[Op.and] = whereClause[Op.and] ? [...whereClause[Op.and], searchCondition] : [searchCondition];
  }

  // 3. Sắp xếp
  const orderColumn = sortBy === 'createdAt' ? 'created_at' : (sortBy === 'price' ? 'price' : 'title');
  const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await Course.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'full_name', 'email', 'avatar_url']
      },
      {
        model: CourseCategory,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: Chapter,
        attributes: ['id', 'order_index'],
        include: [{ model: Lesson, attributes: ['id', 'order_index'] }]
      }
    ],
    order: [[orderColumn, orderDirection]],
    limit,
    offset,
    distinct: true
  });

  const totalPages = Math.ceil(count / limit) || 1;

  const items = rows.map(course => {
    const plain = course.toJSON();
    const chapters = plain.chapters || [];
    const orderedChapters = [...chapters].sort((a, b) => a.order_index - b.order_index);
    const lessons = orderedChapters.flatMap((chapter) =>
      [...(chapter.lessons || [])].sort((a, b) => a.order_index - b.order_index)
    );
    const totalLessons = lessons.length;

    return {
      id: plain.id,
      title: plain.title,
      slug: plain.slug,
      description: plain.description,
      thumbnailUrl: plain.thumbnail_url,
      price: plain.price,
      status: plain.status,
      rejectionReason: plain.rejection_reason,
      owner: plain.owner ? {
        id: plain.owner.id,
        fullName: plain.owner.full_name,
        email: plain.owner.email,
        avatarUrl: plain.owner.avatar_url
      } : null,
      category: plain.category ? {
        id: plain.category.id,
        name: plain.category.name,
        slug: plain.category.slug
      } : null,
      totalChapters: chapters.length,
      totalLessons,
      firstLessonId: lessons[0]?.id || null,
      createdAt: plain.created_at,
      updatedAt: plain.updated_at
    };
  });

  return {
    items,
    meta: {
      page,
      limit,
      totalItems: count,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

/**
 * 2. Lấy thông tin chi tiết một khóa học (theo UUID hoặc slug)
 */
export const getCourseByIdOrSlug = async (idOrSlug, currentUser = null) => {
  const isUuid = UUID_REGEX.test(idOrSlug);
  const where = isUuid ? { id: idOrSlug } : { slug: idOrSlug };

  const course = await Course.findOne({
    where,
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'full_name', 'email', 'avatar_url', 'bio']
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'full_name', 'email']
      },
      {
        model: CourseCategory,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: Chapter,
        attributes: ['id'],
        include: [{ model: Lesson, attributes: ['id'] }]
      }
    ]
  });

  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }

  // Kiểm tra quyền xem nếu khóa học chưa published
  if (course.status !== 'published') {
    if (!currentUser) {
      throw new AppError('Khóa học chưa được công khai', 403, 'Forbidden');
    }
    const isOwner = course.owner_id === currentUser.id;
    const isStaff = currentUser.role === 'training_manager' || currentUser.role === 'admin';
    if (!isOwner && !isStaff) {
      throw new AppError('Khóa học chưa được công khai', 403, 'Forbidden');
    }
  }

  const plain = course.toJSON();
  const chapters = plain.chapters || [];
  const totalLessons = chapters.reduce((acc, ch) => acc + (ch.lessons ? ch.lessons.length : 0), 0);

  return {
    id: plain.id,
    title: plain.title,
    slug: plain.slug,
    description: plain.description,
    thumbnailUrl: plain.thumbnail_url,
    price: plain.price,
    status: plain.status,
    rejectionReason: plain.rejection_reason,
    approvedAt: plain.approved_at,
    owner: plain.owner ? {
      id: plain.owner.id,
      fullName: plain.owner.full_name,
      email: plain.owner.email,
      avatarUrl: plain.owner.avatar_url,
      bio: plain.owner.bio
    } : null,
    category: plain.category ? {
      id: plain.category.id,
      name: plain.category.name,
      slug: plain.category.slug
    } : null,
    approver: plain.approver ? {
      id: plain.approver.id,
      fullName: plain.approver.full_name
    } : null,
    totalChapters: chapters.length,
    totalLessons,
    createdAt: plain.created_at,
    updatedAt: plain.updated_at
  };
};

/**
 * 3. Lấy trọn vẹn cây đề cương khóa học (Course -> Chapters -> Lessons)
 * Hỗ trợ classId để tính tiến độ hoàn thành cho học viên
 */
export const getCourseCurriculum = async (courseId, { classId = null, currentUser = null } = {}) => {
  const isUuid = UUID_REGEX.test(courseId);
  const where = isUuid ? { id: courseId } : { slug: courseId };

  const course = await Course.findOne({
    where,
    include: [
      {
        model: Chapter,
        attributes: ['id', 'course_id', 'title', 'order_index'],
        include: [
          {
            model: Lesson,
            attributes: ['id', 'chapter_id', 'title', 'lesson_type', 'order_index', 'video_url', 'content_text', 'created_at']
          }
        ]
      }
    ],
    order: [
      [{ model: Chapter }, 'order_index', 'ASC'],
      [{ model: Chapter }, { model: Lesson }, 'order_index', 'ASC']
    ]
  });

  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }

  // Kiểm tra quyền xem
  if (course.status !== 'published') {
    if (!currentUser) {
      throw new AppError('Khóa học chưa được công khai', 403, 'Forbidden');
    }
    const isOwner = course.owner_id === currentUser.id;
    const isStaff = currentUser.role === 'training_manager' || currentUser.role === 'admin';
    if (!isOwner && !isStaff) {
      throw new AppError('Khóa học chưa được công khai', 403, 'Forbidden');
    }
  }

  // Map progress nếu có classId và studentId
  const progressMap = {};
  if (classId) {
    if (!currentUser) {
      throw new AppError('Vui lòng đăng nhập để xem tiến độ học tập', 401, 'Unauthorized');
    }
    if (currentUser.role !== 'student') {
      throw new AppError('Chỉ học viên mới được xem tiến độ học tập', 403, 'Forbidden');
    }

    const classRecord = await ClassModel.findByPk(classId);
    if (!classRecord || classRecord.course_id !== course.id) {
      throw new AppError('Lớp học không thuộc khóa học này', 400, 'Bad Request');
    }

    const enrollment = await Enrollment.findOne({
      where: { class_id: classId, student_id: currentUser.id, status: 'active' }
    });
    if (!enrollment) {
      throw new AppError('Bạn chưa tham gia lớp học này', 403, 'Forbidden');
    }

    const progressList = await LessonProgress.findAll({
      where: {
        class_id: classId,
        student_id: currentUser.id
      }
    });
    progressList.forEach(p => {
      progressMap[p.lesson_id] = p.is_completed;
    });
  }

  const plain = course.toJSON();
  const chapters = (plain.chapters || []).map(chapter => ({
    id: chapter.id,
    title: chapter.title,
    orderIndex: chapter.order_index,
    lessons: (chapter.lessons || []).map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      lessonType: lesson.lesson_type,
      orderIndex: lesson.order_index,
      videoUrl: lesson.video_url,
      contentText: lesson.content_text,
      isCompleted: classId ? !!progressMap[lesson.id] : undefined
    }))
  }));
  const totalLessons = chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
  const completedLessons = chapters.reduce(
    (total, chapter) => total + chapter.lessons.filter((lesson) => lesson.isCompleted).length,
    0
  );

  return {
    id: plain.id,
    courseId: plain.id,
    title: plain.title,
    slug: plain.slug,
    status: plain.status,
    rejectionReason: plain.rejection_reason,
    totalChapters: chapters.length,
    totalLessons,
    completedLessons,
    progressPercentage: totalLessons ? Number(((completedLessons / totalLessons) * 100).toFixed(1)) : 0,
    chapters
  };
};

/**
 * 4. Tạo khóa học mới (Khởi tạo draft)
 */
export const createCourse = async (data, ownerId) => {
  const { title, description, thumbnailUrl, categoryId, price = 0 } = data;
  if (categoryId) {
    const category = await CourseCategory.findByPk(categoryId);
    if (!category || !category.is_active) {
      throw new AppError('Danh mục khóa học không tồn tại hoặc đã bị ẩn', 400, 'Bad Request');
    }
  }

  const slug = await generateUniqueSlug(title, Course);

  const course = await Course.create({
    owner_id: ownerId,
    category_id: categoryId || null,
    title: title.trim(),
    slug,
    description: description ? description.trim() : null,
    thumbnail_url: thumbnailUrl || null,
    price: Number(price) || 0.00,
    status: 'draft'
  });

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnailUrl: course.thumbnail_url,
    categoryId: course.category_id,
    price: course.price,
    status: course.status,
    createdAt: course.created_at
  };
};

/**
 * 5. Cập nhật thông tin khóa học
 */
export const updateCourse = async (courseId, data, currentUser) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }

  const isOwner = course.owner_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError('Bạn không có quyền chỉnh sửa khóa học này', 403, 'Forbidden');
  }

  if (data.title && data.title.trim() !== course.title) {
    course.title = data.title.trim();
    course.slug = await generateUniqueSlug(course.title, Course, course.id);
  }
  if (data.description !== undefined) {
    course.description = data.description ? data.description.trim() : null;
  }
  if (data.thumbnailUrl !== undefined) {
    course.thumbnail_url = data.thumbnailUrl || null;
  }
  if (data.categoryId !== undefined) {
    if (data.categoryId) {
      const category = await CourseCategory.findByPk(data.categoryId);
      if (!category || !category.is_active) {
        throw new AppError('Danh mục khóa học không tồn tại hoặc đã bị ẩn', 400, 'Bad Request');
      }
    }
    course.category_id = data.categoryId || null;
  }
  if (data.price !== undefined) {
    course.price = Number(data.price) || 0.00;
  }

  await course.save();

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnailUrl: course.thumbnail_url,
    categoryId: course.category_id,
    price: course.price,
    status: course.status,
    updatedAt: course.updated_at
  };
};

/**
 * 6. Xóa mềm khóa học
 */
export const deleteCourse = async (courseId, currentUser) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }

  const isOwner = course.owner_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError('Bạn không có quyền xóa khóa học này', 403, 'Forbidden');
  }

  await course.destroy();
  return true;
};

/**
 * 7. Giảng viên gửi yêu cầu phê duyệt khóa học (draft/rejected -> pending)
 */
export const publishRequest = async (courseId, currentUser) => {
  const course = await Course.findByPk(courseId, {
    include: [
      {
        model: Chapter,
        include: [{ model: Lesson, attributes: ['id'] }]
      }
    ]
  });

  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }

  const isOwner = course.owner_id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError('Không có quyền thao tác trên khóa học này', 403, 'Forbidden');
  }

  if (course.status === 'pending') {
    throw new AppError('Khóa học đang trong hàng đợi chờ phê duyệt', 400, 'Bad Request');
  }
  if (course.status === 'published') {
    throw new AppError('Khóa học đã được công khai, không cần gửi duyệt lại', 400, 'Bad Request');
  }

  // Kiểm tra nội dung: phải có ít nhất 1 chương và 1 bài học
  const chapters = course.chapters || [];
  const totalLessons = chapters.reduce((acc, ch) => acc + (ch.lessons ? ch.lessons.length : 0), 0);

  if (chapters.length === 0 || totalLessons === 0) {
    throw new AppError('Khóa học chưa có bài học nào. Vui lòng tạo ít nhất 1 chương và 1 bài học trước khi gửi duyệt.', 400, 'Bad Request');
  }

  course.status = 'pending';
  await course.save();

  return {
    id: course.id,
    title: course.title,
    status: course.status,
    totalChapters: chapters.length,
    totalLessons
  };
};

/**
 * 8. Quản lý đào tạo phê duyệt khóa học (pending -> published)
 */
export const approveCourse = async (courseId, managerId) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }

  if (course.status !== 'pending') {
    throw new AppError('Chỉ có thể phê duyệt khóa học đang ở trạng thái pending', 400, 'Bad Request');
  }

  course.status = 'published';
  course.approved_by = managerId;
  course.approved_at = new Date();
  course.rejection_reason = null; // Xóa lý do từ chối nếu có từ trước
  await course.save();

  return {
    id: course.id,
    title: course.title,
    status: course.status,
    approvedBy: course.approved_by,
    approvedAt: course.approved_at
  };
};

/**
 * 9. Quản lý đào tạo từ chối phê duyệt khóa học (pending -> rejected kèm lý do)
 */
export const rejectCourse = async (courseId, managerId, reason) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', 404, 'Not Found');
  }

  if (course.status !== 'pending') {
    throw new AppError('Chỉ có thể từ chối khóa học đang ở trạng thái pending', 400, 'Bad Request');
  }

  course.status = 'rejected';
  course.rejection_reason = reason.trim();
  await course.save();

  return {
    id: course.id,
    title: course.title,
    status: course.status,
    rejectionReason: course.rejection_reason
  };
};

export default {
  getCourses,
  getCourseByIdOrSlug,
  getCourseCurriculum,
  createCourse,
  updateCourse,
  deleteCourse,
  publishRequest,
  approveCourse,
  rejectCourse
};
