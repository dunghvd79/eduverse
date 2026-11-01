import { Op } from 'sequelize';
import { AuditLog } from '../models/index.js';
import { createAuditRecorder } from '../utils/auditRecorder.js';
import {
  AUDIT_ACTIONS, AUDIT_CATEGORIES, EXPORT_MAX_ROWS, buildAuditWhere, serializeAuditLog, buildAuditCsv
} from '../utils/auditRules.js';

/**
 * Nhật ký hệ thống (docs/api/api-audit-logs.md).
 *   record(...)  ghi một dòng, không bao giờ ném lỗi — gọi trong controller SAU khi thao tác thành công
 *   listAuditLogs / exportAuditLogs  chỉ Admin (route /admin/audit-logs)
 */
export const record = createAuditRecorder({ create: (row) => AuditLog.create(row) });

const ORDER = [['created_at', 'DESC'], ['id', 'DESC']];

export const getActionCatalog = () => ({
  categories: Object.entries(AUDIT_CATEGORIES).map(([key, label]) => ({ key, label })),
  actions: Object.entries(AUDIT_ACTIONS).map(([key, { label, category }]) => ({ key, label, category }))
});

export const listAuditLogs = async ({ page = 1, limit = 20, ...filters }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const { rows, count } = await AuditLog.findAndCountAll({
    where: buildAuditWhere(filters, Op),
    order: ORDER,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum,
    raw: true
  });
  const totalPages = Math.ceil(count / limitNum) || 1;
  return {
    items: rows.map(serializeAuditLog),
    meta: {
      page: pageNum,
      limit: limitNum,
      totalItems: count,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1
    }
  };
};

/** CSV của EXPORT_MAX_ROWS dòng mới nhất khớp bộ lọc. */
export const exportAuditLogs = async (filters) => {
  const rows = await AuditLog.findAll({
    where: buildAuditWhere(filters, Op),
    order: ORDER,
    limit: EXPORT_MAX_ROWS,
    raw: true
  });
  return { csv: buildAuditCsv(rows.map(serializeAuditLog)), rowCount: rows.length, limit: EXPORT_MAX_ROWS };
};

export default { record, getActionCatalog, listAuditLogs, exportAuditLogs };
