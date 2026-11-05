import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Nhật ký hệ thống (UC-ADMIN-005, docs/api/api-audit-logs.md).
 * Chỉ thêm, không sửa/xóa qua API. Lưu kèm email + vai trò của người thực hiện tại thời điểm đó
 * để vẫn truy vết được khi tài khoản bị xóa (actor_id -> NULL).
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
    type: DataTypes.STRING(50),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  severity: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'info'
  },
  status: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'success'
  },
  target_type: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  target_id: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  target_label: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.STRING(500),
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
    { name: 'idx_audit_logs_created', fields: ['created_at'] },
    { name: 'idx_audit_logs_action', fields: ['action', 'created_at'] },
    { name: 'idx_audit_logs_actor', fields: ['actor_id'] },
    { name: 'idx_audit_logs_ip_failed', fields: ['ip_address', 'action', 'created_at'] }
  ]
});

export default AuditLog;
