import * as auditService from '../services/auditService.js';
import { sendSuccess } from '../utils/response.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const data = await auditService.getAuditLogs(req.query);
    return sendSuccess(res, 200, 'Lấy nhật ký hệ thống thành công', data);
  } catch (error) {
    next(error);
  }
};

export const exportAuditLogs = async (req, res, next) => {
  try {
    const { buffer, fileName, contentType, truncated } = await auditService.exportAuditLogs(req.query);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', buffer.length);
    // Báo cho frontend khi kết quả bị cắt ở 10.000 dòng
    res.setHeader('X-Export-Truncated', truncated ? 'true' : 'false');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Export-Truncated');
    return res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};

export default { getAuditLogs, exportAuditLogs };
