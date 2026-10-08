import Joi from 'joi';
import { sendError } from '../utils/response.js';

// Password policy regex: min 8, max 32, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:,.<>])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:,.<>]{8,32}$/;
const passwordMessage = 'Mật khẩu phải từ 8 đến 32 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt';

// ==========================================
// Reusable Base Validators (DRY Principle)
// ==========================================

const emailField = Joi.string().trim().lowercase().email().max(255).required().messages({
  'string.email': 'Địa chỉ email không đúng định dạng',
  'string.empty': 'Email không được để trống',
  'string.max': 'Email không được vượt quá 255 ký tự',
  'any.required': 'Email là trường bắt buộc'
});

const strongPasswordField = (fieldName = 'Mật khẩu') => Joi.string().pattern(passwordPattern).required().messages({
  'string.pattern.base': passwordMessage,
  'string.empty': `${fieldName} không được để trống`,
  'any.required': `${fieldName} là trường bắt buộc`
});

const otpField = Joi.string().trim().length(6).pattern(/^\d+$/).required().messages({
  'string.length': 'Mã OTP phải gồm đúng 6 chữ số',
  'string.pattern.base': 'Mã OTP chỉ được chứa các ký tự số',
  'string.empty': 'Mã OTP không được để trống',
  'any.required': 'Mã OTP là trường bắt buộc'
});

// ==========================================
// Authentication Schemas
// ==========================================

export const registerSchema = Joi.object({
  email: emailField,
  password: strongPasswordField('Mật khẩu'),
  fullName: Joi.string().min(2).max(150).trim().required().messages({
    'string.min': 'Họ và tên phải có ít nhất 2 ký tự',
    'string.max': 'Họ và tên không được vượt quá 150 ký tự',
    'string.empty': 'Họ và tên không được để trống',
    'any.required': 'Họ và tên là trường bắt buộc'
  })
});

export const verifyOtpSchema = Joi.object({
  email: emailField,
  otp: otpField
});

export const resendOtpSchema = Joi.object({
  email: emailField
});

export const loginSchema = Joi.object({
  email: emailField,
  password: Joi.string().max(128).required().messages({
    'string.empty': 'Mật khẩu không được để trống',
    'string.max': 'Mật khẩu không được vượt quá 128 ký tự',
    'any.required': 'Mật khẩu là trường bắt buộc'
  })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional().messages({
    'string.base': 'Refresh Token phải là chuỗi ký tự'
  })
});

export const forgotPasswordSchema = Joi.object({
  email: emailField
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Token đặt lại mật khẩu không được để trống',
    'any.required': 'Token đặt lại mật khẩu là bắt buộc'
  }),
  newPassword: strongPasswordField('Mật khẩu mới')
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Mật khẩu hiện tại không được để trống',
    'any.required': 'Mật khẩu hiện tại là bắt buộc'
  }),
  newPassword: strongPasswordField('Mật khẩu mới').invalid(Joi.ref('currentPassword')).messages({
    'any.invalid': 'Mật khẩu mới không được trùng với mật khẩu hiện tại'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Mật khẩu xác nhận không khớp với mật khẩu mới',
    'string.empty': 'Mật khẩu xác nhận không được để trống',
    'any.required': 'Mật khẩu xác nhận là bắt buộc'
  })
});

/**
 * Validation Middleware generator
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errorDetails = error.details.map(detail => detail.message);
    return sendError(res, 400, 'Bad Request', 'Dữ liệu gửi lên không hợp lệ', errorDetails);
  }
  req.body = value;
  next();
};
