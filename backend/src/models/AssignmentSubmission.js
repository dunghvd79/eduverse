import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const AssignmentSubmission = sequelize.define('assignment_submissions', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_assignment_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  student_note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'submitted'
  },
  grade: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  graded_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  graded_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['class_assignment_id', 'student_id'] }
  ]
});

export default AssignmentSubmission;
