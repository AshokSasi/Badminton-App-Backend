const { DataTypes } = require('sequelize');

const GroupPlayersModel = {
  group_id: { type: DataTypes.INTEGER, primaryKey: true, references: {model: 'groups', key: 'id'} },
  player_id: { type: DataTypes.INTEGER, primaryKey: true, references: {model: 'users', key: 'id'} },
};

module.exports = (sequelize) => sequelize.define('group_players', GroupPlayersModel);