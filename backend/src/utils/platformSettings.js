import { mailModeOf, mailFromOf } from './mailConfig.js';

/**
 * Cấu hình nền tảng ở dạng CHỈ ĐỌC cho trang Cài đặt hệ thống của Admin (docs/api/api-audit-logs.md, mục Cài đặt).
 * Hàm thuần: nhận biến môi trường và hằng số từ nơi gọi, chỉ trả những giá trị an toàn để hiển thị.
 * KHÔNG BAO GIỜ trả: mật khẩu, khóa bí mật, token, chuỗi kết nối CSDL/Redis, thông tin đăng nhập SMTP/AWS.
 * Unit test: tests/unit/platformSettings.test.js.
 */

export const PASSWORD_POLICY = '8–32 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt';

const clean = (value) => (typeof value === 'string' ? value.trim() : '');
const MB = 1024 * 1024;

export const buildPlatformSettings = ({ env = {}, rateLimits = {}, uploadPurposes = {}, nodeVersion = null, uploadUrlExpirySeconds = null } = {}) => {
  const mail = mailModeOf(env);
  const s3Configured = clean(env.AWS_REGION) !== '' && clean(env.S3_BUCKET) !== '';
  const aiConfigured = clean(env.GEMINI_API_KEY) !== '';
  const fallback = env.GEMINI_FALLBACK_MODEL === undefined ? 'gemini-flash-lite-latest' : clean(env.GEMINI_FALLBACK_MODEL);

  return {
    environment: { nodeEnv: clean(env.NODE_ENV) || 'development', nodeVersion },
    security: {
      accessTokenTtl: clean(env.JWT_EXPIRES_IN) || '15m',
      refreshTokenTtl: clean(env.REFRESH_TOKEN_EXPIRES_IN) || '7d',
      passwordPolicy: PASSWORD_POLICY,
      rateLimits: Object.entries(rateLimits).map(([key, rule]) => ({
        key,
        label: rule.label,
        scope: rule.scope,
        max: rule.max,
        windowMinutes: Math.round((rule.windowMs / 60000) * 100) / 100
      }))
    },
    storage: {
      provider: s3Configured ? 's3' : 'local',
      // Tên bucket và region không phải bí mật; khóa truy cập thì không bao giờ được trả
      ...(s3Configured ? { region: clean(env.AWS_REGION), bucket: clean(env.S3_BUCKET) } : {}),
      uploadUrlExpirySeconds,
      limits: Object.entries(uploadPurposes).map(([purpose, rule]) => ({
        purpose,
        maxSizeMb: Math.round((rule.maxSize / MB) * 100) / 100,
        extensions: [...rule.extensions],
        isPublic: Boolean(rule.isPublic)
      }))
    },
    email: {
      mode: `${mail.useQueue ? 'queue' : 'direct'}_${mail.transport}`,
      useQueue: mail.useQueue,
      transport: mail.transport,
      from: mail.transport === 'smtp' ? mailFromOf(env) : null,
      smtpHost: mail.transport === 'smtp' ? clean(env.SMTP_HOST) : null
    },
    ai: {
      configured: aiConfigured,
      model: aiConfigured ? clean(env.GEMINI_MODEL) || 'gemini-flash-latest' : null,
      fallbackModel: aiConfigured && fallback ? fallback : null
    }
  };
};
