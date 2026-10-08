import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const UserToken = sequelize.define('user_tokens', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  token_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  token_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
  indexes: [
    { fields: ['token_hash', 'token_type', 'is_used'] }
  ]
});

export default UserToken;
