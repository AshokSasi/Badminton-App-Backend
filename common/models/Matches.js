const { DataTypes } = require('sequelize');

const MatchesModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  session_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'sessions', key: 'id' } },
  match_type: { type: DataTypes.STRING, allowNull: false }, // 'singles' or 'doubles'
  ended_at: { type: DataTypes.DATE, allowNull: true },
};

module.exports = (sequelize) => sequelize.define('matches', MatchesModel, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false
});