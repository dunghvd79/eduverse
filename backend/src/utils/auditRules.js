/**
 * Quy tắc thuần của Nhật ký hệ thống (docs/api/api-audit-logs.md). Có unit test: tests/unit/auditRules.test.js.
 * Không import model/CSDL để chạy được trong `npm test`.
 */

export const AUDIT_CATEGORIES = {
  auth: 'Xác thực',
  user: 'Người dùng',
  course: 'Khóa học',
  system: 'Hệ thống'
};

/** Danh mục hành động: khóa là mã lưu trong cột `action`, nhãn hiển thị cho Admin. */
export const AUDIT_ACTIONS = {
  'auth.register': { label: 'Đăng ký tài khoản', category: 'auth' },
  'auth.verify_email': { label: 'Kích hoạt email bằng OTP', category: 'auth' },
  'auth.login': { label: 'Đăng nhập', category: 'auth' },
  'auth.password_change': { label: 'Đổi mật khẩu', category: 'auth' },
  'auth.password_reset': { label: 'Đặt lại mật khẩu qua email', category: 'auth' },
  'user.create': { label: 'Tạo tài khoản', category: 'user' },
  'user.bulk_import': { label: 'Nhập tài khoản hàng loạt', category: 'user' },
  'user.update': { label: 'Sửa thông tin / vai trò tài khoản', category: 'user' },
  'user.lock': { label: 'Khóa tài khoản', category: 'user' },
  'user.unlock': { label: 'Mở khóa tài khoản', category: 'user' },
  'user.reset_password': { label: 'Đặt lại mật khẩu khẩn cấp', category: 'user' },
  'user.delete': { label: 'Xóa tài khoản', category: 'user' },
  'course.publish_request': { label: 'Gửi duyệt khóa học', category: 'course' },
  'course.approve': { label: 'Phê duyệt khóa học', category: 'course' },
  'course.reject': { label: 'Từ chối khóa học', category: 'course' },
  'course.unpublish': { label: 'Đưa khóa học về bản nháp', category: 'course' },
  'course.delete': { label: 'Xóa khóa học', category: 'course' },
  'audit.export': { label: 'Xuất nhật ký hệ thống', category: 'system' }
};

export const AUDIT_RESULTS = ['success', 'failed'];

export const MAX_ACTION_LENGTH = 60;
export const MAX_EMAIL_LENGTH = 255;
export const MAX_RESOURCE_ID_LENGTH = 64;
export const MAX_IP_LENGTH = 64;
export const MAX_USER_AGENT_LENGTH = 255;
export const MAX_METADATA_JSON_LENGTH = 2000;
export const EXPORT_MAX_ROWS = 5000;

export const actionsOfCategory = (category) =>
  Object.entries(AUDIT_ACTIONS).filter(([, v]) => v.category === category).map(([key]) => key);

export const actionLabelOf = (action) => AUDIT_ACTIONS[action]?.label ?? action;
export const categoryOf = (action) => AUDIT_ACTIONS[action]?.category ?? null;

const truncate = (value, max) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text.slice(0, max);
};

// Khóa chứa mật khẩu, token, OTP, mã băm... không bao giờ được lưu vào nhật ký
const SENSITIVE_KEY = /pass|token|otp|secret|hash|authoriz|cookie|credential/i;
const MAX_DEPTH = 3;
const MAX_ARRAY = 20;
const MAX_STRING = 300;

const sanitizeValue = (value, depth) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.slice(0, MAX_STRING);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (depth >= MAX_DEPTH) return null;
  if (Array.isArray(value)) return value.slice(0, MAX_ARRAY).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(key) || typeof item === 'function') continue;
      out[key] = sanitizeValue(item, depth + 1);
    }
    return out;
  }
  return null;
};

/**
 * Làm sạch dữ liệu đính kèm: bỏ khóa nhạy cảm, cắt chuỗi/mảng/độ sâu, giới hạn tổng kích thước.
 * Trả null khi không có gì để lưu.
 */
export const sanitizeMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const clean = sanitizeValue(metadata, 0);
  if (!clean || Object.keys(clean).length === 0) return null;
  if (JSON.stringify(clean).length > MAX_METADATA_JSON_LENGTH) return { truncated: true };
  return clean;
};

/** IP của người gọi (req.ip đã tính TRUST_PROXY), bỏ tiền tố IPv4-mapped của IPv6. */
export const clientIpOf = (req) => {
  const ip = typeof req?.ip === 'string' ? req.ip.replace(/^::ffff:/i, '') : null;
  return truncate(ip, MAX_IP_LENGTH);
};

export const userAgentOf = (req) => truncate(req?.headers?.['user-agent'], MAX_USER_AGENT_LENGTH);

/**
 * Dựng một dòng nhật ký (đúng tên cột của bảng audit_logs) từ thông tin thao tác.
 *   actor: người thực hiện đã xác thực (có id, email, role); actorEmail: dùng khi chưa có người dùng (đăng nhập sai)
 */
export const buildAuditEntry = ({ req, actor, actorEmail, action, resourceType, resourceId, result, metadata } = {}) => {
  const email = truncate(actor?.email ?? actorEmail, MAX_EMAIL_LENGTH);
  return {
    actor_id: actor?.id ?? null,
    actor_email: email ? email.toLowerCase() : null,
    actor_role: truncate(actor?.role, 30),
    action: truncate(action, MAX_ACTION_LENGTH) ?? 'unknown',
    resource_type: truncate(resourceType, 40),
    resource_id: truncate(resourceId, MAX_RESOURCE_ID_LENGTH),
    result: result === 'failed' ? 'failed' : 'success',
    ip: clientIpOf(req),
    user_agent: userAgentOf(req),
    metadata: sanitizeMetadata(metadata)
  };
};

/** Chuyển một dòng CSDL (đối tượng thuần) sang DTO camelCase của API. */
export const serializeAuditLog = (row) => ({
  id: row.id,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  actor: { id: row.actor_id ?? null, email: row.actor_email ?? null, role: row.actor_role ?? null },
  action: row.action,
  actionLabel: actionLabelOf(row.action),
  category: categoryOf(row.action),
  resourceType: row.resource_type ?? null,
  resourceId: row.resource_id ?? null,
  result: row.result,
  ip: row.ip ?? null,
  userAgent: row.user_agent ?? null,
  metadata: row.metadata ?? null
});

const escapeLike = (text) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Điều kiện lọc cho Sequelize. `Op` được truyền vào để hàm này không phải import sequelize (dễ unit test).
 *   filters: { action, category, result, search, from, to }
 */
export const buildAuditWhere = (filters = {}, Op) => {
  const where = {};
  if (filters.action) {
    where.action = filters.action;
  } else if (filters.category) {
    where.action = { [Op.in]: actionsOfCategory(filters.category) };
  }
  if (filters.result) where.result = filters.result;

  const search = typeof filters.search === 'string' ? filters.search.trim() : '';
  if (search) {
    const term = `%${escapeLike(search)}%`;
    where[Op.or] = [
      { actor_email: { [Op.iLike]: term } },
      { resource_id: { [Op.iLike]: term } },
      { ip: { [Op.iLike]: term } }
    ];
  }

  // Op.gte / Op.lte của Sequelize là Symbol nên Object.keys không thấy: phải kiểm tra theo filters, không theo range
  if (filters.from || filters.to) {
    where.created_at = {};
    if (filters.from) where.created_at[Op.gte] = filters.from;
    if (filters.to) where.created_at[Op.lte] = filters.to;
  }
  return where;
};

// Ô bắt đầu bằng = + - @ (hoặc tab/CR) bị Excel hiểu là công thức -> thêm dấu nháy đơn phía trước
const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  let text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const AUDIT_CSV_HEADERS = [
  'Thời gian (UTC)', 'Người thực hiện', 'Vai trò', 'Hành động', 'Mã hành động',
  'Loại đối tượng', 'Mã đối tượng', 'Kết quả', 'Địa chỉ IP', 'Chi tiết'
];

/** Tệp CSV UTF-8 có BOM (Excel đọc đúng tiếng Việt), xuống dòng CRLF. `items` là kết quả serializeAuditLog. */
export const buildAuditCsv = (items) => {
  const lines = [AUDIT_CSV_HEADERS.map(csvCell).join(',')];
  for (const item of items) {
    lines.push([
      item.createdAt, item.actor.email, item.actor.role, item.actionLabel, item.action,
      item.resourceType, item.resourceId, item.result, item.ip, item.metadata
    ].map(csvCell).join(','));
  }
  return `﻿${lines.join('\r\n')}\r\n`;
};
