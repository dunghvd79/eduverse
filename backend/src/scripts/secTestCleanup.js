/**
 * Xóa hẳn dữ liệu kiểm thử (tài khoản sec-test-*@example.com và mọi thứ chúng tạo ra) trên CSDL đang cấu hình.
 * Dùng chung cho reportApiTest.js và kiểm thử luồng chính qua giao diện (docs/testing/e2e_luong_chinh.py).
 *   node src/scripts/secTestCleanup.js
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { Op } from 'sequelize';
import { sequelize, User } from '../models/index.js';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

// Xóa tệp lưu cục bộ (chế độ không có S3) của khóa học/lớp thử: thư mục theo id hoặc tệp bắt đầu bằng "<id>_"
const removeLocalFiles = (subdir, ids) => {
  const dir = path.join(UPLOAD_ROOT, subdir);
  if (!ids.length || !fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (ids.some((id) => name === id || name.startsWith(`${id}_`))) {
      fs.rmSync(path.join(dir, name), { recursive: true, force: true });
    }
  }
};

export const cleanupSecTest = async () => {
  const users = await User.findAll({ where: { email: { [Op.like]: 'sec-test-%@example.com' } }, paranoid: false, attributes: ['id'] });
  const ids = users.map((u) => u.id);
  if (!ids.length) return console.log('Không có dữ liệu thử cần dọn');

  const select = (sql) => sequelize.query(sql, { replacements: { ids }, type: sequelize.QueryTypes.SELECT });
  const courseIds = (await select('SELECT id FROM courses WHERE owner_id IN (:ids)')).map((r) => r.id);
  const classIds = (await select(`SELECT id FROM classes WHERE teacher_id IN (:ids) OR course_id IN (SELECT id FROM courses WHERE owner_id IN (:ids))`)).map((r) => r.id);

  const q = (sql) => sequelize.query(sql, { replacements: { ids } });
  const courses = '(SELECT id FROM courses WHERE owner_id IN (:ids))';
  const classes = `(SELECT id FROM classes WHERE course_id IN ${courses} OR teacher_id IN (:ids))`;
  const lessons = `(SELECT l.id FROM lessons l JOIN chapters c ON c.id = l.chapter_id WHERE c.course_id IN ${courses})`;
  await sequelize.transaction(async () => {
    // Thông báo của tài khoản thử, và thông báo gửi tới tài khoản thật (vd. Quản lý được báo "khóa chờ duyệt") trỏ tới khóa/lớp thử
    const linked = [...courseIds, ...classIds];
    await sequelize.query(
      `DELETE FROM notifications WHERE user_id IN (:ids)${linked.length ? ' OR ' + linked.map((_, i) => `link LIKE :l${i}`).join(' OR ') : ''}`,
      { replacements: { ids, ...Object.fromEntries(linked.map((id, i) => [`l${i}`, `%${id}%`])) } }
    );
    await q(`DELETE FROM lesson_discussions WHERE author_id IN (:ids) OR class_id IN ${classes}`);
    await q(`DELETE FROM quiz_attempt_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE student_id IN (:ids) OR class_quiz_id IN (SELECT id FROM class_quizzes WHERE class_id IN ${classes}))`);
    await q(`DELETE FROM quiz_attempts WHERE student_id IN (:ids) OR class_quiz_id IN (SELECT id FROM class_quizzes WHERE class_id IN ${classes})`);
    await q(`DELETE FROM assignment_submissions WHERE student_id IN (:ids) OR class_assignment_id IN (SELECT id FROM class_assignments WHERE class_id IN ${classes})`);
    await q(`DELETE FROM class_quizzes WHERE class_id IN ${classes}`);
    await q(`DELETE FROM class_assignments WHERE class_id IN ${classes}`);
    await q(`DELETE FROM lesson_progresses WHERE student_id IN (:ids) OR class_id IN ${classes}`);
    await q(`DELETE FROM enrollments WHERE student_id IN (:ids) OR class_id IN ${classes}`);
    await q(`DELETE FROM classes WHERE id IN ${classes}`);
    await q(`DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE lesson_id IN ${lessons}))`);
    await q(`DELETE FROM questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE lesson_id IN ${lessons})`);
    await q(`DELETE FROM quizzes WHERE lesson_id IN ${lessons}`);
    await q(`DELETE FROM assignments WHERE lesson_id IN ${lessons}`);
    await q(`DELETE FROM course_materials WHERE lesson_id IN ${lessons}`);
    await q(`DELETE FROM lessons WHERE id IN ${lessons}`);
    await q(`DELETE FROM chapters WHERE course_id IN ${courses}`);
    await q(`DELETE FROM courses WHERE owner_id IN (:ids)`);
    await q(`DELETE FROM user_tokens WHERE user_id IN (:ids)`);
    await q(`DELETE FROM users WHERE id IN (:ids)`);
  });

  removeLocalFiles('private/assignments', classIds);
  removeLocalFiles('private/materials', courseIds);
  removeLocalFiles('public/thumbnails', courseIds);
  removeLocalFiles('public/avatars', ids);
  console.log(`Đã xóa dữ liệu thử của ${ids.length} tài khoản (${courseIds.length} khóa học, ${classIds.length} lớp)`);
};

// Chạy trực tiếp: node src/scripts/secTestCleanup.js
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await cleanupSecTest();
  } finally {
    await sequelize.close();
  }
}
