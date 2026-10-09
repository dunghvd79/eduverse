import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { User } from '../models/index.js';

// Các API vẫn được gọi khi tài khoản đang dùng mật khẩu tạm (must_change_password = true)
const MUST_CHANGE_PASSWORD_ALLOWLIST = new Set([
  'GET /api/v1/auth/me',
  'PATCH /api/v1/auth/change-password',
  'GET /api/v1/users/me',
  'GET /api/v1/users/me/profile',
  'PATCH /api/v1/users/me/password'
]);

/**
 * Middleware: Verify JWT Access Token in Authorization header
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Unauthorized', 'Phiên làm việc không hợp lệ hoặc thiếu Token xác thực');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Unauthorized', 'Access Token đã hết hạn. Vui lòng làm mới phiên làm việc.');
      }
      return sendError(res, 401, 'Unauthorized', 'Token xác thực không hợp lệ hoặc đã bị chỉnh sửa.');
    }

    // Lookup user in DB to verify account state
    const user = await User.findByPk(decoded.sub);
    if (!user) {
      return sendError(res, 401, 'Unauthorized', 'Tài khoản liên kết với phiên đăng nhập không còn tồn tại.');
    }

    if (!user.is_active) {
      const reasonMsg = user.block_reason ? `: ${user.block_reason}` : '';
      return sendError(res, 403, 'Forbidden', `Tài khoản của bạn đã bị khóa${reasonMsg}`);
    }

    if (user.must_change_password) {
      const routeKey = `${req.method} ${req.baseUrl}${req.path}`.replace(/\/$/, '');
      if (!MUST_CHANGE_PASSWORD_ALLOWLIST.has(routeKey)) {
        return sendError(res, 403, 'Forbidden', 'Bạn cần đổi mật khẩu tạm thời trước khi tiếp tục sử dụng hệ thống.', ['MUST_CHANGE_PASSWORD']);
      }
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Optional Authentication (cho route công khai như danh sách/chi tiết khóa học)
 * Có token hợp lệ -> gắn req.user; không có hoặc token lỗi -> req.user = null và vẫn cho đi tiếp.
 * Tài khoản bị khóa hoặc đang dùng mật khẩu tạm được coi như khách.
 */
export const optionalAuthenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.sub);

    req.user = user && user.is_active && !user.must_change_password ? user : null;
    return next();
  } catch {
    req.user = null;
    return next();
  }
};

/**
 * Middleware: Role-based Authorization
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 403, 'Forbidden', 'Bạn không có quyền thực hiện hành động này.');
    }
    next();
  };
};

export default {
  authenticateToken,
  optionalAuthenticateToken,
  authorizeRoles
};
