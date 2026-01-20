const { DataTypes } = require('sequelize');

const SessionPlayersModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  session_id: { type: DataTypes.INTEGER, primaryKey: true, references: {model: 'sessions', key: 'id'} },
  player_id: { type: DataTypes.INTEGER, primaryKey: true, references: {model: 'users', key: 'id'} },
  joined_at: { type: DataTypes.STRING, allowNull: false },
  left_at: { type: DataTypes.STRING, allowNull: true },
};

module.exports = (sequelize) => sequelize.define('session_players', SessionPlayersModel);