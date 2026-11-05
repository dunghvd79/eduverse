import { Op } from 'sequelize';
import models from '../models/index.js';
import { getRequestContext } from '../middlewares/requestContext.js';
import {
  AUDIT_ACTIONS, AUDIT_CATEGORIES, BRUTE_FORCE, severityOfFailedLogin, csvCell
} from '../utils/auditRules.js';

const { AuditLog, User } = models;

const EXPORT_LIMIT = 10000;
const DAY_MS = 24 * 60 * 60 * 1000;

// ==========================================
// 1. GHI NHẬT KÝ (gọi từ các service nghiệp vụ)
// ==========================================

/**
 * Ghi một dòng nhật ký. Không bao giờ ném lỗi: ghi nhật ký hỏng không được làm hỏng thao tác chính.
 * - actor: người thực hiện; mặc định lấy người đang đăng nhập của request. Đăng nhập thất bại với email
 *   không tồn tại thì không có actor, truyền actorEmail (email đã thử) để vẫn truy vết được.
 * - target: { type, id, label } đối tượng bị tác động; metadata: dữ liệu trước/sau (không chứa mật khẩu, token).
 */
export const logAudit = async (action, { actor, actorEmail = null, status = 'success', target = null, metadata = null } = {}) => {
  const definition = AUDIT_ACTIONS[action];
  if (!definition) {
    console.error(`[audit] Hành động không có trong danh mục: ${action}`);
    return;
  }
  try {
    const context = getRequestContext();
    const who = actor === undefined ? context.user : actor;

    let { severity } = definition;
    if (action === 'LOGIN_FAILED' && context.ip) {
      const since = new Date(Date.now() - BRUTE_FORCE.windowMinutes * 60 * 1000);
      const recent = await AuditLog.count({ where: { action, ip_address: context.ip, created_at: { [Op.gte]: since } } });
      severity = severityOfFailedLogin(recent + 1);
    }

    await AuditLog.create({
      actor_id: who?.id || null,
      actor_email: who?.email || actorEmail || null,
      actor_role: who?.role || null,
      action,
      category: definition.category,
      severity,
      status,
      target_type: target?.type || null,
      target_id: target?.id ? String(target.id) : null,
      target_label: target?.label ? String(target.label).slice(0, 255) : null,
      ip_address: context.ip,
      user_agent: context.userAgent,
      metadata
    });
  } catch (error) {
    console.error(`[audit] Không ghi được nhật ký ${action}:`, error.message);
  }
};

// Đối tượng hay dùng
export const userTarget = (user) => ({ type: 'user', id: user.id, label: user.email });
export const courseTarget = (course) => ({ type: 'course', id: course.id, label: course.title });

// ==========================================
// 2. TRA CỨU (GET /audit-logs, chỉ Admin)
// ==========================================

const buildWhere = ({ search, category, severity, status, action, from, to }) => {
  const where = {};
  if (category) where.category = category;
  if (severity) where.severity = severity;
  if (status) where.status = status;
  if (action) where.action = action;
  if (from || to) {
    where.created_at = {
      ...(from ? { [Op.gte]: new Date(from) } : {}),
      // "đến ngày" tính trọn ngày đó
      ...(to ? { [Op.lt]: new Date(new Date(to).getTime() + DAY_MS) } : {})
    };
  }
  if (search) {
    const keyword = `%${search.trim()}%`;
    where[Op.or] = [
      { actor_email: { [Op.iLike]: keyword } },
      { action: { [Op.iLike]: keyword } },
      { target_label: { [Op.iLike]: keyword } },
      { ip_address: { [Op.iLike]: keyword } }
    ];
  }
  return where;
};

const toDto = (log) => ({
  id: log.id,
  createdAt: log.created_at,
  actor: {
    id: log.actor_id,
    email: log.actor_email,
    role: log.actor_role,
    fullName: log.actor?.full_name || null
  },
  action: log.action,
  actionLabel: AUDIT_ACTIONS[log.action]?.label || log.action,
  category: log.category,
  categoryLabel: AUDIT_CATEGORIES[log.category] || log.category,
  severity: log.severity,
  status: log.status,
  target: log.target_type ? { type: log.target_type, id: log.target_id, label: log.target_label } : null,
  ipAddress: log.ip_address,
  userAgent: log.user_agent,
  metadata: log.metadata
});

const ACTOR_INCLUDE = { model: User, as: 'actor', attributes: ['full_name'], paranoid: false };

/**
 * GET /audit-logs - mới nhất trước; summary = số liệu 24 giờ qua cho các thẻ đầu trang
 */
export const getAuditLogs = async (query) => {
  const { page = 1, limit = 20 } = query;
  const since = new Date(Date.now() - DAY_MS);
  const [{ rows, count }, last24h, failedLogins24h, danger24h] = await Promise.all([
    AuditLog.findAndCountAll({
      where: buildWhere(query),
      include: [ACTOR_INCLUDE],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    }),
    AuditLog.count({ where: { created_at: { [Op.gte]: since } } }),
    AuditLog.count({ where: { action: 'LOGIN_FAILED', created_at: { [Op.gte]: since } } }),
    AuditLog.count({ where: { severity: 'danger', created_at: { [Op.gte]: since } } })
  ]);
  const totalPages = Math.ceil(count / limit) || 1;

  return {
    items: rows.map(toDto),
    summary: { last24h, failedLogins24h, danger24h },
    filters: {
      categories: Object.entries(AUDIT_CATEGORIES).map(([value, label]) => ({ value, label })),
      actions: Object.entries(AUDIT_ACTIONS).map(([value, { label, category }]) => ({ value, label, category }))
    },
    meta: { page, limit, totalItems: count, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 }
  };
};

/**
 * GET /audit-logs/export - CSV theo cùng bộ lọc (UC-ADMIN-006), tối đa 10.000 dòng mới nhất
 */
export const exportAuditLogs = async (query) => {
  const rows = await AuditLog.findAll({
    where: buildWhere(query),
    include: [ACTOR_INCLUDE],
    order: [['created_at', 'DESC']],
    limit: EXPORT_LIMIT
  });
  const header = ['Thời gian', 'Email người thực hiện', 'Vai trò', 'Hành động', 'Mã hành động', 'Nhóm', 'Mức độ', 'Kết quả',
    'Đối tượng', 'Mã đối tượng', 'Tên đối tượng', 'IP', 'Trình duyệt', 'Chi tiết'];
  const lines = rows.map(toDto).map((log) => [
    new Date(log.createdAt).toISOString(), log.actor.email, log.actor.role, log.actionLabel, log.action, log.categoryLabel,
    log.severity, log.status, log.target?.type, log.target?.id, log.target?.label, log.ipAddress, log.userAgent, log.metadata
  ]);
  const csv = '﻿' + [header, ...lines].map((line) => line.map(csvCell).join(',')).join('\r\n');
  const stamp = new Date().toISOString().slice(0, 10);
  return { buffer: Buffer.from(csv, 'utf8'), fileName: `nhat-ky-he-thong-${stamp}.csv`, contentType: 'text/csv; charset=utf-8', truncated: rows.length === EXPORT_LIMIT };
};
