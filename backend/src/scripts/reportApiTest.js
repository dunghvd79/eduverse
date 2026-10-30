/**
 * Kiểm thử API tự động phục vụ Chương 5 báo cáo.
 * Chạy khi backend đang chạy ở :5000 và ghi log ra tệp (để đọc mã OTP):
 *   node src/scripts/reportApiTest.js <đường dẫn log backend> [tệp kết quả JSON]
 *   node src/scripts/reportApiTest.js --cleanup   (chỉ dọn dữ liệu thử còn sót)
 * Mọi dữ liệu thử dùng email sec-test-*@example.com và bị xóa hẳn (force) khi kết thúc.
 */
import fs from 'fs';
import { sequelize } from '../models/index.js';
import { cleanupSecTest } from './secTestCleanup.js';

const API = 'http://localhost:5000/api/v1';
const LOG = process.argv[2];
const OUT = process.argv[3] || 'ket-qua-kiem-thu-api.json';
const STAMP = Date.now().toString(36);
const PASS = 'SecTest@2026';
const mail = (name) => `sec-test-${name}-${STAMP}@example.com`;

const results = [];
const call = async (method, url, token, body, headers = {}) => {
  const res = await fetch(url.startsWith('http') ? url : API + url, {
    method,
    headers: { ...(body !== undefined && !Buffer.isBuffer(body) ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : Buffer.isBuffer(body) ? body : JSON.stringify(body)
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, data: json?.data };
};
// Ghi nhận một ca kiểm thử: điều kiện đạt có thể là mã trạng thái hoặc hàm kiểm tra
const check = (id, group, name, expected, res, extra) => {
  const ok = typeof extra === 'function' ? res.status === expected && extra(res) : res.status === expected;
  results.push({ id, group, name, expected, actual: res.status, pass: ok, message: res.body?.message });
  console.log(`${ok ? 'ĐẠT ' : 'LỖI '} ${id} ${name} (mong đợi ${expected}, thực tế ${res.status}) ${ok ? '' : JSON.stringify(res.body).slice(0, 200)}`);
  return res;
};
const login = async (email, password = PASS) => (await call('POST', '/auth/login', null, { email, password })).data?.accessToken;
const readOtp = (email) => {
  const m = [...fs.readFileSync(LOG, 'utf8').matchAll(new RegExp(`cho ${email.replace(/[.+]/g, '\\$&')}: (\\d{6})`, 'g'))];
  return m.length ? m[m.length - 1][1] : null;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  const admin = await login('admin@eduverse.com', 'EduVerse@2026');
  const manager = await login('manager@eduverse.com', 'EduVerse@2026');

  // ---------- XÁC THỰC
  const stu = mail('student');
  check('TC01', 'Xác thực', 'Đăng ký với email sai định dạng', 400, await call('POST', '/auth/register', null, { email: 'khong-phai-email', password: PASS, fullName: 'Học viên thử' }));
  check('TC02', 'Xác thực', 'Đăng ký với mật khẩu yếu', 400, await call('POST', '/auth/register', null, { email: stu, password: '12345678', fullName: 'Học viên thử' }));
  check('TC03', 'Xác thực', 'Đăng ký hợp lệ', 201, await call('POST', '/auth/register', null, { email: stu, password: PASS, fullName: 'Học viên thử' }));
  check('TC04', 'Xác thực', 'Đăng nhập khi chưa xác thực email', 403, await call('POST', '/auth/login', null, { email: stu, password: PASS }), () => true);
  await sleep(300);
  const otp = readOtp(stu);
  check('TC05', 'Xác thực', 'Xác thực OTP sai', 400, await call('POST', '/auth/verify-otp', null, { email: stu, otp: otp === '000000' ? '111111' : '000000' }));
  const v = check('TC06', 'Xác thực', 'Xác thực OTP đúng, nhận access token', 200, await call('POST', '/auth/verify-otp', null, { email: stu, otp }), (r) => !!r.data?.accessToken);
  const S = v.data?.accessToken;
  check('TC07', 'Xác thực', 'Đăng nhập sai mật khẩu', 401, await call('POST', '/auth/login', null, { email: stu, password: 'SaiMatKhau@1' }));
  check('TC08', 'Xác thực', 'Gọi API cần đăng nhập khi không có token', 401, await call('GET', '/users/me'));
  check('TC09', 'Xác thực', 'Gọi API với token bị sửa chữ ký', 401, await call('GET', '/users/me', S.slice(0, -4) + 'abcd'));

  // ---------- TẠO GIẢNG VIÊN THỬ (quản trị viên cấp tài khoản, giảng viên đổi mật khẩu tạm)
  const makeTeacher = async (name) => {
    const email = mail(name);
    await call('POST', '/users', admin, { email, fullName: `Giảng viên thử ${name}`, role: 'teacher', password: 'TamThoi@2026' });
    const t = await login(email, 'TamThoi@2026');
    await call('PATCH', '/users/me/password', t, { currentPassword: 'TamThoi@2026', newPassword: PASS, confirmPassword: PASS });
    return login(email);
  };
  const T = await makeTeacher('teacher-a');
  const T2 = await makeTeacher('teacher-b');

  // ---------- PHÂN QUYỀN
  check('TC10', 'Phân quyền', 'Học viên gọi API tạo khóa học', 403, await call('POST', '/courses', S, { title: 'Khóa học không được phép' }));
  check('TC11', 'Phân quyền', 'Học viên gọi API danh sách người dùng (quản trị)', 403, await call('GET', '/users', S));

  // ---------- KHÓA HỌC
  const course = check('TC12', 'Khóa học', 'Giảng viên tạo khóa học', 201, await call('POST', '/courses', T, { title: 'Khóa học kiểm thử tự động', description: 'Dữ liệu kiểm thử, tự xóa' })).data;
  check('TC13', 'Khóa học', 'Gửi duyệt khi khóa học chưa có bài học', 400, await call('POST', `/courses/${course.id}/publish-request`, T));
  check('TC14', 'Phân quyền', 'Giảng viên khác sửa khóa học không thuộc mình', 403, await call('PATCH', `/courses/${course.id}`, T2, { title: 'Sửa trái phép khóa học' }));
  const chapter = (await call('POST', `/courses/${course.id}/chapters`, T, { title: 'Chương kiểm thử' })).data;
  const lesson = (await call('POST', `/chapters/${chapter.id}/lessons`, T, { title: 'Bài lý thuyết', lessonType: 'theory', contentText: 'Nội dung' })).data;
  const quizLesson = (await call('POST', `/chapters/${chapter.id}/lessons`, T, { title: 'Bài kiểm tra', lessonType: 'quiz' })).data;
  const asgLesson = (await call('POST', `/chapters/${chapter.id}/lessons`, T, { title: 'Bài tập', lessonType: 'assignment' })).data;
  const quiz = (await call('POST', '/quizzes', T, { lessonId: quizLesson.id, title: 'Bài kiểm tra tự động', durationMinutes: 15, maxAttempts: 1, passScore: 5, isPublished: true })).data;
  await call('POST', `/quizzes/${quiz.id}/questions`, T, { content: 'Câu một đáp án', questionType: 'single_choice', points: 1, choices: [{ content: 'Đúng', isCorrect: true }, { content: 'Sai' }] });
  await call('POST', `/quizzes/${quiz.id}/questions`, T, { content: 'Câu nhiều đáp án', questionType: 'multiple_choice', points: 1, choices: [{ content: 'A', isCorrect: true }, { content: 'B', isCorrect: true }, { content: 'C' }] });
  const asg = (await call('POST', '/assignments', T, { lessonId: asgLesson.id, title: 'Bài tập kiểm thử', instruction: 'Nộp tệp PDF', allowedFileTypes: 'pdf', maxFileSizeMb: 5 })).data;
  check('TC15', 'Khóa học', 'Gửi duyệt khi đã có chương và bài học', 200, await call('POST', `/courses/${course.id}/publish-request`, T));
  check('TC16', 'Khóa học', 'Sửa khóa học đang chờ duyệt', 409, await call('PATCH', `/courses/${course.id}`, T, { title: 'Đổi tên khi chờ duyệt' }));
  check('TC17', 'Khóa học', 'Học viên xem nội dung khóa học chưa công khai', 403, await call('GET', `/courses/${course.id}/chapters`, S));
  check('TC18', 'Khóa học', 'Quản lý đào tạo phê duyệt khóa học', 200, await call('PATCH', `/courses/${course.id}/approve`, manager));

  // ---------- LỚP HỌC
  const cls = check('TC19', 'Lớp học', 'Giảng viên mở lớp, hệ thống sinh mã tham gia', 201, await call('POST', '/classes', T, { courseId: course.id, name: 'Lớp kiểm thử tự động' }), (r) => !!r.data?.classCode).data;
  check('TC20', 'Lớp học', 'Ghi danh với mã lớp không tồn tại', 404, await call('POST', '/classes/enroll', S, { classCode: 'KHONGCO99' }));
  check('TC21', 'Lớp học', 'Ghi danh với mã lớp hợp lệ', 201, await call('POST', '/classes/enroll', S, { classCode: cls.classCode }));
  check('TC22', 'Lớp học', 'Ghi danh lại lớp đã tham gia', 409, await call('POST', '/classes/enroll', S, { classCode: cls.classCode }));

  // ---------- BÀI KIỂM TRA
  const now = Date.now();
  await call('PUT', `/classes/${cls.id}/quizzes/${quiz.id}`, T, { openTime: new Date(now - 3600e3).toISOString(), closeTime: new Date(now + 86400e3).toISOString(), isActive: true });
  const start = check('TC23', 'Bài kiểm tra', 'Bắt đầu làm bài, đề không chứa đáp án đúng', 201, await call('POST', `/quizzes/${quiz.id}/attempts?classId=${cls.id}`, S),
    (r) => !JSON.stringify(r.data?.questions || '').match(/isCorrect|is_correct/)).data;
  const qs = start.questions;
  const optsOf = (q) => q.choices || q.options || [];
  const single = qs.find((q) => q.questionType === 'single_choice');
  const multi = qs.find((q) => q.questionType === 'multiple_choice');
  // Câu một đáp án chọn đúng ("Đúng"); câu nhiều đáp án chỉ chọn 1 trong 2 đáp án đúng -> không đủ, tính sai. Điểm mong đợi 5.
  const answers = [
    { questionId: single.id, selectedChoiceIds: [optsOf(single).find((o) => o.content === 'Đúng').id] },
    { questionId: multi.id, selectedChoiceIds: [optsOf(multi).find((o) => o.content === 'A').id] }
  ];
  check('TC24', 'Bài kiểm tra', 'Chấm điểm: câu nhiều đáp án chọn thiếu bị tính sai (mong đợi 5/10)', 200,
    await call('POST', `/quiz-attempts/${start.attemptId}/submit`, S, { answers }), (r) => Number(r.data?.score) === 5);
  check('TC25', 'Bài kiểm tra', 'Nộp lại lượt làm đã nộp', 400, await call('POST', `/quiz-attempts/${start.attemptId}/submit`, S, { answers }));
  check('TC26', 'Bài kiểm tra', 'Bắt đầu lượt mới khi đã hết số lượt', 403, await call('POST', `/quizzes/${quiz.id}/attempts?classId=${cls.id}`, S));

  // ---------- BÀI TẬP
  const base = `/classes/${cls.id}/assignments/${asg.id}`;
  await call('PUT', `${base}/schedule`, T, { openTime: new Date(now - 3600e3).toISOString(), deadline: new Date(now + 86400e3).toISOString(), allowLateSubmission: false });
  check('TC27', 'Bài tập', 'Nộp tệp sai định dạng (.exe)', 400, await call('POST', `${base}/submissions/presigned-url`, S, { fileName: 'bai-lam.exe', fileSize: 1000, contentType: 'application/octet-stream' }));
  const file = Buffer.from('%PDF-1.4\n% bai lam kiem thu\n');
  const up = (await call('POST', `${base}/submissions/presigned-url`, S, { fileName: 'bai-lam.pdf', fileSize: file.length, contentType: 'application/pdf' })).data;
  await call('PUT', up.uploadUrl, null, file, { 'Content-Type': 'application/pdf' });
  const sub = check('TC28', 'Bài tập', 'Nộp tệp hợp lệ trong hạn', 201, await call('POST', `${base}/submissions`, S, { fileKey: up.fileKey, fileName: 'bai-lam.pdf', fileSize: file.length }),
    (r) => r.data?.status === 'submitted').data;
  check('TC29', 'Phân quyền', 'Giảng viên không phụ trách lớp chấm bài', 403, await call('PATCH', `/assignment-submissions/${sub.submissionId || sub.id}/grade`, T2, { grade: 10, feedback: 'Chấm trái phép' }));
  check('TC30', 'Bài tập', 'Giảng viên phụ trách chấm điểm và nhận xét', 200, await call('PATCH', `/assignment-submissions/${sub.submissionId || sub.id}/grade`, T, { grade: 8, feedback: 'Bài làm tốt' }));
  check('TC31', 'Bài tập', 'Học viên nộp lại sau khi đã được chấm', 403, await call('POST', `${base}/submissions/presigned-url`, S, { fileName: 'nop-lai.pdf', fileSize: file.length, contentType: 'application/pdf' }));

  // ---------- SỔ ĐIỂM
  // Nộp bài kiểm tra / bài tập tự đánh dấu hoàn thành 2/3 bài học -> P = 6,67.
  // Q = 5, A = 8 -> 0,4×5 + 0,5×8 + 0,1×6,67 = 6,67 (Khá)
  check('TC32', 'Sổ điểm', 'Điểm tổng kết theo công thức tỷ trọng (mong đợi 6,67 – Khá)', 200, await call('GET', `/classes/${cls.id}/my-grades`, S),
    (r) => Number(r.data?.me?.finalScore) === 6.67 && r.data?.me?.ranking === 'Khá');

  // ---------- GIỚI HẠN TẦN SUẤT (đăng nhập sai liên tiếp)
  let last;
  for (let i = 0; i < 6; i++) last = await call('POST', '/auth/login', null, { email: stu, password: `SaiMatKhau@${i}` });
  check('TC33', 'Bảo mật', 'Đăng nhập sai quá 5 lần trong 5 phút bị chặn', 429, last);
  void lesson;
};

const cleanup = cleanupSecTest;

if (LOG === '--cleanup') {
  await cleanup();
  await sequelize.close();
  process.exit(0);
}

try {
  await run();
} catch (error) {
  console.error('Dừng do lỗi:', error);
} finally {
  await cleanup().catch((e) => console.error('Lỗi khi dọn dữ liệu:', e));
  fs.writeFileSync(OUT, JSON.stringify({ runAt: new Date().toISOString(), total: results.length, passed: results.filter((r) => r.pass).length, results }, null, 2));
  console.log(`\nKết quả: ${results.filter((r) => r.pass).length}/${results.length} ca đạt -> ${OUT}`);
  await sequelize.close();
}
