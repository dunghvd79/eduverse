import * as auditService from '../services/auditService.js';
import * as settingsService from '../services/settingsService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/v1/admin/audit-logs/actions
 */
export const getActions = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Lấy danh mục hành động thành công', auditService.getActionCatalog());
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/audit-logs
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const data = await auditService.listAuditLogs(req.query);
    return sendSuccess(res, 200, 'Lấy nhật ký hệ thống thành công', data);
  } catch (error) {
    next(error);
  }
};

const pad = (n) => String(n).padStart(2, '0');

/**
 * GET /api/v1/admin/audit-logs/export — trả tệp CSV (không bọc envelope), việc xuất cũng được ghi vào nhật ký
 */
export const exportAuditLogs = async (req, res, next) => {
  try {
    const { csv, rowCount, limit } = await auditService.exportAuditLogs(req.query);
    await auditService.record({
      req,
      actor: req.user,
      action: 'audit.export',
      resourceType: 'audit_logs',
      metadata: { rows: rowCount, filters: req.query }
    });
    const now = new Date();
    const fileName = `Nhat_Ky_He_Thong_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('X-Export-Row-Count', String(rowCount));
    res.setHeader('X-Export-Row-Limit', String(limit));
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/settings
 */
export const getSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getPlatformSettings();
    return sendSuccess(res, 200, 'Lấy cấu hình nền tảng thành công', data);
  } catch (error) {
    next(error);
  }
};
