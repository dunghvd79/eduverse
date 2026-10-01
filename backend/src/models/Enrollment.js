import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Enrollment = sequelize.define('enrollments', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  enrolled_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  timestamps: true,
  paranoid: true,
  updatedAt: false,
  createdAt: 'created_at',
  deletedAt: 'deleted_at',
  indexes: [
    { fields: ['student_id'] }
  ]
});

export default Enrollment;
