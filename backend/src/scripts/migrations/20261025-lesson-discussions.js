/**
 * Migration 25/10/2026: thêm bảng `lesson_discussions` (Thảo luận / Hỏi đáp trong bài học, docs/api/api-discussions.md).
 * Idempotent — chạy lại nhiều lần không lỗi. Chỉ tạo 1 bảng mới, không đụng bảng cũ
 * và không dùng sequelize.sync({ alter: true }).
 *
 * Chạy: npm run db:migrate:discussions  (trong thư mục backend/)
 */
import models from '../../models/index.js';
import { runMigration } from './helpers.js';

const { LessonDiscussion } = models;

async function migrate() {
  await LessonDiscussion.sync(); // CREATE TABLE IF NOT EXISTS + index
  console.log('✅ Bảng lesson_discussions đã sẵn sàng');
}

runMigration('lesson-discussions', migrate);
