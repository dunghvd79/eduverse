/**
 * Migration 12/10/2026: chuyển ràng buộc UNIQUE của lớp học & ghi danh sang Partial Unique Index (api-classes.md mục 3).
 *   - classes.class_code: UNIQUE chỉ trong các lớp chưa xóa mềm -> lớp bị xóa giải phóng mã lớp
 *   - enrollments(class_id, student_id): UNIQUE chỉ trong bản ghi chưa xóa mềm -> học viên bị xóa khỏi lớp được thêm lại
 * Idempotent — chạy lại nhiều lần không lỗi. Không dùng sequelize.sync({ alter: true }).
 *
 * Chạy: npm run db:migrate:classes  (trong thư mục backend/)
 */
import { dropFullUnique, createPartialUnique, runMigration } from './helpers.js';

async function migrate() {
  await dropFullUnique('classes', ['class_code']);
  await createPartialUnique('classes', 'uq_classes_code_active', ['class_code']);

  await dropFullUnique('enrollments', ['class_id', 'student_id']);
  await createPartialUnique('enrollments', 'uq_enrollments_active', ['class_id', 'student_id']);
}

runMigration('classes-partial-unique', migrate);
