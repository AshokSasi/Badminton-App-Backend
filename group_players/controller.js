const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sequelize = require('../database/database');
// const defineGroupMembers = require('../common/models/GroupPlayers');
// const GroupPlayers = defineGroupMembers(sequelize);
const { GroupPlayers } = require('../common/models');
exports.getAllGroupPlayers = async (req, res) => {
  try {
    const { id } = req.params;
    const groupPlayers = await GroupPlayers.findAll({
      attributes: ['player_id'],
      where: { group_id: id }
    });
    res.status(200).json({
      success: true,
      data: groupPlayers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

