import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Question = sequelize.define('questions', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  question_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'multiple_choice'
  },
  points: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 1.00
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: false
});

export default Question;
