import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Cài đặt nghiệp vụ Admin sửa được trên web (UC-ADMIN-007, docs/api/api-settings.md).
 * Mỗi dòng một khóa (vd. allow_self_registration), giá trị JSONB; khóa bí mật và cấu hình hạ tầng
 * KHÔNG lưu ở đây (nằm trong biến môi trường). Mỗi lần đổi đều ghi nhật ký SETTING_CHANGED.
 */
export const SystemSetting = sequelize.define('system_settings', {
  key: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  value: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  }
}, {
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

export default SystemSetting;
