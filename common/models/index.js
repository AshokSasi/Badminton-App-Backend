const sequelize = require('../../database/database');
const defineGroup = require('./Group');
const defineUser = require('./User');
const defineSession = require('./Sessions');
const defineGroupPlayers = require('./GroupPlayers');

const Group = defineGroup(sequelize);
const User = defineUser(sequelize);
const GroupPlayers = defineGroupPlayers(sequelize);
const Sessions = defineSession(sequelize);
// Associations
Group.belongsToMany(User, { through: GroupPlayers, foreignKey: 'group_id', otherKey: 'player_id' });
User.belongsToMany(Group, { through: GroupPlayers, foreignKey: 'player_id', otherKey: 'group_id' });
// Group has many GroupPlayers
Group.hasMany(GroupPlayers, { foreignKey: 'group_id' });
// GroupPlayers belongs to Group
GroupPlayers.belongsTo(Group, { foreignKey: 'group_id' });
// User has many GroupPlayers
User.hasMany(GroupPlayers, { foreignKey: 'player_id' });

// GroupPlayers belongs to User
GroupPlayers.belongsTo(User, { foreignKey: 'player_id' });
module.exports = { Group, User, GroupPlayers, Sessions };