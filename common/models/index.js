const sequelize = require('../../database/database');
const defineGroup = require('./Group');
const defineUser = require('./User');
const defineSession = require('./Sessions');
const defineSessionPlayers = require('./SessionPlayers');
const defineGroupPlayers = require('./GroupPlayers');
const defineGroupJoinRequests = require('./GroupJoinRequests');
const defineMatches = require('./Matches');
const defineMatchPlayers = require('./MatchPlayers');
const defineMatchCourts = require('./MatchCourts');
const defineMatchTeams = require('./MatchTeams');
const defineMatchTeamPlayers = require('./MatchTeamPlayers');

const Group = defineGroup(sequelize);
const User = defineUser(sequelize);
const GroupPlayers = defineGroupPlayers(sequelize);
const Sessions = defineSession(sequelize);
const SessionPlayers = defineSessionPlayers(sequelize);
const GroupJoinRequests = defineGroupJoinRequests(sequelize);
const Matches = defineMatches(sequelize);
const MatchPlayers = defineMatchPlayers(sequelize);
const MatchCourts = defineMatchCourts(sequelize);
const MatchTeams = defineMatchTeams(sequelize);
const MatchTeamPlayers = defineMatchTeamPlayers(sequelize);
// Associations
Group.belongsToMany(User, { through: GroupPlayers, foreignKey: 'group_id', otherKey: 'player_id' });
User.belongsToMany(Group, { through: GroupPlayers, foreignKey: 'player_id', otherKey: 'group_id' });
// Group has many GroupPlayers
Group.hasMany(GroupPlayers, { foreignKey: 'group_id' });
// GroupPlayers belongs to Group
GroupPlayers.belongsTo(Group, { foreignKey: 'group_id' });
// User has many GroupPlayers
User.hasMany(GroupPlayers, { foreignKey: 'player_id' });

// Group has many GroupJoinRequests
Group.hasMany(GroupJoinRequests, { foreignKey: 'group_id' });
// GroupJoinRequests belongs to Group
GroupJoinRequests.belongsTo(Group, { foreignKey: 'group_id' });
// User has many GroupJoinRequests
User.hasMany(GroupJoinRequests, { foreignKey: 'player_id' });
// GroupJoinRequests belongs to User
GroupJoinRequests.belongsTo(User, { foreignKey: 'player_id' });

// SessionPlayers associations
SessionPlayers.belongsTo(User, { as: 'player', foreignKey: 'player_id' });
User.hasMany(SessionPlayers, { foreignKey: 'player_id' });
SessionPlayers.belongsTo(Sessions, { foreignKey: 'session_id' });
Sessions.hasMany(SessionPlayers, { foreignKey: 'session_id' });

// Matches associations
Matches.belongsTo(Sessions, { foreignKey: 'session_id' });
Sessions.hasMany(Matches, { foreignKey: 'session_id' });

// MatchCourts associations
MatchCourts.belongsTo(Matches, { foreignKey: 'match_id' });
Matches.hasMany(MatchCourts, { as: 'courts', foreignKey: 'match_id' });

// MatchTeams associations
MatchTeams.belongsTo(MatchCourts, { foreignKey: 'match_court_id' });
MatchCourts.hasMany(MatchTeams, { as: 'teams', foreignKey: 'match_court_id' });

// MatchTeamPlayers associations
MatchTeamPlayers.belongsTo(MatchTeams, { foreignKey: 'match_team_id' });
MatchTeams.hasMany(MatchTeamPlayers, { as: 'players', foreignKey: 'match_team_id' });
MatchTeamPlayers.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
User.hasMany(MatchTeamPlayers, { foreignKey: 'user_id' });

// MatchPlayers associations (legacy - keeping for backward compatibility)
MatchPlayers.belongsTo(Matches, { foreignKey: 'match_id' });
Matches.hasMany(MatchPlayers, { foreignKey: 'match_id' });
MatchPlayers.belongsTo(User, { as: 'player', foreignKey: 'player_id' });
User.hasMany(MatchPlayers, { foreignKey: 'player_id' });

module.exports = { 
  Group, 
  User, 
  GroupPlayers, 
  Sessions, 
  SessionPlayers, 
  GroupJoinRequests, 
  Matches, 
  MatchPlayers, 
  MatchCourts, 
  MatchTeams, 
  MatchTeamPlayers 
};