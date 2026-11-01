import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Nhật ký hệ thống (docs/api/api-audit-logs.md, UC-ADMIN-005).
 * Chỉ thêm, không sửa, không xóa: chỉ có created_at (không updated_at), không xóa mềm.
 * Email/vai trò người thực hiện được chép lại (snapshot) để dòng log vẫn đọc được khi tài khoản bị đổi hoặc xóa.
 * Không lưu mật khẩu, token, OTP (xem utils/auditRules.js: sanitizeMetadata).
 */
export const AuditLog = sequelize.define('audit_logs', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  actor_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  actor_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  actor_role: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  action: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  resource_type: {
    type: DataTypes.STRING(40),
    allowNull: true
  },
  resource_id: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  result: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'success',
    validate: { isIn: [['success', 'failed']] }
  },
  ip: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['created_at'] },
    { fields: ['action', 'created_at'] },
    { fields: ['actor_id', 'created_at'] },
    { fields: ['resource_type', 'resource_id'] }
  ]
});

export default AuditLog;
