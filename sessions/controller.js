const sequelize = require('../database/database');
const defineGroup = require('../common/models/Group');
const defineUser = require('../common/models/User');

const { Sessions, Group } = require('../common/models');

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
