// Helper to add a user to a group if not already a member
async function addUserToGroup(group_id, player_id) {
  const existing = await GroupPlayers.findOne({
    where: { group_id, player_id },
  });
  if (!existing) {
    await GroupPlayers.create({ group_id, player_id });
  }
}

const sequelize = require("../database/database");
const defineGroup = require("../common/models/Group");
const defineUser = require("../common/models/User");
// const Group = defineGroup(sequelize);
// const User = defineUser(sequelize);
const { Group, User, Sessions, GroupPlayers, GroupJoinRequests } = require("../common/models");

// Get all join requests for the logged-in user
exports.getUserJoinRequests = async (req, res) => {
  try {
    console.log('getUserJoinRequests called');
    const userId = req.userId;
    console.log('Fetching join requests for userId:', userId);
    const requests = await GroupJoinRequests.findAll({
      where: { player_id: userId },
      include: {
        model: Group,
        attributes: ["id", "name"]
      }
    });
    console.error('getUserJoinRequests error:', requests);
    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error('getUserJoinRequests error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
// Join a group API
exports.joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    // Check if group exists
    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    // Add user to group (handles duplicate check)
    await addUserToGroup(id, userId);
    res
      .status(200)
      .json({ success: true, message: "Joined group successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

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
    const { name, is_public, min_skill, max_skill, role } = req.body;
    const userId = req.userId;
    console.log("Creating group for userId:", userId);
    const group = await Group.create({
      name,
      is_public,
      min_skill,
      max_skill,
    });
    await GroupPlayers.create({
      group_id: group.id,
      player_id: userId,
      role: role,
    });
    res.status(201).json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        is_public: Boolean(group.is_public),
        min_skill: group.min_skill,
        max_skill: group.max_skill,
        role: role,
      },
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

// Get current user's role in a group
exports.getUserRoleInGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const membership = await GroupPlayers.findOne({
      where: { group_id: id, player_id: userId },
      attributes: ["role"],
    });
    if (!membership) {
      return res
        .status(404)
        .json({ success: false, error: "User is not a member of this group" });
    }
    res.status(200).json({ success: true, role: membership.role });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getGroupJoinRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const requests = await GroupJoinRequests.findAll({
      where: { group_id: id },
      include: {
        model: User,
        attributes: ["id", "name", "email"],
      },
    });
    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.requestToJoinGroup = async (req, res) => {
  try {
    const { id } = req.params; // group id
    const userId = req.userId;
    // Check if request already exists
    const existingRequest = await GroupJoinRequests.findOne({
      where: { group_id: id, player_id: userId },
    });
    if (existingRequest) {
      return res
        .status(400)
        .json({ success: false, error: "Join request already exists" });
    }
    // Create join request
    await GroupJoinRequests.create({
      group_id: id,
      player_id: userId,
      status: "pending",
    });
    res
      .status(201)
      .json({ success: true, message: "Join request submitted" });
  }
  catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }   
};

exports.updateJoinRequestStatus = async (req, res) => {
  try {
    const { id } = req.params; // join request id
    const { action } = req.body;
    // Update join request status
    const request = await GroupJoinRequests.findByPk(id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, error: "Join request not found" });
    }
    request.status = action;
    await request.save();
    // If approved, add the user to the group
    if (action === "approved") {
      await addUserToGroup(request.group_id, request.player_id);
    }
    res
      .status(200)
      .json({ success: true, message: "Join request status updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


