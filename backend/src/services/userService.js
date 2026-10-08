import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { User, UserToken, Course, ClassModel } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

/**
 * Format user entity to camelCase DTO for API response
 */
export const formatUser = (user, includeExtra = false) => {
  const base = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    phoneNumber: user.phone_number,
    bio: user.bio,
    role: user.role,
    isActive: user.is_active,
    blockReason: user.block_reason,
    emailVerified: user.email_verified,
    mustChangePassword: user.must_change_password,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };

  return base;
};

/**
 * 1. Get logged-in user profile
 */
export const getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Không tìm thấy tài khoản người dùng', 404, 'Not Found');
  }
  return formatUser(user);
};

/**
 * 2. Self update personal profile
 */
export const updateMe = async (userId, updateData) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Không tìm thấy tài khoản người dùng', 404, 'Not Found');
  }

  const fieldsToUpdate = {};
  if (updateData.fullName !== undefined) fieldsToUpdate.full_name = updateData.fullName.trim();
  if (updateData.phoneNumber !== undefined) fieldsToUpdate.phone_number = updateData.phoneNumber || null;
  if (updateData.bio !== undefined) fieldsToUpdate.bio = updateData.bio || null;
  if (updateData.avatarUrl !== undefined) fieldsToUpdate.avatar_url = updateData.avatarUrl || null;

  await user.update(fieldsToUpdate);
  return formatUser(user);
};

/**
 * 3. Self change account password
 * Logic nằm ở authService.changePassword (dùng chung với PATCH /auth/change-password)
 */

/**
 * 4. Get public profile (e.g. for Teacher / Instructor view)
 */
export const getPublicProfile = async (targetUserId) => {
  const user = await User.findOne({
    where: {
      id: targetUserId,
      is_active: true
    }
  });

  if (!user) {
    throw new AppError('Không tìm thấy người dùng hoặc tài khoản đã bị khóa', 404, 'Not Found');
  }

  let stats = null;
  if (user.role === 'teacher') {
    const publishedCoursesCount = await Course.count({
      where: { owner_id: user.id, status: 'PUBLISHED' }
    }).catch(() => 0);

    const activeClassesCount = await ClassModel.count({
      where: { teacher_id: user.id, status: 'OPEN' }
    }).catch(() => 0);

    stats = {
      publishedCoursesCount,
      activeClassesCount
    };
  }

  return {
    id: user.id,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    role: user.role,
    stats,
    createdAt: user.created_at
  };
};

/**
 * 5. Admin: List all users with search, role & status filters, and pagination
 */
export const getUsersList = async ({
  page = 1,
  limit = 20,
  search,
  role,
  status,
  sortBy = 'createdAt',
  sortOrder = 'DESC'
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const where = {};

  // Search keyword (Full name, Email, Phone number)
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { full_name: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } },
      { phone_number: { [Op.iLike]: term } }
    ];
  }

  // Filter by role
  if (role && ['student', 'teacher', 'training_manager', 'admin'].includes(role)) {
    where.role = role;
  }

  // Filter by status
  if (status === 'active') {
    where.is_active = true;
    where.email_verified = true;
  } else if (status === 'blocked') {
    where.is_active = false;
  } else if (status === 'unverified') {
    where.email_verified = false;
  }

  // Sort mapping
  const sortMap = {
    createdAt: 'created_at',
    fullName: 'full_name',
    email: 'email',
    role: 'role'
  };
  const sortField = sortMap[sortBy] || 'created_at';
  const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await User.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order: [[sortField, orderDirection]]
  });

  const totalPages = Math.ceil(count / limitNum) || 1;

  return {
    items: rows.map(u => formatUser(u)),
    meta: {
      page: pageNum,
      limit: limitNum,
      totalItems: count,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1
    }
  };
};

/**
 * 6. Admin: Get user detail by ID
 */
export const getUserById = async (targetUserId) => {
  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404, 'Not Found');
  }

  let statistics = null;
  if (user.role === 'teacher') {
    const teachingClassesCount = await ClassModel.count({ where: { teacher_id: user.id } }).catch(() => 0);
    const createdCoursesCount = await Course.count({ where: { owner_id: user.id } }).catch(() => 0);
    statistics = { teachingClassesCount, createdCoursesCount };
  }

  return {
    ...formatUser(user),
    statistics
  };
};

/**
 * 7. Admin: Create a new privileged or student user
 */
export const adminCreateUser = async ({ email, fullName, role, phoneNumber, password }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new AppError('Địa chỉ email này đã tồn tại trong hệ thống', 409, 'Conflict');
  }

  // Generate temporary password if not provided
  const tempPassword = password || `EduVerse@${crypto.randomBytes(3).toString('hex').toUpperCase()}!`;
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(tempPassword, salt);

  const newUser = await User.create({
    email: normalizedEmail,
    full_name: fullName.trim(),
    role,
    phone_number: phoneNumber || null,
    password_hash,
    is_active: true,
    email_verified: true,
    must_change_password: true
  });

  console.log(`\n🔑 [ADMIN CREATED USER] Email: ${email} | Role: ${role} | Temp Password: ${tempPassword}\n`);

  return {
    ...formatUser(newUser),
    tempPassword
  };
};

/**
 * 8. Admin: Update user information & assign/revoke RBAC role
 */
export const adminUpdateUser = async (targetUserId, currentAdminId, { fullName, phoneNumber, role }) => {
  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404, 'Not Found');
  }

  // Prevent admin from revoking their own admin role
  if (targetUserId === currentAdminId && role && role !== 'admin') {
    throw new AppError('Không thể tự thu hồi quyền Admin của chính mình', 400, 'Bad Request');
  }

  const fieldsToUpdate = {};
  if (fullName !== undefined) fieldsToUpdate.full_name = fullName.trim();
  if (phoneNumber !== undefined) fieldsToUpdate.phone_number = phoneNumber || null;

  const roleChanged = role && role !== user.role;
  if (role) fieldsToUpdate.role = role;

  await user.update(fieldsToUpdate);

  // If role changed, revoke all refresh tokens so the user gets updated role claim upon re-login
  if (roleChanged) {
    await UserToken.update(
      { is_used: true },
      { where: { user_id: user.id, token_type: 'refresh_token', is_used: false } }
    );
  }

  return formatUser(user);
};

/**
 * 9. Admin: Lock or Unlock user account
 */
export const adminUpdateStatus = async (targetUserId, currentAdminId, { isActive, reason }) => {
  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404, 'Not Found');
  }

  if (targetUserId === currentAdminId) {
    throw new AppError('Không thể tự khóa tài khoản của chính mình', 400, 'Bad Request');
  }

  if (!isActive) {
    // Lock account: set block reason & revoke all sessions immediately
    await user.update({
      is_active: false,
      block_reason: reason
    });

    await UserToken.update(
      { is_used: true },
      { where: { user_id: user.id, token_type: 'refresh_token', is_used: false } }
    );
  } else {
    // Unlock account
    await user.update({
      is_active: true,
      block_reason: null
    });
  }

  return formatUser(user);
};

/**
 * 10. Admin: Emergency reset password for user
 */
export const adminResetPassword = async (targetUserId) => {
  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404, 'Not Found');
  }

  const tempPassword = `EduVerse@${crypto.randomBytes(3).toString('hex').toUpperCase()}#`;
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(tempPassword, salt);

  await user.update({
    password_hash,
    must_change_password: true
  });

  // Revoke all existing sessions
  await UserToken.update(
    { is_used: true },
    { where: { user_id: user.id, token_type: 'refresh_token', is_used: false } }
  );

  console.log(`\n🔑 [ADMIN RESET PASSWORD] User: ${user.email} | New Temp Password: ${tempPassword}\n`);

  return {
    id: user.id,
    email: user.email,
    mustChangePassword: true,
    tempPassword,
    resetAt: new Date().toISOString()
  };
};

/**
 * 11. Admin: Soft delete user account
 */
export const adminDeleteUser = async (targetUserId, currentAdminId) => {
  if (targetUserId === currentAdminId) {
    throw new AppError('Không thể xóa tài khoản của chính mình', 400, 'Bad Request');
  }

  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại hoặc đã bị xóa', 404, 'Not Found');
  }

  // Soft delete via Paranoid
  await user.destroy();

  // Invalidate tokens
  await UserToken.update(
    { is_used: true },
    { where: { user_id: targetUserId, is_used: false } }
  );

  return {
    id: targetUserId,
    deletedAt: new Date().toISOString()
  };
};
