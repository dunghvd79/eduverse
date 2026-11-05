/**
 * Migration 05/11/2026: bỏ trạng thái hoàn thành của các bài quiz/bài tập do học viên tự đánh dấu (BR-016).
 * Trước đây API tiến độ không kiểm tra loại bài nên học viên tự đánh dấu được bài chưa làm, làm sai điểm Tiến độ.
 * Chỉ đổi dòng của bài quiz/bài tập mà học viên chưa đạt bài kiểm tra và chưa nộp bài trong lớp đó. Idempotent.
 *
 * Chạy: npm run db:migrate:fix-self-marked  (trong thư mục backend/)
 */
import { sequelize } from '../../config/database.js';
import { runMigration } from './helpers.js';

async function migrate() {
  const [, result] = await sequelize.query(`
    UPDATE lesson_progresses p
    SET is_completed = false
    FROM lessons l
    WHERE l.id = p.lesson_id
      AND p.is_completed
      AND l.lesson_type IN ('quiz', 'assignment')
      AND NOT EXISTS (
        SELECT 1 FROM quiz_attempts a
        JOIN class_quizzes cq ON cq.id = a.class_quiz_id
        JOIN quizzes z ON z.id = cq.quiz_id
        WHERE z.lesson_id = l.id AND a.student_id = p.student_id AND cq.class_id = p.class_id
          AND a.status IN ('completed', 'timed_out') AND a.score >= z.pass_score
      )
      AND NOT EXISTS (
        SELECT 1 FROM assignment_submissions b
        JOIN class_assignments ca ON ca.id = b.class_assignment_id
        JOIN assignments s ON s.id = ca.assignment_id
        WHERE s.lesson_id = l.id AND b.student_id = p.student_id AND ca.class_id = p.class_id
      )
  `);
  console.log(`✅ Đã bỏ hoàn thành ${result?.rowCount ?? 0} bài quiz/bài tập tự đánh dấu`);
}

runMigration('fix-self-marked-progress', migrate);
