import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';
import { setRefreshCookie, clearRefreshCookie } from '../utils/authCookies.js';

/**
 * POST /api/v1/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    return sendSuccess(
      res,
      201,
      'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực OTP kích hoạt tài khoản.',
      user
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/verify-otp
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.verifyOtp(req.body);
    setRefreshCookie(res, refreshToken);
    return sendSuccess(
      res,
      200,
      'Kích hoạt tài khoản thành công!',
      { accessToken, user }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/resend-otp
 */
export const resendOtp = async (req, res, next) => {
  try {
    await authService.resendOtp(req.body);
    return sendSuccess(
      res,
      200,
      'Mã OTP mới đã được gửi vào hòm thư của bạn.',
      null
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);
    setRefreshCookie(res, refreshToken);
    return sendSuccess(
      res,
      200,
      'Đăng nhập thành công',
      { accessToken, user }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh-token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshSession({ incomingToken });
    setRefreshCookie(res, newRefreshToken);
    return sendSuccess(
      res,
      200,
      'Cấp lại Access Token thành công',
      { accessToken }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await authService.logout({
      incomingToken,
      allDevices: req.body?.allDevices === true
    });
    clearRefreshCookie(res);
    return sendSuccess(
      res,
      200,
      'Đăng xuất thành công',
      null
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body);
    return sendSuccess(
      res,
      200,
      'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn.',
      null
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    return sendSuccess(
      res,
      200,
      'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.',
      null
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { refreshToken, ...result } = await authService.changePassword({
      user: req.user,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword
    });
    // Phiên hiện tại nhận Refresh Token mới, các thiết bị khác bị thu hồi
    setRefreshCookie(res, refreshToken);
    return sendSuccess(
      res,
      200,
      'Đổi mật khẩu thành công. Các phiên đăng nhập trên thiết bị khác đã được thu hồi.',
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe({ user: req.user });
    return sendSuccess(
      res,
      200,
      'Xác thực phiên làm việc thành công',
      user
    );
  } catch (error) {
    next(error);
  }
};
