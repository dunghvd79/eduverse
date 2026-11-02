import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIT_ACTIONS, AUDIT_CATEGORIES, AUDIT_CSV_HEADERS, actionsOfCategory, actionLabelOf, categoryOf,
  sanitizeMetadata, clientIpOf, userAgentOf, buildAuditEntry, serializeAuditLog, buildAuditWhere, buildAuditCsv
} from '../../src/utils/auditRules.js';

// Nhật ký hệ thống: docs/api/api-audit-logs.md

// Op giả: đủ để kiểm tra cấu trúc điều kiện mà không cần import sequelize.
// Dùng Symbol như Op thật của Sequelize (khóa Symbol không hiện trong Object.keys; từng làm bộ lọc ngày bị bỏ qua mà test không bắt được)
const Op = { in: Symbol('in'), or: Symbol('or'), iLike: Symbol('iLike'), gte: Symbol('gte'), lte: Symbol('lte') };

describe('danh mục hành động', () => {
  test('mã hành động dạng nhóm.hành_động, có nhãn và thuộc một nhóm đã khai báo', () => {
    for (const [key, { label, category }] of Object.entries(AUDIT_ACTIONS)) {
      assert.match(key, /^[a-z]+\.[a-z_]+$/, key);
      assert.ok(key.length <= 60, key);
      assert.ok(label.trim().length > 0, key);
      assert.ok(category in AUDIT_CATEGORIES, `${key}: nhóm ${category} chưa khai báo`);
    }
  });

  test('mỗi nhóm đều có ít nhất một hành động và tiền tố mã trùng tên nhóm (trừ audit -> system)', () => {
    for (const category of Object.keys(AUDIT_CATEGORIES)) {
      assert.ok(actionsOfCategory(category).length > 0, category);
    }
    for (const key of actionsOfCategory('auth')) assert.ok(key.startsWith('auth.'));
    for (const key of actionsOfCategory('user')) assert.ok(key.startsWith('user.'));
    for (const key of actionsOfCategory('course')) assert.ok(key.startsWith('course.'));
  });

  test('hành động lạ: nhãn giữ nguyên mã, không thuộc nhóm nào', () => {
    assert.equal(actionLabelOf('auth.login'), 'Đăng nhập');
    assert.equal(actionLabelOf('x.y'), 'x.y');
    assert.equal(categoryOf('x.y'), null);
    assert.equal(categoryOf('course.approve'), 'course');
  });
});

describe('hành động nhập tài khoản hàng loạt', () => {
  test('user.bulk_import thuộc nhóm user, có nhãn tiếng Việt', () => {
    assert.equal(categoryOf('user.bulk_import'), 'user');
    assert.equal(actionLabelOf('user.bulk_import'), 'Nhập tài khoản hàng loạt');
    assert.ok(actionsOfCategory('user').includes('user.bulk_import'));
  });
});

describe('sanitizeMetadata', () => {
  test('bỏ mọi khóa nhạy cảm (mật khẩu, token, OTP, mã băm, header) ở mọi cấp, không phân biệt hoa thường', () => {
    const clean = sanitizeMetadata({
      password: 'a', newPassword: 'b', tempPassword: 'c', refreshToken: 'd', accessToken: 'e', otp: '123456',
      secret: 's', token_hash: 'h', Authorization: 'Bearer x', cookie: 'c=1',
      reason: 'giữ lại',
      nested: { PASSWORD: 'x', keep: 1, deeper: { apiSecret: 'y', ok: true } },
      list: [{ otpCode: '1', fine: 'z' }]
    });
    assert.deepEqual(clean, {
      reason: 'giữ lại',
      nested: { keep: 1, deeper: { ok: true } },
      list: [{ fine: 'z' }]
    });
    assert.doesNotMatch(JSON.stringify(clean), /Bearer|123456|"a"|"b"/);
  });

  test('không có gì để lưu thì trả null (không phải đối tượng, mảng, rỗng, toàn khóa nhạy cảm)', () => {
    for (const value of [undefined, null, 'chuỗi', 5, [], {}, { password: 'x' }]) {
      assert.equal(sanitizeMetadata(value), null, JSON.stringify(value));
    }
  });

  test('cắt chuỗi dài, mảng dài và lồng quá sâu', () => {
    const clean = sanitizeMetadata({
      text: 'a'.repeat(1000),
      list: Array.from({ length: 50 }, (_, i) => i),
      a: { b: { c: { d: 'quá sâu' } } }
    });
    assert.equal(clean.text.length, 300);
    assert.equal(clean.list.length, 20);
    assert.deepEqual(clean.a, { b: { c: null } });
  });

  test('Date thành chuỗi ISO, số vô hạn/NaN thành null, hàm bị bỏ', () => {
    const clean = sanitizeMetadata({ at: new Date('2026-10-28T01:02:03.000Z'), bad: NaN, inf: Infinity, fn: () => 1, ok: 0 });
    assert.deepEqual(clean, { at: '2026-10-28T01:02:03.000Z', bad: null, inf: null, ok: 0 });
  });

  test('dữ liệu quá lớn thì chỉ giữ cờ truncated', () => {
    const big = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`k${i}`, 'x'.repeat(200)]));
    assert.deepEqual(sanitizeMetadata(big), { truncated: true });
  });

  test('không sửa đối tượng đầu vào', () => {
    const input = { password: 'x', reason: 'y' };
    sanitizeMetadata(input);
    assert.deepEqual(input, { password: 'x', reason: 'y' });
  });
});

describe('địa chỉ IP và User-Agent', () => {
  test('bỏ tiền tố IPv4-mapped, giữ IPv6 thật, thiếu thì null', () => {
    assert.equal(clientIpOf({ ip: '::ffff:172.18.0.5' }), '172.18.0.5');
    assert.equal(clientIpOf({ ip: '2001:db8::1' }), '2001:db8::1');
    assert.equal(clientIpOf({}), null);
    assert.equal(clientIpOf(undefined), null);
    assert.equal(clientIpOf({ ip: 5 }), null);
  });

  test('User-Agent bị cắt ở 255 ký tự', () => {
    assert.equal(userAgentOf({ headers: { 'user-agent': 'Mozilla/5.0' } }), 'Mozilla/5.0');
    assert.equal(userAgentOf({ headers: { 'user-agent': 'x'.repeat(400) } }).length, 255);
    assert.equal(userAgentOf({ headers: {} }), null);
    assert.equal(userAgentOf({}), null);
  });
});

describe('buildAuditEntry', () => {
  const req = { ip: '::ffff:10.0.0.7', headers: { 'user-agent': 'Chrome' } };

  test('chép người thực hiện (snapshot), IP, User-Agent; email viết thường', () => {
    const entry = buildAuditEntry({
      req,
      actor: { id: 'u1', email: 'Admin@EduVerse.com', role: 'admin', password_hash: 'không được chép' },
      action: 'user.lock',
      resourceType: 'user',
      resourceId: 'u2',
      metadata: { reason: 'vi phạm', password: 'x' }
    });
    assert.deepEqual(entry, {
      actor_id: 'u1',
      actor_email: 'admin@eduverse.com',
      actor_role: 'admin',
      action: 'user.lock',
      resource_type: 'user',
      resource_id: 'u2',
      result: 'success',
      ip: '10.0.0.7',
      user_agent: 'Chrome',
      metadata: { reason: 'vi phạm' }
    });
  });

  test('đăng nhập sai: chưa có người dùng, chỉ có email đã nhập, kết quả failed', () => {
    const entry = buildAuditEntry({ req, actorEmail: '  Hacker@Example.com ', action: 'auth.login', result: 'failed', metadata: { reason: 'Sai mật khẩu' } });
    assert.equal(entry.actor_id, null);
    assert.equal(entry.actor_role, null);
    assert.equal(entry.actor_email, 'hacker@example.com');
    assert.equal(entry.result, 'failed');
  });

  test('kết quả khác "failed" đều là success; thiếu hành động thành unknown; ID số thành chuỗi', () => {
    assert.equal(buildAuditEntry({ action: 'a.b', result: 'lạ' }).result, 'success');
    assert.equal(buildAuditEntry({ result: 'failed' }).action, 'unknown');
    assert.equal(buildAuditEntry({ action: 'a.b', resourceId: 4812 }).resource_id, '4812');
  });

  test('không có tham số vẫn trả dòng hợp lệ (không ném lỗi)', () => {
    const entry = buildAuditEntry();
    assert.equal(entry.action, 'unknown');
    assert.equal(entry.actor_id, null);
    assert.equal(entry.ip, null);
    assert.equal(entry.metadata, null);
  });

  test('cắt các trường quá dài cho vừa cột CSDL', () => {
    const entry = buildAuditEntry({
      actorEmail: `${'a'.repeat(300)}@x.com`, action: 'x'.repeat(100), resourceType: 'r'.repeat(80), resourceId: 'i'.repeat(100)
    });
    assert.ok(entry.actor_email.length <= 255);
    assert.equal(entry.action.length, 60);
    assert.equal(entry.resource_type.length, 40);
    assert.equal(entry.resource_id.length, 64);
  });
});

describe('serializeAuditLog', () => {
  test('đổi sang camelCase, thêm nhãn và nhóm, Date thành ISO', () => {
    const dto = serializeAuditLog({
      id: 'l1', created_at: new Date('2026-10-28T10:00:00.000Z'), actor_id: 'u1', actor_email: 'a@x.com', actor_role: 'admin',
      action: 'course.approve', resource_type: 'course', resource_id: 'c1', result: 'success', ip: '1.2.3.4', user_agent: 'UA', metadata: { a: 1 }
    });
    assert.deepEqual(dto, {
      id: 'l1', createdAt: '2026-10-28T10:00:00.000Z',
      actor: { id: 'u1', email: 'a@x.com', role: 'admin' },
      action: 'course.approve', actionLabel: 'Phê duyệt khóa học', category: 'course',
      resourceType: 'course', resourceId: 'c1', result: 'success', ip: '1.2.3.4', userAgent: 'UA', metadata: { a: 1 }
    });
  });

  test('thiếu trường thì null; hành động lạ vẫn hiển thị được', () => {
    const dto = serializeAuditLog({ id: 'l2', created_at: '2026-10-28T10:00:00.000Z', action: 'khac.la', result: 'failed' });
    assert.deepEqual(dto.actor, { id: null, email: null, role: null });
    assert.equal(dto.actionLabel, 'khac.la');
    assert.equal(dto.category, null);
    assert.equal(dto.metadata, null);
    assert.equal(dto.createdAt, '2026-10-28T10:00:00.000Z');
  });
});

describe('buildAuditWhere', () => {
  test('không lọc gì thì điều kiện rỗng', () => {
    assert.deepEqual(buildAuditWhere({}, Op), {});
    assert.deepEqual(buildAuditWhere(undefined, Op), {});
    assert.deepEqual(buildAuditWhere({ search: '   ' }, Op), {});
  });

  test('lọc theo hành động, theo nhóm (danh sách mã), theo kết quả', () => {
    assert.deepEqual(buildAuditWhere({ action: 'auth.login', result: 'failed' }, Op), { action: 'auth.login', result: 'failed' });
    assert.deepEqual(buildAuditWhere({ category: 'course' }, Op), { action: { [Op.in]: actionsOfCategory('course') } });
  });

  test('chọn hành động cụ thể thì bỏ qua nhóm', () => {
    assert.deepEqual(buildAuditWhere({ action: 'user.lock', category: 'course' }, Op), { action: 'user.lock' });
  });

  test('tìm kiếm khớp email, mã đối tượng hoặc IP và escape ký tự đại diện % _ \\', () => {
    const where = buildAuditWhere({ search: ' a_b%c\\d ' }, Op);
    const term = '%a\\_b\\%c\\\\d%';
    assert.deepEqual(where[Op.or], [
      { actor_email: { [Op.iLike]: term } },
      { resource_id: { [Op.iLike]: term } },
      { ip: { [Op.iLike]: term } }
    ]);
  });

  test('khoảng thời gian: chỉ from, chỉ to, cả hai', () => {
    const from = new Date('2026-10-01T00:00:00Z');
    const to = new Date('2026-10-31T23:59:59Z');
    assert.deepEqual(buildAuditWhere({ from }, Op), { created_at: { [Op.gte]: from } });
    assert.deepEqual(buildAuditWhere({ to }, Op), { created_at: { [Op.lte]: to } });
    assert.deepEqual(buildAuditWhere({ from, to }, Op), { created_at: { [Op.gte]: from, [Op.lte]: to } });
  });
});

describe('buildAuditCsv', () => {
  const item = (overrides = {}) => ({
    createdAt: '2026-10-28T10:00:00.000Z',
    actor: { email: 'admin@eduverse.com', role: 'admin' },
    actionLabel: 'Đăng nhập', action: 'auth.login',
    resourceType: 'user', resourceId: 'u1', result: 'success', ip: '10.0.0.1', metadata: null,
    ...overrides
  });

  test('có BOM UTF-8, xuống dòng CRLF, dòng đầu là tiêu đề tiếng Việt', () => {
    const csv = buildAuditCsv([item()]);
    assert.equal(csv.charCodeAt(0), 0xfeff);
    const lines = csv.slice(1).split('\r\n');
    assert.equal(lines[0], AUDIT_CSV_HEADERS.join(','));
    assert.equal(lines[1], '2026-10-28T10:00:00.000Z,admin@eduverse.com,admin,Đăng nhập,auth.login,user,u1,success,10.0.0.1,');
    assert.equal(lines[2], '');
    assert.equal(lines.length, 3);
  });

  test('danh sách rỗng vẫn có dòng tiêu đề', () => {
    assert.equal(buildAuditCsv([]), `﻿${AUDIT_CSV_HEADERS.join(',')}\r\n`);
  });

  test('ô có dấu phẩy, nháy kép, xuống dòng được bao trong nháy kép; chi tiết (JSON) cũng vậy', () => {
    const csv = buildAuditCsv([item({ actionLabel: 'Có, dấu phẩy', resourceId: 'a"b', ip: 'x\ny', metadata: { reason: 'vi phạm, "nặng"' } })]);
    const row = csv.slice(1).split('\r\n')[1];
    assert.ok(row.includes('"Có, dấu phẩy"'));
    assert.ok(row.includes('"a""b"'));
    assert.ok(row.includes('"x\ny"'));
    assert.ok(row.endsWith('"{""reason"":""vi phạm, \\""nặng\\""""}"'), row);
  });

  test('chống chèn công thức Excel: ô bắt đầu bằng = + - @ được thêm dấu nháy đơn', () => {
    for (const evil of ['=HYPERLINK("http://x")', '+1+1', '-2+3', '@SUM(A1)']) {
      const row = buildAuditCsv([item({ actor: { email: evil, role: 'student' } })]).slice(1).split('\r\n')[1];
      const cell = row.split(',')[1].replace(/^"/, '');
      assert.ok(cell.startsWith("'"), `${evil} -> ${cell}`);
    }
  });
});
