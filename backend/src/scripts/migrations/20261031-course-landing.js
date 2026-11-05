/**
 * Migration 31/10/2026: thêm 4 cột cho trang giới thiệu khóa học (docs/api/api-courses.md mục 2.23, schema.md mục 3):
 * short_description, level, learning_outcomes, requirements. Đều cho phép NULL nên không ảnh hưởng dữ liệu cũ.
 * Idempotent (ADD COLUMN IF NOT EXISTS), không dùng sequelize.sync({ alter: true }).
 * Phải chạy TRƯỚC khi chạy code mới: model Course đọc các cột này, thiếu cột thì API khóa học báo lỗi.
 *
 * Chạy: npm run db:migrate:course-landing  (trong thư mục backend/)
 */
import { sequelize } from '../../config/database.js';
import { runMigration } from './helpers.js';

async function migrate() {
  await sequelize.query(`
    ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS short_description VARCHAR(160),
      ADD COLUMN IF NOT EXISTS level VARCHAR(20),
      ADD COLUMN IF NOT EXISTS learning_outcomes JSONB,
      ADD COLUMN IF NOT EXISTS requirements JSONB
  `);
  console.log('✅ Bảng courses đã có short_description, level, learning_outcomes, requirements');
}

runMigration('course-landing', migrate);
