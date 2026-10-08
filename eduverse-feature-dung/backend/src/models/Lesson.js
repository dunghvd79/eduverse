import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Lesson = sequelize.define('lessons', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chapter_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  lesson_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'theory'
  },
  content_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  video_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['chapter_id', 'order_index'] }
  ]
});

export default Lesson;
