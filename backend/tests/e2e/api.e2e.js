/**
 * Kiểm thử API đầu-cuối chạy vào hệ thống đang hoạt động (hầu hết chỉ ĐỌC; riêng nhóm Thảo luận có ghi nhưng tự xóa ngay) — docs/testing/automated-tests.md.
 *
 * Cần hệ thống đang chạy với dữ liệu mẫu (docker compose up -d) rồi chạy:  npm run test:e2e
 * Biến môi trường tùy chọn:
 *   E2E_BASE_URL  địa chỉ hệ thống (mặc định http://localhost:8080; chạy npm run dev thì dùng http://localhost:5000)
 *   E2E_PASSWORD  mật khẩu 4 tài khoản mẫu (mặc định EduVerse@2026)
 *
 * Không đặt đuôi .test.js cho file này để `npm test` (unit test) không chạy nhầm khi hệ thống chưa bật.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import { rankingOf, round2, finalScoreOf } from '../../src/utils/grading.js';

const BASE_URL = (process.env.E2E_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const API = `${BASE_URL}/api/v1`;
const PASSWORD = process.env.E2E_PASSWORD || 'EduVerse@2026';

const ACCOUNTS = {
  admin: { email: 'admin@eduverse.com', role: 'admin' },
  manager: { email: 'manager@eduverse.com', role: 'training_manager' },
  teacher: { email: 'teacher.an@eduverse.com', role: 'teacher' },
  student: { email: 'student.dung@eduverse.com', role: 'student' }
};

const request = async (path, { method = 'GET', token, body, rawBody, headers = {} } = {}) => {
  const payload = rawBody ?? (body === undefined ? undefined : JSON.stringify(body));
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: payload
  });
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* phản hồi không phải JSON (ví dụ tệp tải về) */ }
  return { status: response.status, json, text, headers: response.headers };
};

const describeResponse = (res) => `HTTP ${res.status}: ${res.text.slice(0, 300)}`;

/** Phản hồi chuẩn Envelope (api-conventions.md): success, statusCode, timestamp, data hoặc error */
const expectOk = (res, status = 200) => {
  assert.equal(res.status, status, describeResponse(res));
  assert.equal(res.json.success, true);
  assert.equal(res.json.statusCode, status);
  assert.ok(res.json.timestamp, 'thiếu timestamp');
  return res.json.data;
};

const expectFail = (res, status) => {
  assert.equal(res.status, status, describeResponse(res));
  assert.equal(res.json.success, false);
  assert.equal(res.json.statusCode, status);
  assert.equal(typeof res.json.error, 'string');
  assert.equal(typeof res.json.message, 'string');
  return res.json;
};

const cookieValue = (res, name) => {
  const line = res.headers.getSetCookie().find((c) => c.startsWith(`${name}=`));
  return line ? { line, value: line.split(';')[0].slice(name.length + 1) } : null;
};

/**
 * Đọc tên các sheet trong tệp .xlsx (thực chất là ZIP): tìm "End of central directory", duyệt danh sách tệp,
 * giải nén xl/workbook.xml. Không cần thư viện ngoài.
 */
const sheetNamesOfXlsx = (buffer) => {
  let end = buffer.length - 22;
  while (end >= 0 && buffer.readUInt32LE(end) !== 0x06054b50) end -= 1;
  assert.ok(end >= 0, 'không phải tệp ZIP/xlsx');
  let offset = buffer.readUInt32LE(end + 16);
  for (let i = 0, count = buffer.readUInt16LE(end + 10); i < count; i += 1) {
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    if (name === 'xl/workbook.xml') {
      const start = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
      const data = buffer.subarray(start, start + compressedSize);
      const xml = (method === 0 ? data : inflateRawSync(data)).toString('utf8');
      return [...xml.matchAll(/<sheet\b[^>]*\bname="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return assert.fail('không thấy xl/workbook.xml trong tệp xlsx');
};

const sessions = {};

before(async () => {
  let health;
  try {
    health = await request('/health');
  } catch (error) {
    throw new Error(
      `Không kết nối được tới ${API}. Hãy bật hệ thống trước (docker compose up -d) hoặc đặt E2E_BASE_URL. Chi tiết: ${error.cause?.code || error.message}`
    );
  }
  assert.equal(health.status, 200, `Health check lỗi: ${describeResponse(health)}`);

  for (const [name, account] of Object.entries(ACCOUNTS)) {
    const res = await request('/auth/login', { method: 'POST', body: { email: account.email, password: PASSWORD } });
    assert.equal(
      res.status, 200,
      `Đăng nhập ${account.email} thất bại (${describeResponse(res)}). Cần chạy trên CSDL có dữ liệu mẫu; đổi mật khẩu thì đặt E2E_PASSWORD.`
    );
    sessions[name] = { token: res.json.data.accessToken, user: res.json.data.user };
  }
});

describe('Hệ thống', () => {
  it('GET /health trả 200 theo chuẩn Envelope', async () => {
    const data = expectOk(await request('/health'));
    assert.equal(typeof data.environment, 'string');
    assert.equal(typeof data.uptime, 'number');
  });

  it('đường dẫn không tồn tại trả 404 dạng JSON (không phải trang HTML)', async () => {
    const body = expectFail(await request('/khong-ton-tai'), 404);
    assert.equal(body.error, 'Not Found');
  });

  it('JSON gửi lên sai cú pháp trả 400 chứ không phải 500', async () => {
    const res = await request('/auth/login', { method: 'POST', rawBody: '{sai cu phap' });
    expectFail(res, 400);
  });
});

describe('Xác thực', () => {
  it('4 vai trò đăng nhập được, nhận Access Token và đúng vai trò', () => {
    for (const [name, account] of Object.entries(ACCOUNTS)) {
      assert.ok(sessions[name].token && sessions[name].token.length > 20, `${name}: thiếu accessToken`);
      assert.equal(sessions[name].user.role, account.role);
      assert.equal(sessions[name].user.email, account.email);
    }
  });

  it('phản hồi đăng nhập không lộ mật khẩu hay mã băm mật khẩu', () => {
    for (const { user } of Object.values(sessions)) {
      for (const key of ['password', 'passwordHash', 'password_hash']) {
        assert.equal(user[key], undefined, `user.${key} bị lộ`);
      }
    }
  });

  it('email không tồn tại trả 401 (không báo rõ sai email hay sai mật khẩu)', async () => {
    const res = await request('/auth/login', {
      method: 'POST', body: { email: `e2e-${randomUUID()}@example.com`, password: 'Sai@mat-khau1' }
    });
    expectFail(res, 401);
  });

  it('thiếu mật khẩu trả 400 kèm danh sách lỗi', async () => {
    const res = await request('/auth/login', { method: 'POST', body: { email: ACCOUNTS.student.email } });
    const body = expectFail(res, 400);
    assert.ok(Array.isArray(body.errors) && body.errors.length > 0, 'thiếu danh sách lỗi chi tiết');
  });

  it('Refresh Token nằm trong cookie HttpOnly, dùng được để cấp lại Access Token rồi đăng xuất', async () => {
    const login = await request('/auth/login', {
      method: 'POST', body: { email: ACCOUNTS.student.email, password: PASSWORD }
    });
    expectOk(login);
    const cookie = cookieValue(login, 'refreshToken');
    assert.ok(cookie, 'không có cookie refreshToken');
    assert.match(cookie.line, /HttpOnly/i);
    assert.equal(login.json.data.refreshToken, undefined, 'Refresh Token không được nằm trong body');

    const refreshed = await request('/auth/refresh-token', {
      method: 'POST', body: {}, headers: { Cookie: `refreshToken=${cookie.value}` }
    });
    const data = expectOk(refreshed);
    assert.equal(typeof data.accessToken, 'string');

    const rotated = cookieValue(refreshed, 'refreshToken');
    assert.ok(rotated, 'Refresh Token không được xoay vòng');
    const logout = await request('/auth/logout', {
      method: 'POST', body: {}, headers: { Cookie: `refreshToken=${rotated.value}` }
    });
    expectOk(logout);
  });
});

describe('Phân quyền (RBAC)', () => {
  it('không có token → 401', async () => {
    expectFail(await request('/users/me'), 401);
  });

  it('token bịa → 401', async () => {
    expectFail(await request('/users/me', { token: 'khong.phai.token' }), 401);
  });

  it('học viên không xem được danh sách người dùng (chỉ Admin) → 403', async () => {
    expectFail(await request('/users', { token: sessions.student.token }), 403);
  });

  it('Admin xem được danh sách người dùng → 200', async () => {
    expectOk(await request('/users', { token: sessions.admin.token }));
  });

  it('giảng viên không tạo được danh mục (chỉ Quản lý/Admin) → 403', async () => {
    const res = await request('/categories', { method: 'POST', token: sessions.teacher.token, body: { name: 'E2E không được tạo' } });
    expectFail(res, 403);
  });

  it('mỗi dashboard chỉ đúng vai trò mới vào được → 403 với vai trò khác', async () => {
    expectFail(await request('/dashboard/admin', { token: sessions.student.token }), 403);
    expectFail(await request('/dashboard/manager', { token: sessions.teacher.token }), 403);
    expectFail(await request('/dashboard/teacher', { token: sessions.student.token }), 403);
    expectFail(await request('/dashboard/student', { token: sessions.admin.token }), 403);
  });

  it('ID sai định dạng trả 400 chứ không phải 500', async () => {
    expectFail(await request('/notifications/khong-phai-uuid/read', { method: 'PATCH', token: sessions.student.token }), 400);
  });
});

describe('Hồ sơ cá nhân', () => {
  for (const [name, account] of Object.entries(ACCOUNTS)) {
    it(`GET /users/me của ${name} trả đúng tài khoản đang đăng nhập`, async () => {
      const data = expectOk(await request('/users/me', { token: sessions[name].token }));
      assert.equal(data.email, account.email);
      assert.equal(data.role, account.role);
      assert.equal(typeof data.id, 'string');
      assert.equal(data.passwordHash, undefined);
    });
  }
});

describe('Khóa học và danh mục công khai (khách)', () => {
  it('danh sách khóa học có phân trang theo Envelope', async () => {
    const data = expectOk(await request('/courses?limit=5'));
    assert.ok(Array.isArray(data.items));
    assert.ok(data.items.length <= 5);
    assert.equal(data.meta.page, 1);
    assert.equal(data.meta.limit, 5);
    assert.equal(typeof data.meta.totalItems, 'number');
    for (const item of data.items) {
      assert.equal(typeof item.id, 'string');
      assert.equal(typeof item.title, 'string');
    }
  });

  it('khách chỉ thấy khóa đã published, kể cả khi cố lọc trạng thái draft', async () => {
    for (const query of ['', '?status=draft', '?status=pending', '?status=rejected']) {
      const data = expectOk(await request(`/courses${query}`));
      for (const item of data.items) assert.equal(item.status, 'published', `lộ khóa ${item.status} với query "${query}"`);
    }
  });

  it('học viên cũng chỉ thấy khóa đã published', async () => {
    const data = expectOk(await request('/courses?status=draft', { token: sessions.student.token }));
    for (const item of data.items) assert.equal(item.status, 'published');
  });

  it('tham số phân trang sai bị chặn bằng 400', async () => {
    expectFail(await request('/courses?limit=abc'), 400);
    expectFail(await request('/courses?limit=101'), 400);
  });

  it('khóa học không tồn tại trả 404', async () => {
    expectFail(await request('/courses/khoa-hoc-khong-ton-tai-e2e'), 404);
  });

  it('danh sách danh mục trả mảng', async () => {
    const data = expectOk(await request('/categories'));
    assert.ok(Array.isArray(data));
  });
});

describe('Dashboard theo vai trò', () => {
  for (const name of Object.keys(ACCOUNTS)) {
    it(`dashboard của ${name} trả số liệu thống kê`, async () => {
      const data = expectOk(await request(`/dashboard/${name}`, { token: sessions[name].token }));
      assert.equal(typeof data.stats, 'object');
      assert.ok(data.stats !== null);
    });
  }
});

describe('Thông báo trong ứng dụng', () => {
  it('không đăng nhập → 401', async () => {
    expectFail(await request('/notifications/unread-count'), 401);
  });

  it('số thông báo chưa đọc là số nguyên không âm', async () => {
    const data = expectOk(await request('/notifications/unread-count', { token: sessions.student.token }));
    assert.ok(Number.isInteger(data.unreadCount) && data.unreadCount >= 0);
  });

  it('danh sách thông báo phân trang, kèm số chưa đọc', async () => {
    const data = expectOk(await request('/notifications?limit=5', { token: sessions.student.token }));
    assert.ok(Array.isArray(data.items) && data.items.length <= 5);
    assert.equal(typeof data.unreadCount, 'number');
    assert.equal(data.meta.page, 1);
  });

  it('limit vượt 50 bị chặn bằng 400', async () => {
    expectFail(await request('/notifications?limit=51', { token: sessions.student.token }), 400);
  });

  it('đánh dấu đã đọc thông báo không phải của mình (hoặc không tồn tại) → 404', async () => {
    expectFail(await request(`/notifications/${randomUUID()}/read`, { method: 'PATCH', token: sessions.student.token }), 404);
  });
});

describe('Bảng điểm lớp — công thức tính điểm trên dữ liệu thật (grading-policy.md)', () => {
  let classIds = [];

  before(async () => {
    // Lớp do chính giảng viên mẫu phụ trách (GET /classes trả cả lớp của giảng viên khác nên không dùng ở đây)
    const data = expectOk(await request('/classes/my-classes', { token: sessions.teacher.token }));
    const list = Array.isArray(data) ? data : data.items;
    classIds = list.map((cls) => cls.id).slice(0, 5);
  });

  it('học viên không xem được bảng điểm cả lớp → 403', async (t) => {
    if (classIds.length === 0) return t.skip('Giảng viên mẫu chưa có lớp nào');
    expectFail(await request(`/classes/${classIds[0]}/gradebook`, { token: sessions.student.token }), 403);
  });

  it('tỷ trọng cộng lại bằng 1, điểm trong thang 10, xếp loại khớp ngưỡng, tổng kết khớp công thức', async (t) => {
    if (classIds.length === 0) return t.skip('Giảng viên mẫu chưa có lớp nào');

    for (const classId of classIds) {
      const data = expectOk(await request(`/classes/${classId}/gradebook`, { token: sessions.teacher.token }));
      const { weights, rows, summary } = data;

      const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
      assert.ok(Math.abs(totalWeight - 1) < 1e-4, `tổng tỷ trọng ${totalWeight} khác 1`);
      assert.ok(weights.progress > 0, 'thiếu tỷ trọng Tiến độ');

      assert.equal(summary.totalStudents, rows.length);
      assert.equal(Object.values(summary.distribution).reduce((s, n) => s + n, 0), rows.length);

      for (const row of rows) {
        assert.ok(row.finalScore >= 0 && row.finalScore <= 10, `điểm ${row.finalScore} ngoài thang 10`);
        assert.ok(row.progressPercentage >= 0 && row.progressPercentage <= 100);
        assert.equal(row.ranking, rankingOf(row.finalScore));
        const recomputed = finalScoreOf({
          quizScores: row.quizScores,
          assignmentScores: row.assignmentScores,
          progressPercentage: row.progressPercentage
        }, weights);
        assert.equal(row.finalScore, recomputed, `${row.student.email}: server ${row.finalScore} ≠ công thức ${recomputed}`);
      }

      if (rows.length > 0) {
        assert.equal(summary.averageFinalScore, round2(rows.reduce((s, r) => s + r.finalScore, 0) / rows.length));
      }
    }
  });

  it('Quản lý đào tạo xem được bảng điểm của lớp đó, kết quả giống với giảng viên', async (t) => {
    if (classIds.length === 0) return t.skip('Giảng viên mẫu chưa có lớp nào');
    const asTeacher = expectOk(await request(`/classes/${classIds[0]}/gradebook`, { token: sessions.teacher.token }));
    const asManager = expectOk(await request(`/classes/${classIds[0]}/gradebook`, { token: sessions.manager.token }));
    assert.deepEqual(
      asManager.rows.map((r) => [r.student.id, r.finalScore, r.ranking]),
      asTeacher.rows.map((r) => [r.student.id, r.finalScore, r.ranking])
    );
  });

  it('xuất bảng điểm CSV trả tệp đính kèm', async (t) => {
    if (classIds.length === 0) return t.skip('Giảng viên mẫu chưa có lớp nào');
    const res = await request(`/classes/${classIds[0]}/grades/export-excel?format=csv`, { token: sessions.teacher.token });
    assert.equal(res.status, 200, describeResponse(res));
    assert.match(res.headers.get('content-type') || '', /csv/i);
    assert.match(res.headers.get('content-disposition') || '', /attachment/i);
    assert.ok(res.text.length > 0);
  });

  it('xuất bảng điểm Excel (.xlsx) có đủ 4 sheet: bảng điểm, thống kê lớp, tiến độ học, quy tắc', async (t) => {
    if (classIds.length === 0) return t.skip('Giảng viên mẫu chưa có lớp nào');
    const response = await fetch(`${API}/classes/${classIds[0]}/grades/export-excel?format=xlsx`, {
      headers: { Authorization: `Bearer ${sessions.teacher.token}` }
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /spreadsheetml/i);
    assert.match(response.headers.get('content-disposition') || '', /\.xlsx/i);
    const buffer = Buffer.from(await response.arrayBuffer());
    assert.deepEqual(sheetNamesOfXlsx(buffer), ['Bảng điểm', 'Thống kê lớp', 'Tiến độ học', 'Quy tắc tính điểm']);
  });
});

describe('Thảo luận / hỏi đáp trong bài học (api-discussions.md)', () => {
  // Chỉ giảng viên mẫu GHI dữ liệu và bài đăng được xóa ngay sau khi thử, nên không để lại thông báo hay bài đăng nào:
  // giảng viên đăng câu hỏi và tự trả lời thì không phát sinh thông báo (chỉ học viên hỏi hoặc người khác trả lời mới báo).
  let ctx = null;
  let questionId = null;
  let replyId = null;

  const listUrl = () => `/classes/${ctx.classId}/lessons/${ctx.lessonId}/discussions`;
  const asTeacher = (extra = {}) => ({ token: sessions.teacher.token, ...extra });
  const asStudent = (extra = {}) => ({ token: sessions.student.token, ...extra });
  const needCtx = (t) => (ctx ? true : (t.skip('Chưa có lớp do giảng viên mẫu phụ trách mà học viên mẫu đang học, có bài học và đang hoạt động'), false));

  before(async () => {
    const studentClasses = expectOk(await request('/classes/my-classes', asStudent()));
    const list = Array.isArray(studentClasses) ? studentClasses : studentClasses.items;
    const cls = list.find((c) => c.status === 'active' && c.teacher?.id === sessions.teacher.user.id);
    if (!cls) return;
    const outline = expectOk(await request(`/courses/${cls.course.id}/curriculum`, asTeacher()));
    const lesson = (outline.chapters || []).flatMap((chapter) => chapter.lessons || [])[0];
    if (lesson) ctx = { classId: cls.id, lessonId: lesson.id };
  });

  after(async () => {
    // Dọn dẹp nếu một bước ở giữa bị lỗi trước khi bài đăng được xóa
    if (ctx && questionId) await request(`/discussions/${questionId}`, asTeacher({ method: 'DELETE' }));
  });

  it('không đăng nhập → 401', async (t) => {
    if (!needCtx(t)) return;
    expectFail(await request(listUrl()), 401);
  });

  it('mã lớp hoặc mã bài học không phải UUID → 400', async () => {
    expectFail(await request(`/classes/abc/lessons/${randomUUID()}/discussions`, asStudent()), 400);
    expectFail(await request(`/classes/${randomUUID()}/lessons/abc/discussions`, asStudent()), 400);
  });

  it('bài học không thuộc khóa học của lớp → 404', async (t) => {
    if (!needCtx(t)) return;
    expectFail(await request(`/classes/${ctx.classId}/lessons/${randomUUID()}/discussions`, asStudent()), 404);
  });

  it('học viên của lớp xem được khu thảo luận và được phép đăng (lớp đang hoạt động)', async (t) => {
    if (!needCtx(t)) return;
    const data = expectOk(await request(listUrl(), asStudent()));
    assert.ok(Array.isArray(data.items));
    assert.equal(data.canPost, true);
    assert.equal(data.meta.page, 1);
  });

  it('Quản lý đào tạo xem được nhưng không đăng được (canPost = false, đăng bài → 403)', async (t) => {
    if (!needCtx(t)) return;
    const data = expectOk(await request(listUrl(), { token: sessions.manager.token }));
    assert.equal(data.canPost, false);
    expectFail(await request(listUrl(), { token: sessions.manager.token, method: 'POST', body: { content: 'Thử' } }), 403);
  });

  it('nội dung rỗng hoặc dài quá 2000 ký tự → 400', async (t) => {
    if (!needCtx(t)) return;
    expectFail(await request(listUrl(), asTeacher({ method: 'POST', body: { content: '   ' } })), 400);
    expectFail(await request(listUrl(), asTeacher({ method: 'POST', body: { content: 'a'.repeat(2001) } })), 400);
    expectFail(await request(listUrl(), asTeacher({ method: 'POST', body: {} })), 400);
  });

  it('giảng viên đăng câu hỏi → 201, nội dung được cắt khoảng trắng, có đủ quyền trên bài của mình', async (t) => {
    if (!needCtx(t)) return;
    const data = expectOk(await request(listUrl(), asTeacher({ method: 'POST', body: { content: `  [e2e] Câu hỏi thử nghiệm ${randomUUID().slice(0, 8)}  ` } })), 201);
    questionId = data.id;
    assert.ok(data.content.startsWith('[e2e] Câu hỏi thử nghiệm') && !data.content.endsWith(' '));
    assert.equal(data.author.role, 'teacher');
    assert.deepEqual([data.isResolved, data.canEdit, data.canDelete, data.canResolve], [false, true, true, true]);
    assert.deepEqual(data.replies, []);
  });

  it('giảng viên trả lời câu hỏi → 201; trả lời một câu trả lời → 400', async (t) => {
    if (!needCtx(t) || !questionId) return t.skip('Bước đăng câu hỏi chưa thành công');
    const reply = expectOk(await request(`/discussions/${questionId}/replies`, asTeacher({ method: 'POST', body: { content: '[e2e] Câu trả lời thử nghiệm' } })), 201);
    replyId = reply.id;
    assert.equal(reply.content, '[e2e] Câu trả lời thử nghiệm');
    expectFail(await request(`/discussions/${replyId}/replies`, asTeacher({ method: 'POST', body: { content: 'Lồng nhau' } })), 400);
  });

  it('học viên thấy bài đó nhưng không sửa, xóa hay đánh dấu hộ được (403)', async (t) => {
    if (!needCtx(t) || !questionId) return t.skip('Bước đăng câu hỏi chưa thành công');
    const data = expectOk(await request(listUrl(), asStudent()));
    const item = data.items.find((i) => i.id === questionId);
    assert.ok(item, 'học viên không thấy câu hỏi vừa đăng');
    assert.equal(item.replies.length, 1);
    assert.deepEqual([item.canEdit, item.canDelete, item.canResolve], [false, false, false]);

    expectFail(await request(`/discussions/${questionId}`, asStudent({ method: 'PATCH', body: { content: 'Sửa trộm' } })), 403);
    expectFail(await request(`/discussions/${questionId}`, asStudent({ method: 'DELETE' })), 403);
    expectFail(await request(`/discussions/${questionId}/resolve`, asStudent({ method: 'PATCH', body: { isResolved: true } })), 403);
  });

  it('tác giả sửa bài → có editedAt; đánh dấu đã giải đáp; không đánh dấu được một câu trả lời', async (t) => {
    if (!needCtx(t) || !questionId) return t.skip('Bước đăng câu hỏi chưa thành công');
    const edited = expectOk(await request(`/discussions/${questionId}`, asTeacher({ method: 'PATCH', body: { content: '[e2e] Đã sửa' } })));
    assert.equal(edited.content, '[e2e] Đã sửa');
    assert.ok(edited.editedAt);

    const resolved = expectOk(await request(`/discussions/${questionId}/resolve`, asTeacher({ method: 'PATCH', body: { isResolved: true } })));
    assert.equal(resolved.isResolved, true);
    expectFail(await request(`/discussions/${replyId}/resolve`, asTeacher({ method: 'PATCH', body: { isResolved: true } })), 400);
    expectFail(await request(`/discussions/${questionId}/resolve`, asTeacher({ method: 'PATCH', body: { isResolved: 'có' } })), 400);
  });

  it('tổng quan thảo luận của lớp: giảng viên thấy câu hỏi (kèm số trả lời), học viên bị chặn (403)', async (t) => {
    if (!needCtx(t) || !questionId) return t.skip('Bước đăng câu hỏi chưa thành công');
    const data = expectOk(await request(`/classes/${ctx.classId}/discussions?status=resolved&limit=50`, asTeacher()));
    const item = data.items.find((i) => i.id === questionId);
    assert.ok(item, 'tổng quan không có câu hỏi vừa được đánh dấu đã giải đáp');
    assert.equal(item.replyCount, 1);
    assert.equal(item.lesson.id, ctx.lessonId);
    assert.equal(typeof data.summary.total, 'number');
    assert.equal(data.summary.total, data.summary.open + data.summary.resolved);
    expectFail(await request(`/classes/${ctx.classId}/discussions`, asStudent()), 403);
    expectFail(await request(`/classes/${ctx.classId}/discussions?status=khac`, asTeacher()), 400);
  });

  it('xóa câu hỏi → xóa luôn câu trả lời; bài đã xóa không còn xuất hiện và thao tác tiếp theo → 404', async (t) => {
    if (!needCtx(t) || !questionId) return t.skip('Bước đăng câu hỏi chưa thành công');
    const result = expectOk(await request(`/discussions/${questionId}`, asTeacher({ method: 'DELETE' })));
    assert.equal(result.deleted, 2);
    const data = expectOk(await request(listUrl(), asStudent()));
    assert.equal(data.items.some((i) => i.id === questionId), false);
    expectFail(await request(`/discussions/${questionId}`, asTeacher({ method: 'PATCH', body: { content: 'x' } })), 404);
    expectFail(await request(`/discussions/${replyId}`, asTeacher({ method: 'DELETE' })), 404);
    questionId = null;
  });
});
