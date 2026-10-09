import { Op } from 'sequelize';
import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { generateUniqueSlug } from '../utils/slugify.js';

const { Course, CourseCategory } = models;

const serializeCategory = async (category) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  description: category.description,
  sortOrder: category.sort_order,
  isActive: category.is_active,
  courseCount: await Course.count({ where: { category_id: category.id } }),
  createdAt: category.created_at,
  updatedAt: category.updated_at
});

export const getCategories = async ({ includeInactive = false } = {}) => {
  const categories = await CourseCategory.findAll({
    where: includeInactive ? {} : { is_active: true },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
  return Promise.all(categories.map(serializeCategory));
};

export const createCategory = async (data) => {
  const duplicateName = await CourseCategory.findOne({ where: { name: data.name.trim() } });
  if (duplicateName) {
    throw new AppError('Tên danh mục đã tồn tại', 409, 'Conflict');
  }
  const slug = await generateUniqueSlug(data.name, CourseCategory);
  const category = await CourseCategory.create({
    name: data.name.trim(),
    slug,
    description: data.description?.trim() || null,
    sort_order: data.sortOrder,
    is_active: data.isActive
  });
  return serializeCategory(category);
};

export const updateCategory = async (categoryId, data) => {
  const category = await CourseCategory.findByPk(categoryId);
  if (!category) {
    throw new AppError('Không tìm thấy danh mục khóa học', 404, 'Not Found');
  }

  if (data.name.trim() !== category.name) {
    const duplicateName = await CourseCategory.findOne({
      where: { name: data.name.trim(), id: { [Op.ne]: category.id } }
    });
    if (duplicateName) {
      throw new AppError('Tên danh mục đã tồn tại', 409, 'Conflict');
    }
    category.name = data.name.trim();
    category.slug = await generateUniqueSlug(category.name, CourseCategory, category.id);
  }
  if (data.description !== undefined) category.description = data.description?.trim() || null;
  if (data.sortOrder !== undefined) category.sort_order = data.sortOrder;
  if (data.isActive !== undefined) category.is_active = data.isActive;

  await category.save();
  return serializeCategory(category);
};

export const deleteCategory = async (categoryId) => {
  const category = await CourseCategory.findByPk(categoryId);
  if (!category) {
    throw new AppError('Không tìm thấy danh mục khóa học', 404, 'Not Found');
  }

  const courseCount = await Course.count({ where: { category_id: category.id } });
  if (courseCount > 0) {
    throw new AppError('Không thể xóa danh mục đang được sử dụng bởi khóa học', 409, 'Conflict');
  }

  await category.destroy();
  return true;
};

export default { getCategories, createCategory, updateCategory, deleteCategory };
