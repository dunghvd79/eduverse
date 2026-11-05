import Joi from 'joi';
import { AUDIT_ACTIONS, AUDIT_CATEGORIES, AUDIT_SEVERITIES, AUDIT_STATUSES } from '../utils/auditRules.js';

const filters = {
  search: Joi.string().trim().max(100).allow('').optional(),
  category: Joi.string().valid(...Object.keys(AUDIT_CATEGORIES)).optional()
    .messages({ 'any.only': 'Nhóm nhật ký không hợp lệ' }),
  severity: Joi.string().valid(...AUDIT_SEVERITIES).optional()
    .messages({ 'any.only': 'Mức độ phải là info, warning hoặc danger' }),
  status: Joi.string().valid(...AUDIT_STATUSES).optional()
    .messages({ 'any.only': 'Kết quả phải là success hoặc failure' }),
  action: Joi.string().valid(...Object.keys(AUDIT_ACTIONS)).optional()
    .messages({ 'any.only': 'Hành động không hợp lệ' }),
  from: Joi.date().iso().optional().messages({ 'date.format': 'Ngày bắt đầu phải theo định dạng YYYY-MM-DD' }),
  to: Joi.date().iso().min(Joi.ref('from')).optional()
    .messages({ 'date.format': 'Ngày kết thúc phải theo định dạng YYYY-MM-DD', 'date.min': 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu' })
};

/**
 * GET /audit-logs
 */
export const queryAuditLogsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  ...filters
});

/**
 * GET /audit-logs/export
 */
export const exportAuditLogsSchema = Joi.object({
  format: Joi.string().valid('csv').default('csv'),
  ...filters
});
