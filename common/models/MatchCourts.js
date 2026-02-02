const { DataTypes } = require('sequelize');

const MatchCourtsModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  match_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'matches', key: 'id' } },
  court_number: { type: DataTypes.INTEGER, allowNull: false },
  court_type: { type: DataTypes.STRING, allowNull: false }, // 'singles' or 'doubles'
};

module.exports = (sequelize) => sequelize.define('match_courts', MatchCourtsModel, {
  timestamps: false
});