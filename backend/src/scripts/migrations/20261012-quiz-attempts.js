/**
 * Migration 12/10/2026 cho module Bài kiểm tra (api-quizzes.md):
 *   - quiz_attempt_answers.selected_option_ids (uuid[]): lưu NHIỀU lựa chọn cho câu multiple_choice.
 *     Cột cũ selected_option_id (1 lựa chọn) giữ lại, chứa lựa chọn đầu tiên để tương thích.
 *   - quizzes.lesson_id: UNIQUE chỉ trong đề chưa xóa mềm -> xóa đề xong tạo lại được cho cùng bài học.
 * Idempotent — chạy lại nhiều lần không lỗi. Không dùng sequelize.sync({ alter: true }).
 *
 * Chạy: npm run db:migrate:quizzes  (trong thư mục backend/)
 */
import { DataTypes } from 'sequelize';
import models from '../../models/index.js';
import { dropFullUnique, createPartialUnique, runMigration } from './helpers.js';

const { sequelize } = models;

async function migrate() {
  const qi = sequelize.getQueryInterface();

  const columns = await qi.describeTable('quiz_attempt_answers');
  if (!columns.selected_option_ids) {
    await qi.addColumn('quiz_attempt_answers', 'selected_option_ids', {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      defaultValue: []
    });
    await sequelize.query(`
      UPDATE quiz_attempt_answers SET selected_option_ids = ARRAY[selected_option_id]
      WHERE selected_option_id IS NOT NULL AND cardinality(selected_option_ids) = 0
    `);
    console.log('✅ Đã thêm cột quiz_attempt_answers.selected_option_ids');
  } else {
    console.log('ℹ️  Cột quiz_attempt_answers.selected_option_ids đã tồn tại, bỏ qua');
  }

  await dropFullUnique('quizzes', ['lesson_id']);
  await createPartialUnique('quizzes', 'uq_quizzes_lesson', ['lesson_id']);
}

runMigration('quiz-attempts', migrate);
