/**
 * Unit test cài đặt hệ thống sửa được (src/utils/systemSettings.js) — docs/api/api-settings.md. Không cần CSDL: `npm test`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SETTING_DEFINITIONS, resolveSettings, publicSettingsOf, diffSettings } from '../../src/utils/systemSettings.js';

const DEFAULTS = { allowSelfRegistration: true, announcement: { enabled: false, message: '', tone: 'info' } };

describe('resolveSettings — gộp giá trị đã lưu với mặc định', () => {
  it('bảng trống -> toàn bộ mặc định (mở đăng ký, tắt thông báo)', () => {
    assert.deepEqual(resolveSettings({}), DEFAULTS);
  });
  it('giá trị đã lưu ghi đè mặc định; object được gộp từng trường', () => {
    const s = resolveSettings({ allow_self_registration: false, announcement: { enabled: true, message: 'Bảo trì 22h' } });
    assert.equal(s.allowSelfRegistration, false);
    assert.deepEqual(s.announcement, { enabled: true, message: 'Bảo trì 22h', tone: 'info' });
  });
  it('khóa lạ trong DB bị bỏ qua', () => {
    assert.deepEqual(Object.keys(resolveSettings({ unknown_key: 1 })), Object.keys(SETTING_DEFINITIONS));
  });
});

describe('publicSettingsOf — phần công khai', () => {
  it('thông báo tắt hoặc rỗng -> null', () => {
    assert.equal(publicSettingsOf(DEFAULTS).announcement, null);
    assert.equal(publicSettingsOf({ ...DEFAULTS, announcement: { enabled: true, message: '   ', tone: 'info' } }).announcement, null);
  });
  it('thông báo bật -> chỉ trả nội dung + kiểu, đã cắt khoảng trắng', () => {
    const pub = publicSettingsOf({ allowSelfRegistration: false, announcement: { enabled: true, message: ' Nghỉ lễ ', tone: 'warning' } });
    assert.deepEqual(pub, { allowSelfRegistration: false, announcement: { message: 'Nghỉ lễ', tone: 'warning' } });
  });
});

describe('diffSettings — chỉ khóa thực sự đổi (mỗi khóa một dòng nhật ký)', () => {
  it('không đổi gì -> rỗng', () => {
    assert.deepEqual(diffSettings(DEFAULTS, structuredClone(DEFAULTS)), []);
  });
  it('đổi một khóa -> một thay đổi kèm trước/sau', () => {
    const after = { ...DEFAULTS, allowSelfRegistration: false };
    assert.deepEqual(diffSettings(DEFAULTS, after), [{
      name: 'allowSelfRegistration', key: 'allow_self_registration', label: 'Cho phép học viên tự đăng ký', before: true, after: false
    }]);
  });
});
