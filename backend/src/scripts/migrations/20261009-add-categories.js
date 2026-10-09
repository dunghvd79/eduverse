/**
 * Migration 09/10/2026: thêm bảng `categories` và cột `courses.category_id`.
 * Idempotent — chạy lại nhiều lần không lỗi. Chỉ tác động tới 2 bảng này,
 * không dùng sequelize.sync({ alter: true }) cho toàn bộ CSDL.
 *
 * Chạy: npm run db:migrate:categories  (trong thư mục backend/)
 */
import { DataTypes } from 'sequelize';
import models from '../../models/index.js';
import { DEFAULT_CATEGORIES, SAMPLE_COURSE_SLUG, SAMPLE_COURSE_CATEGORY_SLUG } from '../data/defaultCategories.js';

const { sequelize, Category, Course } = models;

async function migrate() {
  const qi = sequelize.getQueryInterface();

  // 1. Bảng categories (CREATE TABLE IF NOT EXISTS + indexes)
  await Category.sync();
  console.log('✅ Bảng categories đã sẵn sàng');

  // 2. Cột courses.category_id + FK + index
  const courseColumns = await qi.describeTable('courses');
  if (!courseColumns.category_id) {
    await qi.addColumn('courses', 'category_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'categories', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
    console.log('✅ Đã thêm cột courses.category_id');
  } else {
    console.log('ℹ️  Cột courses.category_id đã tồn tại, bỏ qua');
  }

  const courseIndexes = await qi.showIndex('courses');
  if (!courseIndexes.some((idx) => idx.name === 'courses_category_id')) {
    await qi.addIndex('courses', ['category_id'], { name: 'courses_category_id' });
    console.log('✅ Đã tạo index courses_category_id');
  }

  // 3. Seed danh mục mặc định
  for (const data of DEFAULT_CATEGORIES) {
    await Category.findOrCreate({ where: { slug: data.slug }, defaults: data });
  }
  console.log(`✅ Đã nạp ${DEFAULT_CATEGORIES.length} danh mục mặc định`);

  // 4. Gán khóa học mẫu vào danh mục nếu chưa có
  const sampleCategory = await Category.findOne({ where: { slug: SAMPLE_COURSE_CATEGORY_SLUG } });
  const [updated] = await Course.update(
    { category_id: sampleCategory.id },
    { where: { slug: SAMPLE_COURSE_SLUG, category_id: null } }
  );
  if (updated) console.log('✅ Đã gán khóa học mẫu vào danh mục "Lập trình"');
}

migrate()
  .then(() => {
    console.log('🎉 Migration add-categories hoàn tất');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration thất bại:', err);
    process.exit(1);
  });
