import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const QuizAttemptAnswer = sequelize.define('quiz_attempt_answers', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  attempt_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  question_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  selected_option_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['attempt_id', 'question_id'] }
  ]
});

export default QuizAttemptAnswer;
