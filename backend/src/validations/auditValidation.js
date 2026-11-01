import Joi from 'joi';
import { AUDIT_ACTIONS, AUDIT_CATEGORIES, AUDIT_RESULTS } from '../utils/auditRules.js';

const filters = {
  action: Joi.string().valid(...Object.keys(AUDIT_ACTIONS)).messages({ 'any.only': 'action không thuộc danh mục hành động (xem GET /admin/audit-logs/actions)' }),
  category: Joi.string().valid(...Object.keys(AUDIT_CATEGORIES)).messages({ 'any.only': 'category không hợp lệ (auth, user, course, system)' }),
  result: Joi.string().valid(...AUDIT_RESULTS).messages({ 'any.only': 'result không hợp lệ (success, failed)' }),
  search: Joi.string().trim().max(255).allow('').messages({
    'string.base': 'search phải là một chuỗi (không được truyền lặp lại nhiều lần)',
    'string.max': 'Từ khóa tìm kiếm không được vượt quá 255 ký tự'
  }),
  from: Joi.date().iso().messages({ 'date.format': 'from phải là thời điểm ISO 8601' }),
  to: Joi.date().iso().when('from', { is: Joi.exist(), then: Joi.date().min(Joi.ref('from')) }).messages({
    'date.format': 'to phải là thời điểm ISO 8601',
    'date.min': 'to phải sau hoặc bằng from'
  })
};

/** GET /admin/audit-logs */
export const queryAuditLogsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  ...filters
});

/** GET /admin/audit-logs/export (cùng bộ lọc, không phân trang) */
export const exportAuditLogsSchema = Joi.object({ ...filters });
