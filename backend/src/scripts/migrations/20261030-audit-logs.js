/**
 * Migration 30/10/2026: thêm bảng `audit_logs` (Nhật ký hệ thống, UC-ADMIN-005, docs/api/api-audit-logs.md).
 * Idempotent — chạy lại nhiều lần không lỗi. Chỉ tạo 1 bảng mới, không đụng bảng cũ
 * và không dùng sequelize.sync({ alter: true }).
 *
 * Chạy: npm run db:migrate:audit-logs  (trong thư mục backend/)
 */
import models from '../../models/index.js';
import { runMigration } from './helpers.js';

const { AuditLog } = models;

async function migrate() {
  await AuditLog.sync(); // CREATE TABLE IF NOT EXISTS + index
  console.log('✅ Bảng audit_logs đã sẵn sàng');
}

runMigration('audit-logs', migrate);
