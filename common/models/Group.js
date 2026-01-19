const { DataTypes } = require('sequelize');

const GroupModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
};

module.exports = (sequelize) => sequelize.define('group', GroupModel);