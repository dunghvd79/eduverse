import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ClassAssignment = sequelize.define('class_assignments', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  assignment_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  open_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  allow_late_submission: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  cutoff_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['class_id', 'assignment_id'] }
  ]
});

export default ClassAssignment;
