import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createAuditRecorder } from '../../src/utils/auditRecorder.js';

// Bộ ghi nhật ký không bao giờ được làm hỏng thao tác chính: docs/api/api-audit-logs.md

const makeLogger = () => {
  const warnings = [];
  return { warnings, warn: (message) => warnings.push(message) };
};

describe('createAuditRecorder', () => {
  test('ghi thành công: gọi create đúng một lần với dòng đã dựng và trả true', async () => {
    const rows = [];
    const record = createAuditRecorder({ create: async (row) => { rows.push(row); } });
    const ok = await record({
      req: { ip: '1.2.3.4', headers: {} },
      actor: { id: 'u1', email: 'A@x.com', role: 'admin' },
      action: 'user.delete',
      resourceType: 'user',
      resourceId: 'u2',
      metadata: { password: 'bỏ', reason: 'giữ' }
    });
    assert.equal(ok, true);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].actor_email, 'a@x.com');
    assert.equal(rows[0].action, 'user.delete');
    assert.equal(rows[0].ip, '1.2.3.4');
    assert.deepEqual(rows[0].metadata, { reason: 'giữ' });
  });

  test('CSDL lỗi: không ném lỗi, trả false, có cảnh báo gợi ý chạy migration', async () => {
    const logger = makeLogger();
    const record = createAuditRecorder({ create: async () => { throw new Error('relation "audit_logs" does not exist'); }, logger });
    assert.equal(await record({ action: 'auth.login' }), false);
    assert.equal(logger.warnings.length, 1);
    assert.match(logger.warnings[0], /audit_logs/);
    assert.match(logger.warnings[0], /db:migrate:audit-logs/);
  });

  test('lỗi lặp lại chỉ cảnh báo một lần mỗi khoảng thời gian, hết khoảng thì cảnh báo lại', async () => {
    const logger = makeLogger();
    let clock = 1000;
    const record = createAuditRecorder({
      create: async () => { throw new Error('down'); }, logger, warnIntervalMs: 60000, now: () => clock
    });
    await record({ action: 'a.b' });
    clock += 59999;
    await record({ action: 'a.b' });
    assert.equal(logger.warnings.length, 1);
    clock += 1;
    await record({ action: 'a.b' });
    assert.equal(logger.warnings.length, 2);
  });

  test('đầu vào hỏng (null) hoặc logger không có warn cũng không ném lỗi', async () => {
    const record = createAuditRecorder({ create: async () => {}, logger: {} });
    assert.equal(await record(null), false);
    const failing = createAuditRecorder({ create: () => { throw new Error('đồng bộ'); }, logger: {} });
    assert.equal(await failing({ action: 'a.b' }), false);
  });

  test('create ném lỗi đồng bộ (không phải Promise) cũng được bắt', async () => {
    const logger = makeLogger();
    const record = createAuditRecorder({ create: () => { throw new Error('boom'); }, logger });
    assert.equal(await record({ action: 'a.b' }), false);
    assert.equal(logger.warnings.length, 1);
  });
});
