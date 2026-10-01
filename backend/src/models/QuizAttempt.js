import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const QuizAttempt = sequelize.define('quiz_attempts', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  score: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'in_progress'
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['class_quiz_id', 'student_id', 'attempt_number'] }
  ]
});

export default QuizAttempt;
