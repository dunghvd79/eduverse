import { Op } from 'sequelize';
import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import { assertCategoryAssignable } from './categoryService.js';

const { Course, Category, Chapter, Lesson, LessonProgress, User, Quiz, Assignment } = models;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Khóa học chưa published chỉ chủ sở hữu, Quản lý đào tạo và Admin được xem
 */
export const assertCourseVisible = (course, currentUser) => {
  if (course.status === 'published') return;
  const isOwner = currentUser && course.owner_id === currentUser.id;
  const isStaff = currentUser && (currentUser.role === 'training_manager' || currentUser.role === 'admin');
  if (!isOwner && !isStaff) {
    throw new AppError('Khóa học chưa được công khai', 403, 'Forbidden');
  }
};

/**
 * Khóa chỉnh sửa nội dung khi khóa học đang chờ duyệt hoặc đã công khai,
 * để nội dung học viên nhìn thấy luôn là nội dung đã được Quản lý đào tạo phê duyệt.
 * Chỉ chỉnh sửa được ở trạng thái draft hoặc rejected.
 */
export const assertCourseEditable = (course) => {
  if (course.status === 'pending') {
    throw new AppError('Khóa học đang chờ duyệt nên không thể chỉnh sửa. Vui lòng chờ Quản lý đào tạo phản hồi.', 409, 'Conflict');
  }
  if (course.status === 'published') {
    throw new AppError('Khóa học đã được công khai nên không thể chỉnh sửa nội dung.', 409, 'Conflict');
  }
};

const CATEGORY_ATTRIBUTES = ['id', 'name', 'slug'];
const mapCategoryRef = (category) => (category ? { id: category.id, name: category.name, slug: category.slug } : null);

/**
 * 1. Lấy danh sách khóa học (Phân trang, Tìm kiếm, Lọc trạng thái, Phân quyền)
 */
export const getCourses = async (query = {}, currentUser = null) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const { search, status, categoryId, category, mine, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

  const whereClause = {};

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

  // 2b. Chỉ lấy khóa học của chính mình (trang "Khóa học của tôi" của giảng viên)
  if (mine && currentUser) {
    delete whereClause[Op.or];
    whereClause.owner_id = currentUser.id;
    if (status) whereClause.status = status;
    else delete whereClause.status;
  }

  // 3. Lọc theo danh mục (id hoặc slug)
  if (categoryId) {
    whereClause.category_id = categoryId;
  }
  const categoryInclude = {
    model: Category,
    as: 'category',
    attributes: CATEGORY_ATTRIBUTES,
    ...(category ? { where: { slug: category }, required: true } : {})
  };

  // 4. Sắp xếp
  const orderColumn = ['createdAt', 'created_at'].includes(sortBy) ? 'created_at' : (sortBy === 'price' ? 'price' : 'title');
  const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await Course.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'full_name', 'email', 'avatar_url']
      },
      categoryInclude,
      {
        model: Chapter,
        attributes: ['id'],
        include: [{ model: Lesson, attributes: ['id'] }]
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
      category: mapCategoryRef(plain.category),
      owner: plain.owner ? {
        id: plain.owner.id,
        fullName: plain.owner.full_name,
        email: plain.owner.email,
        avatarUrl: plain.owner.avatar_url
      } : null,
      totalChapters: chapters.length,
      totalLessons,
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
      { model: Category, as: 'category', attributes: CATEGORY_ATTRIBUTES },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'full_name', 'email']
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
    category: mapCategoryRef(plain.category),
    owner: plain.owner ? {
      id: plain.owner.id,
      fullName: plain.owner.full_name,
      email: plain.owner.email,
      avatarUrl: plain.owner.avatar_url,
      bio: plain.owner.bio
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
            // Không lấy content_text/video_url: đề cương là API công khai, nội dung chỉ trả qua GET /lessons/:id (có kiểm tra ghi danh)
            attributes: ['id', 'chapter_id', 'title', 'lesson_type', 'order_index', 'created_at'],
            include: [
              { model: Quiz, attributes: ['id'] },
              { model: Assignment, attributes: ['id'] }
            ]
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
  if (classId && currentUser && currentUser.role === 'student') {
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
      quizId: lesson.quiz?.id || null,
      assignmentId: lesson.assignment?.id || null,
      isCompleted: classId ? !!progressMap[lesson.id] : undefined
    }))
  }));

  return {
    courseId: plain.id,
    title: plain.title,
    slug: plain.slug,
    status: plain.status,
    rejectionReason: plain.rejection_reason,
    chapters
  };
};

/**
 * 4. Tạo khóa học mới (Khởi tạo draft)
 */
export const createCourse = async (data, ownerId) => {
  const { title, description, thumbnailUrl, categoryId = null, price = 0 } = data;

  await assertCategoryAssignable(categoryId);
  const slug = await generateUniqueSlug(title, Course);

  const course = await Course.create({
    owner_id: ownerId,
    title: title.trim(),
    slug,
    description: description ? description.trim() : null,
    thumbnail_url: thumbnailUrl || null,
    category_id: categoryId,
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
  assertCourseEditable(course);

  // Chỉ kiểm tra khi đổi danh mục: giữ nguyên danh mục cũ (kể cả đã bị ẩn) vẫn hợp lệ
  if (data.categoryId !== undefined && data.categoryId !== course.category_id) {
    await assertCategoryAssignable(data.categoryId);
    course.category_id = data.categoryId;
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
  // Giảng viên không được xóa khóa đang chờ duyệt/đã công khai; Admin vẫn xóa được để kiểm duyệt
  if (!isAdmin) assertCourseEditable(course);

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
