const { DataTypes } = require('sequelize');

const MatchTeamsModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  match_court_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'match_courts', key: 'id' } },
  team: { type: DataTypes.STRING, allowNull: false }, // 'A' or 'B'
  won: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
};

module.exports = (sequelize) => sequelize.define('match_teams', MatchTeamsModel, {
  timestamps: false
});
