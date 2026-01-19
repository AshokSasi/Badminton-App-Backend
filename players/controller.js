const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sequelize = require('../database/database');
// const defineGroupMembers = require('../common/models/GroupPlayers');
// const GroupPlayers = defineGroupMembers(sequelize);
const {User } = require('../common/models');


// make api for creating a player  
