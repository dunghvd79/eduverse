import fs from 'fs';
import path from 'path';
import models from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { SETTING_DEFINITIONS, resolveSettings, publicSettingsOf, diffSettings } from '../utils/systemSettings.js';
import { logAudit } from './auditService.js';
import { getSystemStatus } from './dashboardService.js';
import { geminiModelsOf } from './aiService.js';
import { UPLOAD_PURPOSES } from './uploadService.js';
import { RATE_LIMIT_RULES } from '../middlewares/rateLimiter.js';
import { JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from '../utils/jwt.js';
import { RESET_TTL_MINUTES, OTP_TTL_MINUTES } from '../utils/emailTemplates.js';
import { isSmtpConfigured, isQueueConfigured } from '../utils/mailConfig.js';
import { BRUTE_FORCE } from '../utils/auditRules.js';

const { SystemSetting } = models;

const MB = 1024 * 1024;
const CACHE_TTL_MS = 30 * 1000;
const APP_VERSION = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')).version || null;
  } catch {
    return null;
  }
})();

// Đọc cài đặt cho mỗi lần đăng ký / mỗi trang -> cache ngắn trong bộ nhớ; Admin lưu thì xóa cache ngay
let cache = null;

/**
 * Cài đặt hiện hành (đã gộp mặc định). Bảng chưa có (chưa chạy migration) -> dùng mặc định, không làm hỏng đăng ký.
 */
export const getSettings = async () => {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  let rows = [];
  try {
    rows = await SystemSetting.findAll({ raw: true });
  } catch (error) {
    console.error('[settings] Không đọc được bảng system_settings, dùng giá trị mặc định:', error.message);
  }
  const value = resolveSettings(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
};

/**
 * GET /settings/public - không cần đăng nhập
 */
export const getPublicSettings = async () => publicSettingsOf(await getSettings());

// ---- A. Tình trạng hệ thống: chỉ trạng thái và tên định danh, KHÔNG trả khóa bí mật
const getStatus = async () => {
  const base = await getSystemStatus();
  const s3Configured = Boolean(process.env.AWS_REGION && process.env.S3_BUCKET);
  const db = base.services.find((service) => service.key === 'database');
  const details = {
    database: db?.latencyMs !== null && db?.latencyMs !== undefined ? `PostgreSQL · phản hồi ${db.latencyMs} ms` : 'Không kết nối được CSDL',
    storage: s3Configured ? `S3 · ${process.env.S3_BUCKET} (${process.env.AWS_REGION})` : 'Lưu cục bộ trên máy chủ (backend/uploads)',
    email: isSmtpConfigured(process.env) ? `SMTP · ${process.env.SMTP_HOST}` : 'Chưa cấu hình SMTP: mã OTP và link đặt lại mật khẩu in ra log backend',
    ai: process.env.GEMINI_API_KEY ? `Gemini · ${geminiModelsOf().join(' → ')}` : 'Chưa có GEMINI_API_KEY: tính năng sinh câu hỏi bằng AI tắt'
  };
  return {
    ...base,
    services: [
      ...base.services.map((service) => ({ ...service, detail: details[service.key] || null })),
      {
        key: 'queue',
        status: isQueueConfigured(process.env) ? 'configured' : 'not_configured',
        detail: isQueueConfigured(process.env) ? 'Redis · hàng đợi gửi email (BullMQ)' : 'Chưa có REDIS_URL: email gửi trực tiếp, không thử lại'
      }
    ],
    app: { version: APP_VERSION, environment: process.env.NODE_ENV || 'development', nodeVersion: process.version }
  };
};

// ---- B. Chính sách vận hành: giá trị đang chạy, đổi bằng biến môi trường / mã nguồn rồi khởi động lại
const getPolicies = () => ({
  session: [
    { label: 'Thời hạn access token', value: JWT_EXPIRES_IN, source: 'JWT_EXPIRES_IN' },
    { label: 'Thời hạn refresh token (ghi nhớ đăng nhập)', value: REFRESH_TOKEN_EXPIRES_IN, source: 'REFRESH_TOKEN_EXPIRES_IN' },
    { label: 'Hiệu lực mã OTP kích hoạt', value: `${OTP_TTL_MINUTES} phút`, source: 'emailTemplates.js' },
    { label: 'Hiệu lực link đặt lại mật khẩu', value: `${RESET_TTL_MINUTES} phút`, source: 'emailTemplates.js' },
    { label: 'Cảnh báo dò mật khẩu (nhật ký hệ thống)', value: `Từ ${BRUTE_FORCE.threshold} lần sai / ${BRUTE_FORCE.windowMinutes} phút / IP`, source: 'auditRules.js' }
  ],
  rateLimits: RATE_LIMIT_RULES.map((rule) => ({ ...rule, source: 'rateLimiter.js' })),
  uploads: [
    ...Object.entries(UPLOAD_PURPOSES).map(([purpose, rule]) => ({
      purpose,
      maxSizeMb: rule.maxSize / MB,
      extensions: rule.extensions,
      source: 'uploadService.js'
    })),
    // Bài tập: giảng viên tự đặt cho từng đề (1-100MB), mặc định 25MB, định dạng pdf,zip,docx
    { purpose: 'assignment_submission', maxSizeMb: 25, maxSizeMbLimit: 100, extensions: ['pdf', 'zip', 'docx'], source: 'Giảng viên đặt theo từng đề bài tập' }
  ]
});

/**
 * GET /settings - chỉ Admin: A. tình trạng, B. chính sách (chỉ xem), C. cài đặt sửa được
 */
export const getAdminSettings = async () => {
  const [status, settings, rows] = await Promise.all([
    getStatus(),
    getSettings(),
    SystemSetting.findAll({ include: [{ model: models.User, as: 'updater', attributes: ['full_name', 'email'], paranoid: false }] }).catch(() => [])
  ]);
  const updatedOf = Object.fromEntries(rows.map((r) => [r.key, { updatedAt: r.updated_at, updatedBy: r.updater ? r.updater.full_name || r.updater.email : null }]));
  return {
    status,
    policies: getPolicies(),
    settings,
    settingsMeta: Object.fromEntries(Object.entries(SETTING_DEFINITIONS).map(([name, def]) => [name, { label: def.label, ...(updatedOf[def.key] || { updatedAt: null, updatedBy: null }) }]))
  };
};

/**
 * PATCH /settings - chỉ Admin. Chỉ lưu khóa thay đổi; mỗi khóa đổi ghi một dòng nhật ký SETTING_CHANGED.
 */
export const updateSettings = async (patch, currentUser) => {
  const before = await getSettings();
  const after = resolveSettings(Object.fromEntries(
    Object.entries(SETTING_DEFINITIONS).map(([name, def]) => [def.key, patch[name] !== undefined
      ? (typeof def.defaultValue === 'object' ? { ...before[name], ...patch[name] } : patch[name])
      : before[name]])
  ));
  if (after.announcement.enabled && !after.announcement.message.trim()) {
    throw new AppError('Vui lòng nhập nội dung thông báo trước khi bật hiển thị', 400, 'Bad Request');
  }

  const changes = diffSettings(before, after);
  if (changes.length === 0) return { settings: before, changed: [] };

  try {
    for (const change of changes) {
      await SystemSetting.upsert({ key: change.key, value: change.after, updated_by: currentUser.id });
    }
  } catch (error) {
    console.error('[settings] Lưu cài đặt thất bại:', error.message);
    throw new AppError('Không lưu được cài đặt. Kiểm tra đã chạy migration bảng system_settings chưa (npm run db:migrate:settings).', 503, 'Service Unavailable');
  }
  cache = null;

  for (const change of changes) {
    await logAudit('SETTING_CHANGED', {
      target: { type: 'setting', id: change.key, label: change.label },
      metadata: { before: change.before, after: change.after }
    });
  }
  return { settings: await getSettings(), changed: changes.map((c) => c.name) };
};

/**
 * Chặn tự đăng ký khi Admin đã tắt (authService.register gọi)
 */
export const assertSelfRegistrationOpen = async () => {
  const { allowSelfRegistration } = await getSettings();
  if (!allowSelfRegistration) {
    throw new AppError('Hệ thống đang tạm ngừng nhận đăng ký tài khoản mới. Vui lòng liên hệ quản trị viên hoặc thử lại sau.', 403, 'Forbidden');
  }
};
