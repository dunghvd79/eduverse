export class AppError extends Error {
  constructor(message, statusCode = 400, error = 'Bad Request', errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
