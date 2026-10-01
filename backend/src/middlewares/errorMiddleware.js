import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('💥 Error Caught in Middleware:', err);

  // 1. AppError (Operational errors intentionally thrown)
  if (err.isOperational) {
    return sendError(res, err.statusCode, err.error, err.message, err.errors);
  }

  // 2. Sequelize Unique Constraint Error (e.g., duplicate email)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors ? err.errors.map(e => e.message) : ['Bản ghi đã tồn tại trong hệ thống'];
    return sendError(res, 409, 'Conflict', 'Dữ liệu đã tồn tại trong hệ thống', messages);
  }

  // 3. Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors ? err.errors.map(e => e.message) : ['Dữ liệu không hợp lệ'];
    return sendError(res, 400, 'Bad Request', 'Dữ liệu không đáp ứng ràng buộc của hệ thống', messages);
  }

  // 4. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Unauthorized', 'Token xác thực không hợp lệ');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Unauthorized', 'Token xác thực đã hết hạn');
  }

  // 5. Default 500 Server Error
  const message = process.env.NODE_ENV === 'production' 
    ? 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.' 
    : err.message || 'Lỗi máy chủ không xác định';

  return sendError(res, 500, 'Internal Server Error', message);
};

export default errorHandler;
