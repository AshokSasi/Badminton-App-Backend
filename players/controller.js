const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sequelize = require('../database/database');
// const defineGroupMembers = require('../common/models/GroupPlayers');
// const GroupPlayers = defineGroupMembers(sequelize);
const {User, GroupPlayers, Group } = require('../common/models');


// make api for creating a player  
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.userId;
    const groups = await Group.findAll({
      include: [{
        model: GroupPlayers,
        where: { player_id: userId },
        attributes: []
      }]
    });
    res.status(200).json({
      success: true,
      data: groups
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};