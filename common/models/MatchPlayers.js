const { DataTypes } = require('sequelize');

const MatchPlayersModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  match_id: { type: DataTypes.INTEGER, primaryKey: true, references: {model: 'matches', key: 'id'} },
  player_id: { type: DataTypes.INTEGER, primaryKey: true, references: {model: 'users', key: 'id'} },
  team: { type: DataTypes.STRING, allowNull: false },
};

module.exports = (sequelize) => sequelize.define('match_players', MatchPlayersModel);