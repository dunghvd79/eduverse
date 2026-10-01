import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { User } from '../models/index.js';

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

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
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
  authorizeRoles
};
