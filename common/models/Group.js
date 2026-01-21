const { DataTypes } = require('sequelize');

const GroupModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  is_public: { type: DataTypes.INTEGER, allowNull: false  },
  min_skill: { type: DataTypes.INTEGER, allowNull: false },
  max_skill: { type: DataTypes.INTEGER, allowNull: false },
};

module.exports = (sequelize) => sequelize.define('group', GroupModel);