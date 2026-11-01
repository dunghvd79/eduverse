import { buildAuditEntry } from './auditRules.js';

/**
 * Bộ ghi nhật ký: KHÔNG BAO GIỜ ném lỗi. Ghi nhật ký thất bại (CSDL chậm/mất kết nối, bảng chưa migrate)
 * không được làm hỏng thao tác chính của người dùng; chỉ cảnh báo ra log, tối đa một lần mỗi `warnIntervalMs`.
 * `create` được truyền vào (xem services/auditService.js) để file này không phụ thuộc CSDL. Unit test: tests/unit/auditRecorder.test.js.
 */
export const createAuditRecorder = ({ create, logger = console, warnIntervalMs = 60000, now = Date.now } = {}) => {
  let lastWarnAt = -Infinity;
  return async (input) => {
    try {
      await create(buildAuditEntry(input));
      return true;
    } catch (error) {
      const at = now();
      if (at - lastWarnAt >= warnIntervalMs) {
        lastWarnAt = at;
        logger.warn?.(`[AUDIT] Không ghi được nhật ký hệ thống (đã bỏ qua): ${error?.message || error}. Nếu báo thiếu bảng audit_logs, chạy: npm run db:migrate:audit-logs`);
      }
      return false;
    }
  };
};
