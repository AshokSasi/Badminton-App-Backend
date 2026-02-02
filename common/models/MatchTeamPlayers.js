const { DataTypes } = require('sequelize');

const MatchTeamPlayersModel = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  match_team_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'match_teams', key: 'id' } },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
};

module.exports = (sequelize) => sequelize.define('match_team_players', MatchTeamPlayersModel, {
  timestamps: false
});
