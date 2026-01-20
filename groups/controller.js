const sequelize = require("../database/database");
const defineGroup = require("../common/models/Group");
const defineUser = require("../common/models/User");
// const Group = defineGroup(sequelize);
// const User = defineUser(sequelize);
const { Group, User, Sessions, GroupPlayers } = require("../common/models");

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.findAll();
    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    res.status(200).json({
      success: true,
      data: { id: group.id, name: group.name },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId;
    console.log("Creating group for userId:", userId);
    const group = await Group.create({
      name,
    });
    await GroupPlayers.create({
      group_id: group.id,
      player_id: userId,
    });
    res.status(201).json({
      success: true,
      group: { id: group.id, name: group.name },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findByPk(id, {
      include: {
        model: User,
        attributes: ["id", "name", "email"],
        through: { attributes: [] },
      },
    });
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    res.status(200).json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        users: group.users,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

//refactor this to work with this table
exports.getSessionsByGroupId = async (req, res) => {
  try {
    const { group_id } = req.params;
    const sessions = await Sessions.findAll({
      order: [
        ["date", "ASC"],
        ["start_time", "ASC"],
      ],
      where: { group_id },
    });
    // No need to check for 'group' here; just return sessions
    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
