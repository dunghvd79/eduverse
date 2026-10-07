import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { sequelize, User, UserToken } from '../models/index.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  hashOtp,
  generateOtp,
  generateSecureRandomToken
} from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Format user entity to camelCase DTO for API response
 */
export const formatUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  avatarUrl: user.avatar_url,
  role: user.role,
  emailVerified: user.email_verified,
  isActive: user.is_active,
  mustChangePassword: user.must_change_password,
  createdAt: user.created_at
});

/**
 * Cấp cặp Access/Refresh Token mới và lưu hash của Refresh Token vào DB
 */
const issueTokenPair = async (user, transaction) => {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });

  await UserToken.create({
    user_id: user.id,
    token_hash: hashToken(refreshToken),
    token_type: 'refresh_token',
    expires_at: new Date(Date.now() + REFRESH_TTL_MS),
    is_used: false
  }, { transaction });

  return { accessToken, refreshToken };
};

/**
 * Đánh dấu token đã dùng một cách nguyên tử.
 * Trả về false nếu một request song song đã dùng token này trước (chống dùng lại token).
 */
const consumeToken = async (tokenId, transaction) => {
  const [affectedRows] = await UserToken.update(
    { is_used: true },
    { where: { id: tokenId, is_used: false }, transaction }
  );
  return affectedRows === 1;
};

/**
 * Xóa các OTP kích hoạt cũ của user và tạo OTP mới. Trả về OTP dạng plain text để gửi email.
 */
const createEmailOtp = async (userId, transaction) => {
  await UserToken.destroy({
    where: { user_id: userId, token_type: 'email_verification' },
    transaction
  });

  const otp = generateOtp();
  await UserToken.create({
    user_id: userId,
    token_hash: hashOtp(userId, otp),
    token_type: 'email_verification',
    expires_at: new Date(Date.now() + OTP_TTL_MS),
    is_used: false
  }, { transaction });

  return otp;
};

/**
 * 1. Register a new student account
 */
export const register = async ({ email, password, fullName }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    if (existingUser.email_verified) {
      throw new AppError('Địa chỉ email này đã tồn tại trong hệ thống', 409, 'Conflict');
    }
    // If not verified, update password & resend OTP in a transaction
    const password_hash = await bcrypt.hash(password, 10);

    const otp = await sequelize.transaction(async (t) => {
      await existingUser.update({
        password_hash,
        full_name: fullName
      }, { transaction: t });

      return createEmailOtp(existingUser.id, t);
    });

    console.log(`\n📨 [DEV OTP EMAIL] Mã xác thực kích hoạt cho ${email}: ${otp}\n`);
    return formatUser(existingUser);
  }

  // Create new user & OTP in a transaction
  const password_hash = await bcrypt.hash(password, 10);
  let createdUser;

  const otp = await sequelize.transaction(async (t) => {
    createdUser = await User.create({
      email: normalizedEmail,
      password_hash,
      full_name: fullName,
      role: 'student',
      email_verified: false,
      is_active: true,
      must_change_password: false
    }, { transaction: t });

    return createEmailOtp(createdUser.id, t);
  });

  console.log(`\n📨 [DEV OTP EMAIL] Mã xác thực kích hoạt cho ${email}: ${otp}\n`);
  return formatUser(createdUser);
};

/**
 * 2. Verify OTP and automatically authenticate
 */
export const verifyOtp = async ({ email, otp }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError('Không tìm thấy tài khoản với email này', 404, 'Not Found');
  }

  if (!user.is_active) {
    const reason = user.block_reason ? `: ${user.block_reason}` : '';
    throw new AppError(`Tài khoản của bạn đã bị khóa${reason}`, 403, 'Forbidden');
  }

  if (user.email_verified) {
    throw new AppError('Tài khoản đã được kích hoạt email từ trước', 400, 'Bad Request');
  }

  const tokenRecord = await UserToken.findOne({
    where: {
      user_id: user.id,
      token_hash: hashOtp(user.id, otp),
      token_type: 'email_verification',
      is_used: false
    }
  });

  if (!tokenRecord) {
    throw new AppError('Mã OTP không chính xác', 400, 'Bad Request');
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    throw new AppError('Mã OTP đã hết hạn', 400, 'Bad Request');
  }

  // Mark OTP as used, activate user and issue token pair atomically
  const { accessToken, refreshToken } = await sequelize.transaction(async (t) => {
    if (!(await consumeToken(tokenRecord.id, t))) {
      throw new AppError('Mã OTP không chính xác', 400, 'Bad Request');
    }
    await user.update({ email_verified: true }, { transaction: t });
    return issueTokenPair(user, t);
  });

  return {
    accessToken,
    refreshToken,
    user: formatUser(user)
  };
};

/**
 * 3. Resend OTP
 */
export const resendOtp = async ({ email }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError('Không tìm thấy tài khoản', 404, 'Not Found');
  }

  if (!user.is_active) {
    const reason = user.block_reason ? `: ${user.block_reason}` : '';
    throw new AppError(`Tài khoản của bạn đã bị khóa${reason}`, 403, 'Forbidden');
  }

  if (user.email_verified) {
    throw new AppError('Tài khoản đã được kích hoạt trước đó', 400, 'Bad Request');
  }

  const otp = await sequelize.transaction((t) => createEmailOtp(user.id, t));

  console.log(`\n📨 [DEV OTP RESEND] Mã xác thực mới cho ${email}: ${otp}\n`);
  return true;
};

/**
 * 4. Login
 */
export const login = async ({ email, password }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không chính xác', 401, 'Unauthorized');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Email hoặc mật khẩu không chính xác', 401, 'Unauthorized');
  }

  if (!user.is_active) {
    const reason = user.block_reason ? `: ${user.block_reason}` : '';
    throw new AppError(`Tài khoản của bạn đã bị khóa${reason}`, 403, 'Forbidden');
  }

  if (!user.email_verified) {
    throw new AppError('Tài khoản chưa được kích hoạt email. Vui lòng xác thực mã OTP.', 403, 'Forbidden');
  }

  const { accessToken, refreshToken } = await issueTokenPair(user);

  return {
    accessToken,
    refreshToken,
    user: formatUser(user)
  };
};

/**
 * 5. Refresh Access Token & Token Rotation
 */
export const refreshSession = async ({ incomingToken }) => {
  if (!incomingToken) {
    throw new AppError('Phiên làm việc đã hết hạn hoặc không hợp lệ', 401, 'Unauthorized');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch (err) {
    throw new AppError('Phiên làm việc đã hết hạn hoặc không hợp lệ', 401, 'Unauthorized');
  }

  const tokenHash = hashToken(incomingToken);
  const tokenRecord = await UserToken.findOne({
    where: {
      user_id: decoded.sub,
      token_hash: tokenHash,
      token_type: 'refresh_token',
      is_used: false
    }
  });

  if (!tokenRecord || new Date(tokenRecord.expires_at) < new Date()) {
    throw new AppError('Phiên làm việc đã hết hạn hoặc không hợp lệ', 401, 'Unauthorized');
  }

  const user = await User.findByPk(decoded.sub);
  if (!user || !user.is_active) {
    throw new AppError('Tài khoản không tồn tại hoặc đã bị khóa', 401, 'Unauthorized');
  }

  // Token Rotation: consume current refresh token atomically, then issue new pair
  return sequelize.transaction(async (t) => {
    if (!(await consumeToken(tokenRecord.id, t))) {
      throw new AppError('Phiên làm việc đã hết hạn hoặc không hợp lệ', 401, 'Unauthorized');
    }
    return issueTokenPair(user, t);
  });
};

/**
 * 6. Logout & Revoke Session
 * Xác định phiên qua Refresh Token (cookie) nên vẫn đăng xuất được khi Access Token đã hết hạn.
 */
export const logout = async ({ incomingToken, allDevices }) => {
  if (!incomingToken) return true;

  const tokenRecord = await UserToken.findOne({
    where: { token_hash: hashToken(incomingToken), token_type: 'refresh_token', is_used: false }
  });
  if (!tokenRecord) return true;

  if (allDevices && new Date(tokenRecord.expires_at) > new Date()) {
    await UserToken.update(
      { is_used: true },
      { where: { user_id: tokenRecord.user_id, token_type: 'refresh_token', is_used: false } }
    );
  } else {
    await consumeToken(tokenRecord.id);
  }
  return true;
};

/**
 * 7. Forgot Password
 */
export const forgotPassword = async ({ email }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (user && user.is_active) {
    const resetToken = generateSecureRandomToken(32);

    // Bọc trong Transaction nguyên tử: Hủy token cũ và Tạo token mới cùng lúc
    await sequelize.transaction(async (t) => {
      await UserToken.update(
        { is_used: true },
        { where: { user_id: user.id, token_type: 'password_reset', is_used: false }, transaction: t }
      );

      await UserToken.create({
        user_id: user.id,
        token_hash: hashToken(resetToken),
        token_type: 'password_reset',
        expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
        is_used: false
      }, { transaction: t });
    });

    console.log(`\n🔗 [DEV RESET PASSWORD LINK] http://localhost:5173/reset-password?token=${resetToken}\n`);
  }

  // Always return true to prevent user enumeration
  return true;
};

/**
 * 8. Reset Password
 */
export const resetPassword = async ({ token, newPassword }) => {
  const tokenHash = hashToken(token);
  const tokenRecord = await UserToken.findOne({
    where: {
      token_hash: tokenHash,
      token_type: 'password_reset',
      is_used: false
    }
  });

  if (!tokenRecord || new Date(tokenRecord.expires_at) < new Date()) {
    throw new AppError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400, 'Bad Request');
  }

  const user = await User.findByPk(tokenRecord.user_id);
  if (!user) {
    throw new AppError('Không tìm thấy tài khoản người dùng', 404, 'Not Found');
  }

  if (!user.is_active) {
    const reason = user.block_reason ? `: ${user.block_reason}` : '';
    throw new AppError(`Tài khoản của bạn đã bị khóa${reason}`, 403, 'Forbidden');
  }

  const password_hash = await bcrypt.hash(newPassword, 10);

  await sequelize.transaction(async (t) => {
    if (!(await consumeToken(tokenRecord.id, t))) {
      throw new AppError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400, 'Bad Request');
    }

    await user.update({
      password_hash,
      must_change_password: false,
      email_verified: true
    }, { transaction: t });

    // Revoke all refresh tokens
    await UserToken.update(
      { is_used: true },
      { where: { user_id: user.id, token_type: 'refresh_token', is_used: false }, transaction: t }
    );
  });

  return true;
};

/**
 * 9. Change Password
 * Thu hồi mọi phiên cũ rồi cấp cặp token mới cho phiên hiện tại,
 * nhờ vậy chỉ các thiết bị khác bị đăng xuất. Dùng chung cho
 * PATCH /auth/change-password và PATCH /users/me/password.
 */
export const changePassword = async ({ user, currentPassword, newPassword }) => {
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw new AppError('Mật khẩu hiện tại không chính xác', 400, 'Bad Request');
  }

  const isSame = await bcrypt.compare(newPassword, user.password_hash);
  if (isSame) {
    throw new AppError('Mật khẩu mới không được trùng mật khẩu cũ', 400, 'Bad Request');
  }

  const password_hash = await bcrypt.hash(newPassword, 10);

  const { accessToken, refreshToken } = await sequelize.transaction(async (t) => {
    await user.update({
      password_hash,
      must_change_password: false
    }, { transaction: t });

    await UserToken.update(
      { is_used: true },
      { where: { user_id: user.id, token_type: 'refresh_token', is_used: false }, transaction: t }
    );

    return issueTokenPair(user, t);
  });

  return {
    accessToken,
    refreshToken,
    passwordChangedAt: new Date().toISOString(),
    mustChangePassword: false,
    revokedOtherSessions: true
  };
};

/**
 * 10. Get current user profile
 */
export const getMe = async ({ user }) => {
  return formatUser(user);
};
