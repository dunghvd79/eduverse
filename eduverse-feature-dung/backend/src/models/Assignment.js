import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Assignment = sequelize.define('assignments', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  lesson_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  instruction: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  allowed_file_types: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'pdf,zip,docx'
  },
  max_file_size_mb: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 25
  }
}, {
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

export default Assignment;
