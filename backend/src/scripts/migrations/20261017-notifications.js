/**
 * Migration 17/10/2026: thêm bảng `notifications` (thông báo trong ứng dụng, docs/api/api-notifications.md).
 * Idempotent — chạy lại nhiều lần không lỗi. Chỉ tạo 1 bảng mới, không đụng bảng cũ
 * và không dùng sequelize.sync({ alter: true }).
 *
 * Chạy: npm run db:migrate:notifications  (trong thư mục backend/)
 */
import models from '../../models/index.js';
import { runMigration } from './helpers.js';

const { Notification } = models;

async function migrate() {
  await Notification.sync(); // CREATE TABLE IF NOT EXISTS + index
  console.log('✅ Bảng notifications đã sẵn sàng');
}

runMigration('notifications', migrate);
