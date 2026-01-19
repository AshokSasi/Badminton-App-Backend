const { DataTypes } = require('sequelize');

const SessionModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.INTEGER, allowNull: false },
  start_time: { type: DataTypes.STRING, allowNull: false },
  end_time: { type: DataTypes.STRING, allowNull: false },
  ended_at: { type: DataTypes.STRING, allowNull: true },
  group_id: { type: DataTypes.INTEGER, references: {model: 'group', key: 'id'} }
};

module.exports = (sequelize) => sequelize.define('session', SessionModel);