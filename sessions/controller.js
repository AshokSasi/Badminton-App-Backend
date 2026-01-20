const sequelize = require('../database/database');
const defineSession = require('../common/models/Sessions');
const defineSessionPlayers = require('../common/models/SessionPlayers');
const defineUser = require('../common/models/User');

const { Sessions, User, SessionPlayers } = require('../common/models');

exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Sessions.findByPk(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.status(200).json({
      success: true,
      data: { id: session.id, location: session.location, size: session.size, start_time: session.start_time, end_time: session.end_time, ended_at: session.ended_at, group_id: session.group_id } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.joinSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const{ userId } = req.body;
    const session = await Sessions.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    await SessionPlayers.create({
      session_id: sessionId,
      player_id: userId,
      joined_at: new Date().toISOString()
    });
    res.status(200).json({
      success: true,
      message: 'User joined the session successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    console.log('req.params:', req.body);
    console.log('Sessions:', Sessions);
    const { date, location, size, start_time, end_time, ended_at, group_id } = req.body;
    const session = await Sessions.create({
      date,
      location,
      size,
      start_time,
      end_time,
      ended_at,
      group_id
    });
    res.status(201).json({
      success: true,
      data: { id: session.id, date: session.date, location: session.location, size: session.size, start_time: session.start_time, end_time: session.end_time, ended_at: session.ended_at, group_id: session.group_id }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.updateSessionEndAt = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Sessions.findByPk(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    // Set ended_at as a string in EST timezone, formatted as 'YYYY-MM-DD HH:mm:ss.SSS'
    const now = new Date();
    const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const pad = (n, z = 2) => ('' + n).padStart(z, '0');
    const formatted = `${estDate.getFullYear()}-${pad(estDate.getMonth() + 1)}-${pad(estDate.getDate())} ${pad(estDate.getHours())}:${pad(estDate.getMinutes())}:${pad(estDate.getSeconds())}.${pad(estDate.getMilliseconds(), 3)}`;
    session.ended_at = formatted;
    await session.save();
    res.status(200).json({
      success: true,
      data: { date: session.ended_at }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};