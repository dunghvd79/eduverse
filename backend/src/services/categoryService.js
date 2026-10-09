import { Op, fn, col } from 'sequelize';
import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { generateUniqueSlug } from '../utils/slugify.js';

const { sequelize, Category, Course } = models;

const isStaff = (user) => !!user && (user.role === 'training_manager' || user.role === 'admin');

const mapCategory = (category, courseCount = 0) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  description: category.description,
  sortOrder: category.sort_order,
  isActive: category.is_active,
  courseCount,
  createdAt: category.created_at,
  updatedAt: category.updated_at
});

/**
 * Đếm số khóa học theo danh mục. Khách/Học viên/Giảng viên chỉ đếm khóa published,
 * Quản lý & Admin đếm mọi khóa (để biết danh mục có đang được dùng hay không).
 */
const countCoursesByCategory = async (categoryIds, currentUser) => {
  if (categoryIds.length === 0) return {};
  const where = { category_id: { [Op.in]: categoryIds } };
  if (!isStaff(currentUser)) where.status = 'published';

  const rows = await Course.findAll({
    where,
    attributes: ['category_id', [fn('COUNT', col('id')), 'count']],
    group: ['category_id'],
    raw: true
  });
  return Object.fromEntries(rows.map((r) => [r.category_id, Number(r.count)]));
};

const assertNameAvailable = async (name, excludeId = null) => {
  const where = { name: { [Op.iLike]: name } };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  if (await Category.findOne({ where })) {
    throw new AppError('Tên danh mục đã tồn tại', 409, 'Conflict');
  }
};

/**
 * 1. Lấy danh sách danh mục
 * Mặc định chỉ trả danh mục đang hiển thị; Quản lý & Admin truyền includeHidden=true để xem cả danh mục ẩn.
 */
export const getCategories = async ({ includeHidden = false } = {}, currentUser = null) => {
  const where = {};
  if (!(includeHidden && isStaff(currentUser))) where.is_active = true;

  const categories = await Category.findAll({
    where,
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });

  const counts = await countCoursesByCategory(categories.map((c) => c.id), currentUser);
  return categories.map((c) => mapCategory(c, counts[c.id] || 0));
};

/**
 * 2. Tạo danh mục mới (thêm vào cuối danh sách nếu không truyền sortOrder)
 */
export const createCategory = async ({ name, description, sortOrder, isActive = true }) => {
  const trimmedName = name.trim();
  await assertNameAvailable(trimmedName);

  let order = sortOrder;
  if (order === undefined || order === null) {
    const maxOrder = await Category.max('sort_order');
    order = (Number.isFinite(maxOrder) ? maxOrder : 0) + 1;
  }

  const category = await Category.create({
    name: trimmedName,
    slug: await generateUniqueSlug(trimmedName, Category),
    description: description ? description.trim() : null,
    sort_order: order,
    is_active: isActive
  });

  return mapCategory(category, 0);
};

/**
 * 3. Cập nhật danh mục (đổi tên sẽ sinh lại slug)
 */
export const updateCategory = async (categoryId, data, currentUser) => {
  const category = await Category.findByPk(categoryId);
  if (!category) {
    throw new AppError('Không tìm thấy danh mục', 404, 'Not Found');
  }

  if (data.name !== undefined && data.name.trim() !== category.name) {
    const trimmedName = data.name.trim();
    await assertNameAvailable(trimmedName, category.id);
    category.name = trimmedName;
    category.slug = await generateUniqueSlug(trimmedName, Category, category.id);
  }
  if (data.description !== undefined) category.description = data.description ? data.description.trim() : null;
  if (data.sortOrder !== undefined) category.sort_order = data.sortOrder;
  if (data.isActive !== undefined) category.is_active = data.isActive;

  await category.save();

  const counts = await countCoursesByCategory([category.id], currentUser);
  return mapCategory(category, counts[category.id] || 0);
};

/**
 * 4. Sắp xếp lại thứ tự hiển thị (phải gửi đủ toàn bộ danh mục)
 */
export const reorderCategories = async (categoryIds) => {
  const existing = await Category.findAll({ attributes: ['id'] });
  const existingIds = new Set(existing.map((c) => c.id));
  if (existingIds.size !== categoryIds.length || categoryIds.some((id) => !existingIds.has(id))) {
    throw new AppError('Danh sách danh mục sắp xếp không khớp với dữ liệu hiện có', 400, 'Bad Request');
  }

  await sequelize.transaction(async (t) => {
    for (let i = 0; i < categoryIds.length; i++) {
      await Category.update({ sort_order: i + 1 }, { where: { id: categoryIds[i] }, transaction: t });
    }
  });

  return true;
};

/**
 * 5. Xóa danh mục — chặn nếu còn khóa học (kể cả khóa đã xóa mềm) đang tham chiếu
 */
export const deleteCategory = async (categoryId) => {
  const category = await Category.findByPk(categoryId);
  if (!category) {
    throw new AppError('Không tìm thấy danh mục', 404, 'Not Found');
  }

  const usedBy = await Course.count({ where: { category_id: categoryId }, paranoid: false });
  if (usedBy > 0) {
    throw new AppError(
      `Danh mục đang được ${usedBy} khóa học sử dụng (tính cả khóa học đã xóa). Hãy chuyển các khóa học sang danh mục khác hoặc ẩn danh mục thay vì xóa.`,
      409,
      'Conflict'
    );
  }

  await category.destroy();
  return true;
};

/**
 * Kiểm tra danh mục hợp lệ khi gán cho khóa học (dùng trong courseService)
 */
export const assertCategoryAssignable = async (categoryId) => {
  if (categoryId === null || categoryId === undefined) return;
  const category = await Category.findByPk(categoryId);
  if (!category) {
    throw new AppError('Danh mục khóa học không tồn tại', 400, 'Bad Request');
  }
  if (!category.is_active) {
    throw new AppError('Danh mục khóa học đang bị ẩn, vui lòng chọn danh mục khác', 400, 'Bad Request');
  }
};

export default {
  getCategories,
  createCategory,
  updateCategory,
  reorderCategories,
  deleteCategory,
  assertCategoryAssignable
};
