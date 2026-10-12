/**
 * Migration 13/10/2026 cho module Bài tập (api-assignments.md):
 *   - assignments.lesson_id: UNIQUE chỉ trong bài tập chưa xóa mềm -> xóa xong tạo lại được cho cùng bài học.
 *   - assignment_submissions.resubmission_reason / resubmission_requested_at: lưu lý do GV yêu cầu nộp lại
 *     riêng với `feedback` và GIỮ điểm cũ (grading-policy.md E3: bài bị yêu cầu nộp lại dùng điểm lần chấm gần nhất).
 * Idempotent — chạy lại nhiều lần không lỗi. Không dùng sequelize.sync({ alter: true }).
 *
 * Chạy: npm run db:migrate:assignments  (trong thư mục backend/)
 */
import { DataTypes } from 'sequelize';
import models from '../../models/index.js';
import { dropFullUnique, createPartialUnique, runMigration } from './helpers.js';

const { sequelize } = models;

async function migrate() {
  await dropFullUnique('assignments', ['lesson_id']);
  await createPartialUnique('assignments', 'uq_assignments_lesson', ['lesson_id']);

  const qi = sequelize.getQueryInterface();
  const columns = await qi.describeTable('assignment_submissions');
  if (!columns.resubmission_reason) {
    await qi.addColumn('assignment_submissions', 'resubmission_reason', { type: DataTypes.TEXT, allowNull: true });
    console.log('✅ Đã thêm cột assignment_submissions.resubmission_reason');
  }
  if (!columns.resubmission_requested_at) {
    await qi.addColumn('assignment_submissions', 'resubmission_requested_at', { type: DataTypes.DATE, allowNull: true });
    console.log('✅ Đã thêm cột assignment_submissions.resubmission_requested_at');
  }
}

runMigration('assignments', migrate);
