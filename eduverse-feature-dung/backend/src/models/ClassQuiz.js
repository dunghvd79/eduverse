import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ClassQuiz = sequelize.define('class_quizzes', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  open_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  close_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['class_id', 'quiz_id'] }
  ]
});

export default ClassQuiz;
