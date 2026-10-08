import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const LessonProgress = sequelize.define('lesson_progress', {
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
  lesson_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['class_id', 'student_id', 'lesson_id'] }
  ]
});

export default LessonProgress;
