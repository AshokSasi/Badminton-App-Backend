const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sequelize = require('../database/database');
// const defineGroupMembers = require('../common/models/GroupPlayers');
// const GroupPlayers = defineGroupMembers(sequelize);
const {User, GroupPlayers, Group } = require('../common/models');


// make api for creating a player  
exports.getUserGroups = async (req, res) => {
  try {
    console.log("Fetching user groups for userId:", req.userId);
    const userId = req.userId;
    const groups = await Group.findAll({
      include: [{
        model: GroupPlayers,
        where: { player_id: userId },
        attributes: []
      }]
    });
    // Convert is_public to boolean for each group
    const groupsWithBool = groups.map(group => ({
      ...group.toJSON(),
      is_public: Boolean(group.is_public)
    }));
    res.status(200).json({
      success: true,
      data: groupsWithBool
    });
  } catch (err) {
    console.error('getUserGroups error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};