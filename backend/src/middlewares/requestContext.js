import { AsyncLocalStorage } from 'node:async_hooks';
import { normalizeIp } from '../utils/auditRules.js';

/**
 * Ngữ cảnh của request hiện tại (IP, trình duyệt, người đăng nhập) cho các service cần ghi nhật ký
 * mà không phải truyền `req` qua từng hàm. IP đọc từ req.ip nên tôn trọng TRUST_PROXY (app.js).
 */
const storage = new AsyncLocalStorage();

export const requestContext = (req, res, next) => {
  storage.run({ req }, next);
};

export const getRequestContext = () => {
  const req = storage.getStore()?.req;
  if (!req) return { ip: null, userAgent: null, user: null };
  return {
    ip: normalizeIp(req.ip),
    userAgent: req.get('user-agent')?.slice(0, 500) || null,
    // Gắn bởi authenticateToken (chạy sau middleware này) nên đọc lúc cần, không chụp lúc vào
    user: req.user || null
  };
};
