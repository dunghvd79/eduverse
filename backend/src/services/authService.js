import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, UserToken } from '../models/index.js';
import { 
  signAccessToken, 
  signRefreshToken, 
  verifyRefreshToken, 
  hashToken, 
  generateOtp, 
  generateSecureRandomToken 
} from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

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
 * 1. Register a new student account
 */
export const register = async ({ email, password, fullName }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    if (existingUser.email_verified) {
      throw new AppError('Địa chỉ email này đã tồn tại trong hệ thống', 409, 'Conflict');
    }
    // If not verified, update password & resend OTP
    const password_hash = await bcrypt.hash(password, 10);
    await existingUser.update({
      password_hash,
      full_name: fullName
    });

    // Invalidate old OTPs
    await UserToken.update(
      { is_used: true },
      { where: { user_id: existingUser.id, token_type: 'email_verification', is_used: false } }
    );

    const otp = generateOtp();
    await UserToken.create({
      user_id: existingUser.id,
      token_hash: hashToken(otp),
      token_type: 'email_verification',
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      is_used: false
    });

    console.log(`\n📨 [DEV OTP EMAIL] Mã xác thực kích hoạt cho ${email}: ${otp}\n`);
    return formatUser(existingUser);
  }

  // Create new user
  const password_hash = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    email: normalizedEmail,
    password_hash,
    full_name: fullName,
    role: 'student',
    email_verified: false,
    is_active: true,
    must_change_password: false
  });

  const otp = generateOtp();
  await UserToken.create({
    user_id: newUser.id,
    token_hash: hashToken(otp),
    token_type: 'email_verification',
    expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    is_used: false
  });

  console.log(`\n📨 [DEV OTP EMAIL] Mã xác thực kích hoạt cho ${email}: ${otp}\n`);
  return formatUser(newUser);
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

  if (user.email_verified) {
    throw new AppError('Tài khoản đã được kích hoạt email từ trước', 400, 'Bad Request');
  }

  const otpHash = hashToken(otp);
  const tokenRecord = await UserToken.findOne({
    where: {
      user_id: user.id,
      token_hash: otpHash,
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

  // Mark token as used
  await tokenRecord.update({ is_used: true });

  // Activate user
  await user.update({ email_verified: true });

  // Issue Token Pair
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });

  await UserToken.create({
    user_id: user.id,
    token_hash: hashToken(refreshToken),
    token_type: 'refresh_token',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    is_used: false
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

  if (user.email_verified) {
    throw new AppError('Tài khoản đã được kích hoạt trước đó', 400, 'Bad Request');
  }

  // Invalidate old OTPs
  await UserToken.update(
    { is_used: true },
    { where: { user_id: user.id, token_type: 'email_verification', is_used: false } }
  );

  const otp = generateOtp();
  await UserToken.create({
    user_id: user.id,
    token_hash: hashToken(otp),
    token_type: 'email_verification',
    expires_at: new Date(Date.now() + 10 * 60 * 1000),
    is_used: false
  });

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

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });

  await UserToken.create({
    user_id: user.id,
    token_hash: hashToken(refreshToken),
    token_type: 'refresh_token',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    is_used: false
  });

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

  // Token Rotation: Invalidate current refresh token
  await tokenRecord.update({ is_used: true });

  const user = await User.findByPk(decoded.sub);
  if (!user || !user.is_active) {
    throw new AppError('Tài khoản không tồn tại hoặc đã bị khóa', 401, 'Unauthorized');
  }

  // Issue new pair
  const newAccessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const newRefreshToken = signRefreshToken({ sub: user.id });

  await UserToken.create({
    user_id: user.id,
    token_hash: hashToken(newRefreshToken),
    token_type: 'refresh_token',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    is_used: false
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

/**
 * 6. Logout & Revoke Session
 */
export const logout = async ({ userId, incomingToken, allDevices }) => {
  if (allDevices) {
    await UserToken.update(
      { is_used: true },
      { where: { user_id: userId, token_type: 'refresh_token', is_used: false } }
    );
  } else if (incomingToken) {
    await UserToken.update(
      { is_used: true },
      { where: { user_id: userId, token_hash: hashToken(incomingToken), is_used: false } }
    );
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
    // Invalidate old reset tokens
    await UserToken.update(
      { is_used: true },
      { where: { user_id: user.id, token_type: 'password_reset', is_used: false } }
    );

    const resetToken = generateSecureRandomToken(32);
    await UserToken.create({
      user_id: user.id,
      token_hash: hashToken(resetToken),
      token_type: 'password_reset',
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      is_used: false
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

  const password_hash = await bcrypt.hash(newPassword, 10);
  await user.update({ password_hash });

  // Invalidate token
  await tokenRecord.update({ is_used: true });

  // Revoke all refresh tokens
  await UserToken.update(
    { is_used: true },
    { where: { user_id: user.id, token_type: 'refresh_token', is_used: false } }
  );

  return true;
};

/**
 * 9. Change Password
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
  await user.update({
    password_hash,
    must_change_password: false
  });

  // Revoke all other sessions
  await UserToken.update(
    { is_used: true },
    { where: { user_id: user.id, token_type: 'refresh_token', is_used: false } }
  );

  return {
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
