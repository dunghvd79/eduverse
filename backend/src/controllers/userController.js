import * as userService from '../services/userService.js';
import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';
import { setRefreshCookie } from '../utils/authCookies.js';

/**
 * 1. GET /api/v1/users/me
 */
export const getMe = async (req, res, next) => {
  try {
    const data = await userService.getMe(req.user.id);
    return sendSuccess(res, 200, 'Lấy thông tin hồ sơ cá nhân thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. PATCH /api/v1/users/me
 */
export const updateMe = async (req, res, next) => {
  try {
    const data = await userService.updateMe(req.user.id, req.body);
    return sendSuccess(res, 200, 'Cập nhật hồ sơ cá nhân thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. PATCH /api/v1/users/me/password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { refreshToken, ...data } = await authService.changePassword({
      user: req.user,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword
    });
    setRefreshCookie(res, refreshToken);
    return sendSuccess(
      res,
      200,
      'Đổi mật khẩu thành công. Các phiên đăng nhập trên thiết bị khác đã được đăng xuất để bảo mật.',
      data
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/v1/users/:id/profile
 */
export const getPublicProfile = async (req, res, next) => {
  try {
    const data = await userService.getPublicProfile(req.params.id);
    return sendSuccess(res, 200, 'Lấy hồ sơ người dùng thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. GET /api/v1/users (Admin only)
 */
export const getUsers = async (req, res, next) => {
  try {
    const data = await userService.getUsersList(req.query);
    return sendSuccess(res, 200, 'Lấy danh sách người dùng thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. GET /api/v1/users/:id (Admin only)
 */
export const getUserById = async (req, res, next) => {
  try {
    const data = await userService.getUserById(req.params.id);
    return sendSuccess(res, 200, 'Lấy chi tiết người dùng thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * 7. POST /api/v1/users (Admin only)
 */
export const createUser = async (req, res, next) => {
  try {
    const data = await userService.adminCreateUser(req.body);
    return sendSuccess(
      res,
      201,
      'Khởi tạo tài khoản thành công. Thông tin mật khẩu tạm đã được ghi nhận.',
      data
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 8. PATCH /api/v1/users/:id (Admin only)
 */
export const updateUser = async (req, res, next) => {
  try {
    const data = await userService.adminUpdateUser(req.params.id, req.user.id, req.body);
    return sendSuccess(res, 200, 'Cập nhật phân quyền người dùng thành công', data);
  } catch (error) {
    next(error);
  }
};

/**
 * 9. PATCH /api/v1/users/:id/status (Admin only)
 */
export const updateStatus = async (req, res, next) => {
  try {
    const data = await userService.adminUpdateStatus(req.params.id, req.user.id, req.body);
    const msg = req.body.isActive
      ? 'Đã mở khóa tài khoản người dùng thành công'
      : 'Đã khóa tài khoản người dùng và thu hồi mọi phiên đăng nhập';
    return sendSuccess(res, 200, msg, data);
  } catch (error) {
    next(error);
  }
};

/**
 * 10. POST /api/v1/users/:id/reset-password (Admin only)
 */
export const resetPassword = async (req, res, next) => {
  try {
    const data = await userService.adminResetPassword(req.params.id);
    return sendSuccess(
      res,
      200,
      'Đặt lại mật khẩu thành công. Mật khẩu tạm thời mới đã được kích hoạt.',
      data
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 11. DELETE /api/v1/users/:id (Admin only)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const data = await userService.adminDeleteUser(req.params.id, req.user.id);
    return sendSuccess(res, 200, 'Đã xóa mềm tài khoản người dùng thành công', data);
  } catch (error) {
    next(error);
  }
};
