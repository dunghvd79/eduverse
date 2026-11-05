import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Course = sequelize.define('courses', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Trang giới thiệu khóa học (bổ sung 31/10/2026, migration 20261031-course-landing.js)
  short_description: {
    type: DataTypes.STRING(160),
    allowNull: true
  },
  level: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  learning_outcomes: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  requirements: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'draft'
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    { fields: ['owner_id'] },
    { fields: ['status'] },
    { fields: ['category_id'] }
  ]
});

export default Course;
