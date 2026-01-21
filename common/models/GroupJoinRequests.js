const { DataTypes } = require('sequelize');

const GroupJoinRequestsModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  group_id: { type: DataTypes.INTEGER, references: {model: 'groups', key: 'id'} },
  player_id: { type: DataTypes.INTEGER, references: {model: 'users', key: 'id'} },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
};

module.exports = (sequelize) => sequelize.define('group_join_requests', GroupJoinRequestsModel);