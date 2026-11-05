/**
 * Migration 30/10/2026: thêm bảng `system_settings` (cài đặt nghiệp vụ trên trang Cài đặt hệ thống, docs/api/api-settings.md).
 * Idempotent — chạy lại nhiều lần không lỗi. Chỉ tạo 1 bảng mới, không đụng bảng cũ
 * và không dùng sequelize.sync({ alter: true }). Bảng trống = dùng giá trị mặc định trong settingsService.
 *
 * Chạy: npm run db:migrate:settings  (trong thư mục backend/)
 */
import models from '../../models/index.js';
import { runMigration } from './helpers.js';

const { SystemSetting } = models;

async function migrate() {
  await SystemSetting.sync(); // CREATE TABLE IF NOT EXISTS
  console.log('✅ Bảng system_settings đã sẵn sàng');
}

runMigration('settings', migrate);
