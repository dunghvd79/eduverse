/**
 * Hàm thuần đọc cấu hình gửi email từ biến môi trường (docs/architecture/deployment.md mục "Gửi email thật").
 * Có unit test: tests/unit/mailConfig.test.js.
 *
 * Bốn chế độ, tự chọn theo biến môi trường, nên không cấu hình gì thì hệ thống vẫn chạy như trước (in OTP ra log):
 *   REDIS_URL + SMTP_HOST -> hàng đợi BullMQ, worker gửi qua SMTP
 *   REDIS_URL             -> hàng đợi BullMQ, worker chỉ in email ra log
 *   SMTP_HOST             -> gửi SMTP ngay trong nền (không qua hàng đợi)
 *   không có gì           -> in email ra log backend
 */

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

export const isSmtpConfigured = (env) => clean(env.SMTP_HOST) !== '';
export const isQueueConfigured = (env) => clean(env.REDIS_URL) !== '';

/** { useQueue, transport: 'smtp' | 'log' } */
export const mailModeOf = (env) => ({
  useQueue: isQueueConfigured(env),
  transport: isSmtpConfigured(env) ? 'smtp' : 'log'
});

/** Nhãn ngắn cho trang quản trị: 'configured' khi có SMTP, ngược lại 'dev_console' (in ra log). */
export const emailHealthStatus = (env) => (isSmtpConfigured(env) ? 'configured' : 'dev_console');

/**
 * Tùy chọn cho nodemailer.createTransport. Cổng 465 mặc định bật TLS trực tiếp; cổng khác (587) dùng STARTTLS.
 * Mật khẩu ứng dụng Gmail hay bị dán kèm khoảng trắng (4 nhóm x 4 ký tự), nên bỏ khoảng trắng.
 */
export const smtpOptionsOf = (env) => {
  const host = clean(env.SMTP_HOST);
  const secureFlag = clean(env.SMTP_SECURE).toLowerCase();
  const port = Number.parseInt(clean(env.SMTP_PORT), 10) || (secureFlag === 'false' ? 587 : 465);
  const secure = secureFlag === '' ? port === 465 : secureFlag === 'true';
  const user = clean(env.SMTP_USER);
  const pass = clean(env.SMTP_PASS).replace(/\s+/g, '');
  return {
    host,
    port,
    secure,
    ...(user && pass ? { auth: { user, pass } } : {}),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  };
};

/** Người gửi: MAIL_FROM nếu có, không thì dùng SMTP_USER, cuối cùng là địa chỉ giả cho chế độ log. */
export const mailFromOf = (env) => {
  const from = clean(env.MAIL_FROM);
  if (from) return from;
  const user = clean(env.SMTP_USER);
  return user ? `EduVerse <${user}>` : 'EduVerse <no-reply@eduverse.local>';
};

/**
 * Chuyển REDIS_URL (redis://[:mật_khẩu@]host:cổng[/db], rediss:// là có TLS) thành tùy chọn kết nối cho BullMQ.
 * BullMQ yêu cầu maxRetriesPerRequest = null cho kết nối của Worker.
 */
export const redisConnectionOf = (url) => {
  const parsed = new URL(clean(url));
  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
    throw new Error('REDIS_URL phải bắt đầu bằng redis:// hoặc rediss://');
  }
  const db = Number.parseInt(parsed.pathname.replace(/^\//, ''), 10);
  return {
    host: parsed.hostname,
    port: Number.parseInt(parsed.port, 10) || 6379,
    ...(parsed.username ? { username: decodeURIComponent(parsed.username) } : {}),
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
    ...(Number.isInteger(db) ? { db } : {}),
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
    maxRetriesPerRequest: null
  };
};
