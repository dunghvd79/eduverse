import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSmtpConfigured,
  isQueueConfigured,
  mailModeOf,
  emailHealthStatus,
  smtpOptionsOf,
  mailFromOf,
  redisConnectionOf
} from '../../src/utils/mailConfig.js';

// Cấu hình gửi email: docs/architecture/deployment.md (mục "Gửi email thật")

describe('chọn chế độ gửi email', () => {
  test('không cấu hình gì: in ra log, không dùng hàng đợi (chạy như trước)', () => {
    assert.deepEqual(mailModeOf({}), { useQueue: false, transport: 'log' });
    assert.equal(emailHealthStatus({}), 'dev_console');
  });

  test('chuỗi rỗng hoặc toàn khoảng trắng coi như chưa cấu hình (docker compose truyền biến rỗng)', () => {
    const env = { SMTP_HOST: '', REDIS_URL: '   ' };
    assert.equal(isSmtpConfigured(env), false);
    assert.equal(isQueueConfigured(env), false);
    assert.deepEqual(mailModeOf(env), { useQueue: false, transport: 'log' });
  });

  test('chỉ SMTP: gửi trực tiếp, không hàng đợi', () => {
    const env = { SMTP_HOST: 'smtp.gmail.com' };
    assert.deepEqual(mailModeOf(env), { useQueue: false, transport: 'smtp' });
    assert.equal(emailHealthStatus(env), 'configured');
  });

  test('chỉ Redis: hàng đợi nhưng worker in ra log', () => {
    const env = { REDIS_URL: 'redis://redis:6379' };
    assert.deepEqual(mailModeOf(env), { useQueue: true, transport: 'log' });
    assert.equal(emailHealthStatus(env), 'dev_console');
  });

  test('Redis và SMTP: hàng đợi, worker gửi SMTP', () => {
    const env = { REDIS_URL: 'redis://redis:6379', SMTP_HOST: 'smtp.gmail.com' };
    assert.deepEqual(mailModeOf(env), { useQueue: true, transport: 'smtp' });
  });
});

describe('smtpOptionsOf', () => {
  test('mặc định cổng 465 bật TLS trực tiếp, có timeout', () => {
    const options = smtpOptionsOf({ SMTP_HOST: 'smtp.gmail.com' });
    assert.equal(options.host, 'smtp.gmail.com');
    assert.equal(options.port, 465);
    assert.equal(options.secure, true);
    assert.equal(options.connectionTimeout, 10000);
    assert.equal(options.socketTimeout, 20000);
    assert.equal('auth' in options, false);
  });

  test('cổng 587 dùng STARTTLS (secure = false)', () => {
    const options = smtpOptionsOf({ SMTP_HOST: 'h', SMTP_PORT: '587' });
    assert.equal(options.port, 587);
    assert.equal(options.secure, false);
  });

  test('SMTP_SECURE=false mà không có cổng thì dùng 587', () => {
    const options = smtpOptionsOf({ SMTP_HOST: 'h', SMTP_SECURE: 'false' });
    assert.equal(options.port, 587);
    assert.equal(options.secure, false);
  });

  test('SMTP_SECURE ghi rõ thì được tôn trọng, không phân biệt hoa thường', () => {
    assert.equal(smtpOptionsOf({ SMTP_HOST: 'h', SMTP_PORT: '2525', SMTP_SECURE: 'TRUE' }).secure, true);
    assert.equal(smtpOptionsOf({ SMTP_HOST: 'h', SMTP_PORT: '465', SMTP_SECURE: 'false' }).secure, false);
  });

  test('cổng không hợp lệ rơi về mặc định', () => {
    assert.equal(smtpOptionsOf({ SMTP_HOST: 'h', SMTP_PORT: 'abc' }).port, 465);
  });

  test('mật khẩu ứng dụng Gmail dán kèm khoảng trắng được bỏ khoảng trắng', () => {
    const options = smtpOptionsOf({ SMTP_HOST: 'h', SMTP_USER: ' a@gmail.com ', SMTP_PASS: 'abcd efgh ijkl mnop' });
    assert.deepEqual(options.auth, { user: 'a@gmail.com', pass: 'abcdefghijklmnop' });
  });

  test('thiếu user hoặc pass thì không gửi auth (SMTP nội bộ không cần đăng nhập)', () => {
    assert.equal('auth' in smtpOptionsOf({ SMTP_HOST: 'h', SMTP_USER: 'a@x.com' }), false);
    assert.equal('auth' in smtpOptionsOf({ SMTP_HOST: 'h', SMTP_PASS: 'secret' }), false);
  });
});

describe('mailFromOf', () => {
  test('ưu tiên MAIL_FROM', () => {
    assert.equal(mailFromOf({ MAIL_FROM: 'EduVerse <a@b.com>', SMTP_USER: 'x@y.com' }), 'EduVerse <a@b.com>');
  });

  test('không có MAIL_FROM thì dùng SMTP_USER', () => {
    assert.equal(mailFromOf({ SMTP_USER: 'x@y.com' }), 'EduVerse <x@y.com>');
  });

  test('không có gì thì dùng địa chỉ giả', () => {
    assert.equal(mailFromOf({}), 'EduVerse <no-reply@eduverse.local>');
  });
});

describe('redisConnectionOf', () => {
  test('redis://host:port', () => {
    assert.deepEqual(redisConnectionOf('redis://redis:6379'), { host: 'redis', port: 6379, maxRetriesPerRequest: null });
  });

  test('cổng mặc định 6379 khi bỏ trống', () => {
    assert.equal(redisConnectionOf('redis://localhost').port, 6379);
  });

  test('có mật khẩu, user và db; ký tự đặc biệt được giải mã', () => {
    const options = redisConnectionOf('redis://app:p%40ss%3Aword@cache.example.com:6380/2');
    assert.equal(options.host, 'cache.example.com');
    assert.equal(options.port, 6380);
    assert.equal(options.username, 'app');
    assert.equal(options.password, 'p@ss:word');
    assert.equal(options.db, 2);
  });

  test('chỉ có mật khẩu (kiểu redis://:pass@host)', () => {
    const options = redisConnectionOf('redis://:secret@host:6379');
    assert.equal(options.password, 'secret');
    assert.equal('username' in options, false);
  });

  test('rediss:// bật TLS', () => {
    assert.deepEqual(redisConnectionOf('rediss://host:6380').tls, {});
    assert.equal('tls' in redisConnectionOf('redis://host:6380'), false);
  });

  test('luôn có maxRetriesPerRequest = null (BullMQ yêu cầu)', () => {
    assert.equal(redisConnectionOf('redis://h:1').maxRetriesPerRequest, null);
  });

  test('giao thức khác bị từ chối', () => {
    assert.throws(() => redisConnectionOf('http://host:6379'), /redis:\/\//);
  });

  test('chuỗi rỗng hoặc sai định dạng ném lỗi', () => {
    assert.throws(() => redisConnectionOf(''));
    assert.throws(() => redisConnectionOf('not a url'));
  });
});
