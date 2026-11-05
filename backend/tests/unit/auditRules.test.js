/**
 * Unit test quy tắc Nhật ký hệ thống (src/utils/auditRules.js) — UC-ADMIN-005, docs/api/api-audit-logs.md.
 * Không cần CSDL: `npm test`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIT_ACTIONS, AUDIT_CATEGORIES, AUDIT_SEVERITIES, BRUTE_FORCE,
  severityOfFailedLogin, normalizeIp, gradeChangeOf, csvCell
} from '../../src/utils/auditRules.js';

describe('Danh mục hành động', () => {
  it('mọi hành động có nhóm hợp lệ, mức độ hợp lệ và nhãn tiếng Việt', () => {
    for (const [action, def] of Object.entries(AUDIT_ACTIONS)) {
      assert.ok(AUDIT_CATEGORIES[def.category], `${action}: nhóm ${def.category} không tồn tại`);
      assert.ok(AUDIT_SEVERITIES.includes(def.severity), `${action}: mức độ ${def.severity} không hợp lệ`);
      assert.ok(def.label && def.label.length > 3, `${action}: thiếu nhãn`);
      assert.ok(action.length <= 50, `${action}: dài hơn cột action (50)`);
    }
  });
});

describe('severityOfFailedLogin — dò mật khẩu', () => {
  it('dưới ngưỡng 10 lần trong 5 phút: warning', () => {
    assert.equal(severityOfFailedLogin(1), 'warning');
    assert.equal(severityOfFailedLogin(BRUTE_FORCE.threshold - 1), 'warning');
  });
  it('từ lần thứ 10: danger', () => {
    assert.equal(severityOfFailedLogin(BRUTE_FORCE.threshold), 'danger');
    assert.equal(severityOfFailedLogin(25), 'danger');
  });
});

describe('normalizeIp', () => {
  it('bỏ tiền tố IPv4-mapped và chuẩn hóa localhost IPv6', () => {
    assert.equal(normalizeIp('::ffff:203.113.10.5'), '203.113.10.5');
    assert.equal(normalizeIp('::1'), '127.0.0.1');
    assert.equal(normalizeIp(' 2001:db8::1 '), '2001:db8::1');
  });
  it('rỗng -> null', () => {
    assert.equal(normalizeIp(undefined), null);
    assert.equal(normalizeIp(''), null);
  });
});

describe('gradeChangeOf — chỉ ghi khi sửa điểm đã chấm', () => {
  it('chấm lần đầu (chưa có điểm) -> null', () => {
    assert.equal(gradeChangeOf(null, 8), null);
    assert.equal(gradeChangeOf(undefined, 8), null);
  });
  it('điểm không đổi (kể cả DECIMAL dạng chuỗi) -> null', () => {
    assert.equal(gradeChangeOf('8.00', 8), null);
  });
  it('điểm đổi -> { before, after } dạng số', () => {
    assert.deepEqual(gradeChangeOf('6.50', 9), { before: 6.5, after: 9 });
  });
});

describe('csvCell', () => {
  it('bọc ô có dấu phẩy / nháy kép / xuống dòng', () => {
    assert.equal(csvCell('a,b'), '"a,b"');
    assert.equal(csvCell('nói "xin chào"'), '"nói ""xin chào"""');
    assert.equal(csvCell('dòng 1\ndòng 2'), '"dòng 1\ndòng 2"');
  });
  it('chặn công thức Excel (CSV injection)', () => {
    assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
    assert.equal(csvCell('+1'), "'+1");
  });
  it('object -> JSON, null -> rỗng', () => {
    assert.equal(csvCell({ before: 6, after: 9 }), '"{""before"":6,""after"":9}"');
    assert.equal(csvCell(null), '');
  });
});
