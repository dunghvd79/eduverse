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
  // Lựa chọn đầu tiên (giữ để tương thích); dùng selected_option_ids cho đầy đủ
  selected_option_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  // Tất cả lựa chọn học viên đã tick (multiple_choice có thể nhiều) - migration 20261012-quiz-attempts
  selected_option_ids: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: false,
    defaultValue: []
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
