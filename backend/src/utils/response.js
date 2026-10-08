/**
 * Unified Response Envelope Utility
 * Follows docs/api/api-conventions.md
 */

export const sendSuccess = (res, statusCode = 200, message = 'Thao tác thành công', data = null) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const sendError = (res, statusCode = 500, error = 'Internal Server Error', message = 'Đã có lỗi xảy ra', errors = null) => {
  const payload = {
    success: false,
    statusCode,
    error,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors && errors.length > 0) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};
