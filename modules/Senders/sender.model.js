import { DataTypes } from 'sequelize'
import sequelize from '../../config/database.js'
import Thread from '../Threads/thread.model.js'

const Sender = sequelize.define('Sender',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        this.setDataValue('name', value?.trim().toUpperCase())
      },
    },
    country_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dial_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: 'senders',
  }
)

export default Sender
