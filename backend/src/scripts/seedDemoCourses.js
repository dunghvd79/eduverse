/**
 * Tạo 2 khóa học demo qua API thật (đi đúng quy tắc nghiệp vụ, có thông báo và nhật ký như người dùng thao tác):
 *   - "SQL Truy vấn dữ liệu": đã duyệt, có lớp, đã giao bài, student.dung@ ghi danh và chưa làm gì.
 *   - "Status code và bảo mật": đang Chờ duyệt, để tự tay duyệt lúc demo.
 * Cần backend đang chạy ở :5000. Chạy lại an toàn: khóa đã có (cùng tên, của teacher.an@) thì bỏ qua.
 *   node src/scripts/seedDemoCourses.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const API = 'http://localhost:5000/api/v1';
const SEED_PASS = 'EduVerse@2026';
const COVER_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'demo-covers');
const DAY_MS = 24 * 60 * 60 * 1000;

const call = async (method, url, token, body) => {
  const res = await fetch(API + url, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}: ${json.message} ${JSON.stringify(json.errors || '')}`);
  return json.data;
};

const login = async (email) => (await call('POST', '/auth/login', null, { email, password: SEED_PASS })).accessToken;

const COURSES = [
  {
    title: 'SQL Truy vấn dữ liệu',
    category: 'Cơ sở dữ liệu',
    cover: 'sql.png',
    publish: true,
    shortDescription: 'Viết câu lệnh SQL để lấy, lọc, sắp xếp và tổng hợp dữ liệu từ nhiều bảng.',
    description: `Khóa học dành cho người mới, giúp bạn tự truy vấn dữ liệu trong cơ sở dữ liệu quan hệ thay vì phải nhờ người khác trích xuất.

Bạn sẽ đi từ câu lệnh SELECT đơn giản đến lọc, sắp xếp, tổng hợp và kết nối nhiều bảng, với ví dụ xoay quanh dữ liệu sinh viên và điểm số.

Sau khóa học, bạn đọc hiểu được các câu truy vấn thường gặp và viết được báo cáo đơn giản bằng SQL.`,
    learningOutcomes: [
      'Hiểu bảng, dòng, cột và vai trò của SQL',
      'Lấy và lọc dữ liệu bằng SELECT, WHERE',
      'Sắp xếp và tổng hợp bằng ORDER BY, GROUP BY, HAVING',
      'Kết nối nhiều bảng bằng INNER JOIN, LEFT JOIN'
    ],
    requirements: ['Biết sử dụng máy tính cơ bản', 'Không cần biết lập trình trước'],
    chapter: 'Truy vấn dữ liệu cơ bản',
    theory: {
      title: 'SQL là gì và cấu trúc câu lệnh SELECT',
      contentText: `SQL (Structured Query Language) là ngôn ngữ dùng để làm việc với cơ sở dữ liệu quan hệ. Dữ liệu được lưu trong các bảng; mỗi dòng là một bản ghi, mỗi cột là một thuộc tính.

Câu lệnh quan trọng nhất là SELECT, dùng để lấy dữ liệu:

SELECT ten, diem
FROM sinh_vien
WHERE diem >= 8
ORDER BY diem DESC;

Ý nghĩa từng mệnh đề:
- SELECT: chọn các cột muốn lấy.
- FROM: chọn bảng chứa dữ liệu.
- WHERE: lọc các dòng theo điều kiện.
- ORDER BY: sắp xếp kết quả (ASC tăng dần, DESC giảm dần).

Muốn tổng hợp, dùng các hàm COUNT, SUM, AVG, MIN, MAX cùng GROUP BY:

SELECT lop, COUNT(*) AS si_so, AVG(diem) AS diem_tb
FROM sinh_vien
GROUP BY lop
HAVING AVG(diem) >= 7;

WHERE lọc từng dòng trước khi nhóm, còn HAVING lọc các nhóm sau khi đã GROUP BY.

Khi dữ liệu nằm ở nhiều bảng, dùng JOIN để kết nối:

SELECT sv.ten, l.ten_lop
FROM sinh_vien sv
INNER JOIN lop l ON l.id = sv.lop_id;

INNER JOIN chỉ trả về những dòng khớp ở cả hai bảng. LEFT JOIN giữ lại mọi dòng của bảng bên trái, kể cả khi không khớp.`
    },
    video: {
      title: 'Tự học SQL siêu tốc trong 30 phút',
      videoUrl: 'https://www.youtube.com/watch?v=SyQQmM43kmE',
      contentText: 'Video tổng hợp các kiến thức SQL cốt lõi cho người mới (nguồn: kênh Hỏi Dân IT).\nXem xong, bạn hãy thử viết lại các câu lệnh trong bài lý thuyết.'
    },
    quiz: {
      lessonTitle: 'Kiểm tra: Truy vấn SQL cơ bản',
      contentText: 'Bài kiểm tra 5 câu, làm trong 10 phút, được làm tối đa 2 lần. Đạt từ 5/10 điểm là hoàn thành bài học.',
      questions: [
        { content: 'Mệnh đề nào dùng để lọc các dòng theo điều kiện?', questionType: 'single_choice', choices: ['WHERE', 'ORDER BY', 'GROUP BY', 'FROM'], correct: [0], explanation: 'WHERE lọc từng dòng trước khi trả kết quả.' },
        { content: 'Câu lệnh nào sắp xếp sinh viên theo điểm từ cao xuống thấp?', questionType: 'single_choice', choices: ['SELECT * FROM sinh_vien ORDER BY diem ASC;', 'SELECT * FROM sinh_vien ORDER BY diem DESC;', 'SELECT * FROM sinh_vien GROUP BY diem;', 'SELECT * FROM sinh_vien WHERE diem DESC;'], correct: [1], explanation: 'DESC là giảm dần, ASC là tăng dần.' },
        { content: 'Những hàm nào là hàm tổng hợp trong SQL?', questionType: 'multiple_choice', choices: ['COUNT', 'SUM', 'AVG', 'UPPER'], correct: [0, 1, 2], explanation: 'UPPER là hàm xử lý chuỗi, không phải hàm tổng hợp.' },
        { content: 'HAVING dùng để lọc các nhóm sau khi đã GROUP BY.', questionType: 'true_false', choices: ['Đúng', 'Sai'], correct: [0], explanation: 'WHERE lọc dòng trước khi nhóm, HAVING lọc sau khi nhóm.' },
        { content: 'INNER JOIN trả về những dòng nào?', questionType: 'single_choice', choices: ['Mọi dòng của bảng bên trái', 'Mọi dòng của cả hai bảng', 'Chỉ những dòng khớp ở cả hai bảng', 'Chỉ những dòng không khớp'], correct: [2], explanation: 'Muốn giữ cả dòng không khớp của bảng trái thì dùng LEFT JOIN.' }
      ]
    },
    assignment: {
      lessonTitle: 'Thực hành: Viết truy vấn báo cáo điểm',
      contentText: 'Làm bài theo đề, nộp tệp PDF hoặc ZIP trước hạn.',
      title: 'Thực hành: Viết truy vấn báo cáo điểm',
      instruction: `Cho 2 bảng: sinh_vien(id, ten, lop_id, diem) và lop(id, ten_lop). Hãy viết các câu truy vấn:
1. Lấy tên và điểm của sinh viên có điểm từ 8 trở lên, sắp xếp giảm dần.
2. Đếm số sinh viên và tính điểm trung bình của từng lớp.
3. Chỉ hiện các lớp có điểm trung bình từ 7 trở lên.
4. Hiện tên sinh viên kèm tên lớp bằng JOIN.

Nộp 1 tệp PDF hoặc ZIP gồm câu lệnh và ảnh chụp kết quả.`
    },
    className: 'SQL Truy vấn dữ liệu — Lớp K2026'
  },
  {
    title: 'Status code và bảo mật',
    category: 'Lập trình',
    cover: 'status-code.png',
    publish: false,
    shortDescription: 'Hiểu mã trạng thái HTTP và dùng đúng để API rõ ràng, an toàn hơn.',
    description: `Khóa học giúp bạn hiểu ý nghĩa các mã trạng thái HTTP và cách dùng chúng đúng khi xây dựng API.

Bên cạnh đó, khóa học chỉ ra những lỗi bảo mật thường gặp liên quan đến phản hồi của máy chủ: lộ thông tin qua thông báo lỗi, nhầm lẫn giữa 401 và 403, thiếu giới hạn tần suất.

Sau khóa học, bạn thiết kế được phản hồi API vừa dễ dùng cho frontend, vừa không để lộ thông tin nhạy cảm.`,
    learningOutcomes: [
      'Phân biệt 5 nhóm mã trạng thái HTTP',
      'Chọn đúng mã cho từng tình huống của API',
      'Phân biệt 401 và 403, biết khi nào dùng 404 để che tài nguyên',
      'Không để lộ thông tin nhạy cảm qua thông báo lỗi'
    ],
    requirements: ['Biết cơ bản về web: trình duyệt, máy chủ, request và response'],
    chapter: 'Mã trạng thái HTTP và an toàn API',
    theory: {
      title: 'Mã trạng thái HTTP và ý nghĩa bảo mật',
      contentText: `Mỗi phản hồi HTTP đều kèm một mã trạng thái gồm 3 chữ số, cho biết yêu cầu đã được xử lý ra sao:
- 1xx: thông tin.
- 2xx: thành công. 200 OK, 201 Created (đã tạo mới), 204 No Content.
- 3xx: chuyển hướng. 301, 302.
- 4xx: lỗi phía người gửi. 400 sai dữ liệu, 401 chưa xác thực, 403 không có quyền, 404 không tìm thấy, 409 xung đột, 429 gửi quá nhiều yêu cầu.
- 5xx: lỗi phía máy chủ. 500, 502, 503.

Góc nhìn bảo mật:

1. Phân biệt 401 và 403. 401 nghĩa là hệ thống chưa biết bạn là ai (chưa đăng nhập hoặc token hết hạn). 403 nghĩa là đã biết bạn là ai nhưng bạn không có quyền.

2. Không để lộ thông tin qua thông báo lỗi. Với form đăng nhập, luôn trả cùng một thông báo "Email hoặc mật khẩu không chính xác", để kẻ tấn công không dò được email nào đã đăng ký.

3. Không trả chi tiết lỗi 500 cho người dùng. Stack trace, câu SQL, đường dẫn tệp chỉ ghi vào log phía máy chủ.

4. Có thể dùng 404 thay vì 403 để che sự tồn tại của tài nguyên riêng tư, ví dụ thông báo của người khác.

5. Dùng 429 cùng giới hạn tần suất để chống dò mật khẩu và gửi spam.`
    },
    video: {
      title: 'Status code: Trạng thái của request',
      videoUrl: 'https://www.youtube.com/watch?v=nn5Z0ezAcpw',
      contentText: 'Video giải thích status code và cách đọc trạng thái của một request (nguồn: kênh Hỏi Dân IT).\nKhi xem, hãy mở tab Network của trình duyệt để quan sát mã trạng thái thật.'
    },
    quiz: {
      lessonTitle: 'Kiểm tra: Status code và bảo mật',
      contentText: 'Bài kiểm tra 5 câu, làm trong 10 phút, được làm tối đa 2 lần. Đạt từ 5/10 điểm là hoàn thành bài học.',
      questions: [
        { content: 'Mã nào báo tài nguyên vừa được tạo mới thành công?', questionType: 'single_choice', choices: ['200', '201', '204', '301'], correct: [1], explanation: '201 Created thường dùng cho request POST tạo mới.' },
        { content: 'Người dùng chưa đăng nhập hoặc token đã hết hạn thì API nên trả mã nào?', questionType: 'single_choice', choices: ['400', '401', '403', '404'], correct: [1], explanation: '401 là chưa xác thực; 403 là đã xác thực nhưng không có quyền.' },
        { content: 'Những mã nào thuộc nhóm lỗi phía người gửi (4xx)?', questionType: 'multiple_choice', choices: ['400', '403', '429', '502'], correct: [0, 1, 2], explanation: '502 thuộc nhóm 5xx, là lỗi phía máy chủ.' },
        { content: 'Trả nguyên stack trace trong phản hồi lỗi 500 giúp hệ thống an toàn hơn.', questionType: 'true_false', choices: ['Đúng', 'Sai'], correct: [1], explanation: 'Stack trace làm lộ cấu trúc hệ thống, chỉ nên ghi vào log phía máy chủ.' },
        { content: 'Đăng nhập sai quá nhiều lần bị giới hạn tần suất thì API nên trả mã nào?', questionType: 'single_choice', choices: ['401', '403', '429', '503'], correct: [2], explanation: '429 Too Many Requests.' }
      ]
    },
    assignment: {
      lessonTitle: 'Thực hành: Thiết kế phản hồi API đăng nhập',
      contentText: 'Làm bài theo đề, nộp tệp PDF hoặc ZIP trước hạn.',
      title: 'Thực hành: Thiết kế phản hồi API đăng nhập',
      instruction: `Thiết kế phản hồi cho API POST /auth/login trong các tình huống sau, nêu rõ mã trạng thái và nội dung thông báo:
1. Đăng nhập thành công.
2. Sai email hoặc sai mật khẩu.
3. Tài khoản đang bị khóa.
4. Đăng nhập sai quá 5 lần trong 5 phút.
5. Máy chủ gặp lỗi kết nối cơ sở dữ liệu.

Giải thích ngắn gọn vì sao chọn như vậy dưới góc độ bảo mật. Nộp 1 tệp PDF hoặc ZIP.`
    }
  }
];

const uploadCover = async (token, courseId, fileName) => {
  const file = fs.readFileSync(path.join(COVER_DIR, fileName));
  const presign = await call('POST', '/uploads/presigned-url', token, {
    purpose: 'course_thumbnail', fileName, fileSize: file.length, contentType: 'image/png', contextId: courseId
  });
  const put = await fetch(presign.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: file });
  if (!put.ok) throw new Error(`Tải ảnh bìa thất bại: ${put.status}`);
  await call('PATCH', `/courses/${courseId}`, token, { thumbnailUrl: presign.publicUrl });
};

const createCourse = async (spec, teacher, categories) => {
  const category = categories.find((c) => c.name === spec.category);
  if (!category) throw new Error(`Không có danh mục "${spec.category}"`);
  const course = await call('POST', '/courses', teacher, {
    title: spec.title,
    description: spec.description,
    shortDescription: spec.shortDescription,
    level: 'beginner',
    learningOutcomes: spec.learningOutcomes,
    requirements: spec.requirements,
    categoryId: category.id,
    price: 0
  });
  await uploadCover(teacher, course.id, spec.cover);

  const chapter = await call('POST', `/courses/${course.id}/chapters`, teacher, { title: spec.chapter });
  const lessonsUrl = `/chapters/${chapter.id}/lessons`;
  await call('POST', lessonsUrl, teacher, { ...spec.theory, lessonType: 'theory' });
  await call('POST', lessonsUrl, teacher, { ...spec.video, lessonType: 'video' });
  const quizLesson = await call('POST', lessonsUrl, teacher, { title: spec.quiz.lessonTitle, contentText: spec.quiz.contentText, lessonType: 'quiz' });
  const assignmentLesson = await call('POST', lessonsUrl, teacher, { title: spec.assignment.lessonTitle, contentText: spec.assignment.contentText, lessonType: 'assignment' });

  const quiz = await call('POST', '/quizzes', teacher, {
    lessonId: quizLesson.id, title: spec.quiz.lessonTitle, durationMinutes: 10, maxAttempts: 2, passScore: 5, showAnswersAfterSubmit: true
  });
  for (const q of spec.quiz.questions) {
    await call('POST', `/quizzes/${quiz.id}/questions`, teacher, {
      content: q.content,
      questionType: q.questionType,
      points: 1,
      explanation: q.explanation,
      choices: q.choices.map((content, index) => ({ content, isCorrect: q.correct.includes(index) }))
    });
  }
  await call('PATCH', `/quizzes/${quiz.id}`, teacher, { isPublished: true });

  const assignment = await call('POST', '/assignments', teacher, {
    lessonId: assignmentLesson.id, title: spec.assignment.title, instruction: spec.assignment.instruction, allowedFileTypes: 'pdf,zip', maxFileSizeMb: 10
  });
  await call('POST', `/courses/${course.id}/publish-request`, teacher);
  return { course, quiz, assignment };
};

const openDemoClass = async (spec, { course, quiz, assignment }, teacher, manager, student) => {
  await call('PATCH', `/courses/${course.id}/approve`, manager);
  const now = Date.now();
  const toDate = (ms) => new Date(ms).toISOString().slice(0, 10);
  const cls = await call('POST', '/classes', teacher, {
    courseId: course.id, name: spec.className, startDate: toDate(now), endDate: toDate(now + 60 * DAY_MS)
  });
  await call('POST', '/classes/enroll', student, { classCode: cls.classCode });
  const deadline = new Date(now + 7 * DAY_MS).toISOString();
  await call('PUT', `/classes/${cls.id}/quizzes/${quiz.id}`, teacher, { openTime: new Date(now - 3600e3).toISOString(), closeTime: deadline, isActive: true });
  await call('PUT', `/classes/${cls.id}/assignments/${assignment.id}/schedule`, teacher, { openTime: new Date(now - 3600e3).toISOString(), deadline, allowLateSubmission: true });
  return cls;
};

const [teacher, manager, student] = await Promise.all([
  login('teacher.an@eduverse.com'), login('manager@eduverse.com'), login('student.dung@eduverse.com')
]);
const categoryData = await call('GET', '/categories');
const categories = Array.isArray(categoryData) ? categoryData : categoryData.items;
const mine = (await call('GET', '/courses?mine=true&limit=100', teacher)).items;

for (const spec of COURSES) {
  if (mine.some((c) => c.title === spec.title)) {
    console.log(`Bỏ qua "${spec.title}": đã có`);
    continue;
  }
  const created = await createCourse(spec, teacher, categories);
  if (spec.publish) {
    const cls = await openDemoClass(spec, created, teacher, manager, student);
    console.log(`Đã tạo "${spec.title}": công khai, lớp "${cls.name}", mã ${cls.classCode}`);
  } else {
    console.log(`Đã tạo "${spec.title}": đang chờ duyệt`);
  }
}
