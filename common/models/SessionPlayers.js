const { DataTypes } = require('sequelize');

const SessionPlayersModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  session_id: { type: DataTypes.INTEGER, allowNull: false, references: {model: 'sessions', key: 'id'} },
  player_id: { type: DataTypes.INTEGER, allowNull: false, references: {model: 'users', key: 'id'} },
  joined_at: { type: DataTypes.STRING, allowNull: false },
  left_at: { type: DataTypes.STRING, allowNull: true },
  sitting_out_next: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
};

module.exports = (sequelize) => sequelize.define('session_players', SessionPlayersModel, {
  timestamps: false
});