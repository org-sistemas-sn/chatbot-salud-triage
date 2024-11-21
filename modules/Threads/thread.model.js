import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';
import Sender from '../Senders/sender.model.js';

const Thread = sequelize.define('Thread', {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'senders',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'threads'
});

export default Thread;