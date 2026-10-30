import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Thảo luận / Hỏi đáp trong bài học (docs/api/api-discussions.md, docs/database/schema.md mục 19).
 * Thuộc về một lớp + một bài học. parent_id = NULL là câu hỏi gốc; có giá trị là câu trả lời (chỉ một cấp).
 * Xóa mềm: xóa câu hỏi gốc thì service xóa mềm luôn các câu trả lời.
 */
export const LessonDiscussion = sequelize.define('lesson_discussions', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'classes', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  lesson_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'lessons', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  author_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'lesson_discussions', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_resolved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    { name: 'idx_lesson_discussions_thread', fields: ['class_id', 'lesson_id', 'parent_id', 'created_at'] },
    { name: 'idx_lesson_discussions_parent', fields: ['parent_id'] },
    { name: 'idx_lesson_discussions_author', fields: ['author_id'] }
  ]
});

export default LessonDiscussion;
