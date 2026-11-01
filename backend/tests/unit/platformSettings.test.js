import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlatformSettings, PASSWORD_POLICY } from '../../src/utils/platformSettings.js';
import { RATE_LIMIT_RULES } from '../../src/utils/rateLimitRules.js';

// Cấu hình nền tảng chỉ đọc cho Admin: docs/api/api-audit-logs.md (mục Cài đặt hệ thống)

const SECRETS = {
  DATABASE_URL: 'postgresql://eduverse:MatKhauDB-9x@db.internal:5432/eduverse',
  JWT_SECRET: 'jwt-bi-mat-123456',
  REFRESH_TOKEN_SECRET: 'refresh-bi-mat-654321',
  SMTP_PASS: 'abcd efgh ijkl mnop',
  AWS_ACCESS_KEY_ID: 'AKIAEXAMPLE123456',
  AWS_SECRET_ACCESS_KEY: 'aws-secret-key-xyz',
  GEMINI_API_KEY: 'AIzaSy-gemini-key',
  REDIS_URL: 'redis://:RedisPass-77@redis:6379'
};

const FULL_ENV = {
  ...SECRETS,
  NODE_ENV: 'production',
  JWT_EXPIRES_IN: '30m',
  REFRESH_TOKEN_EXPIRES_IN: '14d',
  AWS_REGION: 'ap-southeast-1',
  S3_BUCKET: 'eduverse-demo',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_USER: 'noreply@example.com',
  GEMINI_MODEL: 'gemini-test-model',
  GEMINI_FALLBACK_MODEL: 'gemini-test-lite'
};

const UPLOADS = {
  avatar: { isPublic: true, extensions: ['jpg', 'png'], maxSize: 2 * 1024 * 1024 },
  lesson_material: { isPublic: false, extensions: ['pdf'], maxSize: 50 * 1024 * 1024 }
};

describe('buildPlatformSettings', () => {
  test('không cấu hình gì: giá trị mặc định đúng với code, lưu trữ cục bộ, email in ra log, AI chưa bật', () => {
    const s = buildPlatformSettings({ env: {} });
    assert.deepEqual(s.environment, { nodeEnv: 'development', nodeVersion: null });
    assert.equal(s.security.accessTokenTtl, '15m');
    assert.equal(s.security.refreshTokenTtl, '7d');
    assert.equal(s.security.passwordPolicy, PASSWORD_POLICY);
    assert.equal(s.storage.provider, 'local');
    assert.equal('region' in s.storage, false);
    assert.equal('bucket' in s.storage, false);
    assert.deepEqual(s.email, { mode: 'direct_log', useQueue: false, transport: 'log', from: null, smtpHost: null });
    assert.deepEqual(s.ai, { configured: false, model: null, fallbackModel: null });
  });

  test('đủ cấu hình: S3, hàng đợi + SMTP, AI và thời hạn token lấy từ môi trường', () => {
    const s = buildPlatformSettings({ env: { ...FULL_ENV, REDIS_URL: SECRETS.REDIS_URL }, nodeVersion: 'v22.0.0', uploadUrlExpirySeconds: 900 });
    assert.deepEqual(s.environment, { nodeEnv: 'production', nodeVersion: 'v22.0.0' });
    assert.equal(s.security.accessTokenTtl, '30m');
    assert.equal(s.security.refreshTokenTtl, '14d');
    assert.equal(s.storage.provider, 's3');
    assert.equal(s.storage.region, 'ap-southeast-1');
    assert.equal(s.storage.bucket, 'eduverse-demo');
    assert.equal(s.storage.uploadUrlExpirySeconds, 900);
    assert.equal(s.email.mode, 'queue_smtp');
    assert.equal(s.email.useQueue, true);
    assert.equal(s.email.smtpHost, 'smtp.gmail.com');
    assert.equal(s.email.from, 'EduVerse <noreply@example.com>');
    assert.deepEqual(s.ai, { configured: true, model: 'gemini-test-model', fallbackModel: 'gemini-test-lite' });
  });

  test('chỉ có AWS_REGION mà thiếu S3_BUCKET vẫn là lưu trữ cục bộ (giống storageService)', () => {
    assert.equal(buildPlatformSettings({ env: { AWS_REGION: 'ap-southeast-1' } }).storage.provider, 'local');
    assert.equal(buildPlatformSettings({ env: { S3_BUCKET: 'b', AWS_REGION: '  ' } }).storage.provider, 'local');
  });

  test('AI: model mặc định khi để trống; GEMINI_FALLBACK_MODEL rỗng nghĩa là tắt model dự phòng', () => {
    const base = { GEMINI_API_KEY: 'k' };
    assert.deepEqual(buildPlatformSettings({ env: base }).ai, { configured: true, model: 'gemini-flash-latest', fallbackModel: 'gemini-flash-lite-latest' });
    assert.deepEqual(buildPlatformSettings({ env: { ...base, GEMINI_MODEL: '', GEMINI_FALLBACK_MODEL: '' } }).ai, { configured: true, model: 'gemini-flash-latest', fallbackModel: null });
  });

  test('KHÔNG BAO GIỜ lộ khóa bí mật, mật khẩu, token, chuỗi kết nối', () => {
    const json = JSON.stringify(buildPlatformSettings({ env: FULL_ENV, rateLimits: RATE_LIMIT_RULES, uploadPurposes: UPLOADS }));
    for (const [name, value] of Object.entries(SECRETS)) {
      assert.equal(json.includes(value), false, `${name} bị lộ`);
    }
    assert.doesNotMatch(json, /postgres|redis:\/\/|AKIA|AIza|MatKhauDB|RedisPass/i);
  });

  test('giới hạn tần suất: đổi mili giây sang phút, giữ nhãn và phạm vi', () => {
    const s = buildPlatformSettings({ env: {}, rateLimits: { login: RATE_LIMIT_RULES.login, ai: RATE_LIMIT_RULES.ai } });
    assert.deepEqual(s.security.rateLimits, [
      { key: 'login', label: 'Đăng nhập sai', scope: 'email', max: 5, windowMinutes: 5 },
      { key: 'ai', label: 'AI sinh câu hỏi', scope: 'user', max: 10, windowMinutes: 1 }
    ]);
  });

  test('giới hạn tải tệp: dung lượng theo MB, phần mở rộng, công khai hay riêng tư', () => {
    const s = buildPlatformSettings({ env: {}, uploadPurposes: UPLOADS });
    assert.deepEqual(s.storage.limits, [
      { purpose: 'avatar', maxSizeMb: 2, extensions: ['jpg', 'png'], isPublic: true },
      { purpose: 'lesson_material', maxSizeMb: 50, extensions: ['pdf'], isPublic: false }
    ]);
  });
});

describe('RATE_LIMIT_RULES (nguồn của middlewares/rateLimiter.js)', () => {
  // Giá trị cũ viết cứng trong rateLimiter.js trước khi gom về một chỗ — phải giữ nguyên hành vi
  const EXPECTED = {
    login: [5 * 60 * 1000, 5],
    register: [60 * 60 * 1000, 5],
    resendOtp: [60 * 60 * 1000, 3],
    forgotPassword: [60 * 60 * 1000, 3],
    verifyOtp: [15 * 60 * 1000, 5],
    refreshToken: [60 * 1000, 30],
    resetPassword: [15 * 60 * 1000, 5],
    changePassword: [15 * 60 * 1000, 5],
    ai: [60 * 1000, 10],
    discussion: [60 * 1000, 10]
  };

  test('đúng 10 giới hạn với số lần và cửa sổ thời gian như trước khi refactor', () => {
    assert.deepEqual(Object.keys(RATE_LIMIT_RULES).sort(), Object.keys(EXPECTED).sort());
    for (const [key, [windowMs, max]] of Object.entries(EXPECTED)) {
      assert.equal(RATE_LIMIT_RULES[key].windowMs, windowMs, `${key}.windowMs`);
      assert.equal(RATE_LIMIT_RULES[key].max, max, `${key}.max`);
    }
  });

  test('mỗi giới hạn có nhãn tiếng Việt và phạm vi email | ip | user', () => {
    for (const [key, rule] of Object.entries(RATE_LIMIT_RULES)) {
      assert.ok(rule.label.trim().length > 0, key);
      assert.ok(['email', 'ip', 'user'].includes(rule.scope), key);
    }
  });
});
