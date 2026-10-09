import Joi from 'joi';

// Password policy regex: min 8, max 32, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:,.<>])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:,.<>]{8,32}$/;
const passwordMessage = 'Mật khẩu phải từ 8 đến 32 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt';
const phonePattern = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

/**
 * 1. Self update profile schema
 */
export const updateMeSchema = Joi.object({
  fullName: Joi.string().min(2).max(150).trim().optional().messages({
    'string.min': 'Họ và tên phải có ít nhất 2 ký tự',
    'string.max': 'Họ và tên không được vượt quá 150 ký tự'
  }),
  phoneNumber: Joi.string().pattern(phonePattern).allow(null, '').optional().messages({
    'string.pattern.base': 'Số điện thoại không đúng định dạng (Ví dụ: 0987654321 hoặc +84987654321)'
  }),
  bio: Joi.string().max(500).allow(null, '').optional().messages({
    'string.max': 'Giới thiệu bản thân không được vượt quá 500 ký tự'
  }),
  avatarUrl: Joi.string().uri().allow(null, '').optional().messages({
    'string.uri': 'Đường dẫn ảnh đại diện (avatarUrl) phải là URL hợp lệ'
  })
});

/**
 * 2. Self change password schema
 */
export const changeMyPasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Mật khẩu hiện tại không được để trống',
    'any.required': 'Mật khẩu hiện tại là trường bắt buộc'
  }),
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    'string.pattern.base': passwordMessage,
    'string.empty': 'Mật khẩu mới không được để trống',
    'any.required': 'Mật khẩu mới là trường bắt buộc'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Mật khẩu xác nhận không khớp với mật khẩu mới',
    'any.required': 'Mật khẩu xác nhận là bắt buộc'
  })
});

/**
 * 3. Admin create user schema
 */
export const adminCreateUserSchema = Joi.object({
  email: Joi.string().email().max(255).required().messages({
    'string.email': 'Địa chỉ email không đúng định dạng',
    'string.empty': 'Email không được để trống',
    'any.required': 'Email là trường bắt buộc'
  }),
  fullName: Joi.string().min(2).max(150).trim().required().messages({
    'string.min': 'Họ và tên phải có ít nhất 2 ký tự',
    'string.max': 'Họ và tên không được vượt quá 150 ký tự',
    'string.empty': 'Họ và tên không được để trống',
    'any.required': 'Họ và tên là trường bắt buộc'
  }),
  role: Joi.string().valid('student', 'teacher', 'training_manager', 'admin').required().messages({
    'any.only': 'Vai trò phải là student, teacher, training_manager hoặc admin',
    'any.required': 'Vai trò là trường bắt buộc'
  }),
  phoneNumber: Joi.string().pattern(phonePattern).allow(null, '').optional().messages({
    'string.pattern.base': 'Số điện thoại không đúng định dạng'
  }),
  password: Joi.string().pattern(passwordPattern).allow(null, '').optional().messages({
    'string.pattern.base': passwordMessage
  })
});

/**
 * 4. Admin update user schema
 */
export const adminUpdateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(150).trim().optional().messages({
    'string.min': 'Họ và tên phải có ít nhất 2 ký tự',
    'string.max': 'Họ và tên không được vượt quá 150 ký tự'
  }),
  phoneNumber: Joi.string().pattern(phonePattern).allow(null, '').optional().messages({
    'string.pattern.base': 'Số điện thoại không đúng định dạng'
  }),
  role: Joi.string().valid('student', 'teacher', 'training_manager', 'admin').optional().messages({
    'any.only': 'Vai trò phải là student, teacher, training_manager hoặc admin'
  })
});

/**
 * 5. Admin update status schema (Lock/Unlock)
 */
export const adminUpdateStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'Trạng thái hoạt động (isActive) là bắt buộc'
  }),
  reason: Joi.when('isActive', {
    is: false,
    then: Joi.string().min(3).max(500).required().messages({
      'string.empty': 'Vui lòng cung cấp lý do khi thực hiện khóa tài khoản',
      'any.required': 'Vui lòng cung cấp lý do khi thực hiện khóa tài khoản'
    }),
    otherwise: Joi.string().allow(null, '').optional()
  })
});

/**
 * 6. Query schema cho GET /users (Admin: danh sách người dùng)
 */
export const queryUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'page phải là số nguyên',
    'number.min': 'page phải lớn hơn hoặc bằng 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'limit phải là số nguyên',
    'number.min': 'limit phải lớn hơn hoặc bằng 1',
    'number.max': 'limit tối đa là 100'
  }),
  search: Joi.string().trim().max(255).allow('').optional().messages({
    'string.base': 'search phải là một chuỗi (không được truyền lặp lại nhiều lần)',
    'string.max': 'Từ khóa tìm kiếm không được vượt quá 255 ký tự'
  }),
  role: Joi.string().valid('student', 'teacher', 'training_manager', 'admin').optional().messages({
    'any.only': 'role không hợp lệ (student, teacher, training_manager, admin)'
  }),
  status: Joi.string().valid('active', 'blocked', 'unverified').optional().messages({
    'any.only': 'status không hợp lệ (active, blocked, unverified)'
  }),
  sortBy: Joi.string().valid('createdAt', 'fullName', 'email', 'role').default('createdAt').messages({
    'any.only': 'sortBy không hợp lệ (createdAt, fullName, email, role)'
  }),
  sortOrder: Joi.string().uppercase().valid('ASC', 'DESC').default('DESC').messages({
    'any.only': 'sortOrder chỉ nhận ASC hoặc DESC'
  })
});
