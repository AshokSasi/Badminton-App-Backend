const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sequelize = require('../database/database');
const defineUser = require('../common/models/User');
const User = defineUser(sequelize);

const encryptPassword = (password) =>
  crypto.createHash('sha256').update(password).digest('hex');

const generateAccessToken = (username, userId) =>
  jwt.sign({ username, userId }, 'your-secret-key', { expiresIn: '24h' });


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password} = req.body;
    const encryptedPassword = encryptPassword(password);
    const user = await User.create({
      name,
      email,
      password: encryptedPassword
    });
    const accessToken = generateAccessToken(name, user.id);
    res.status(201).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      token: accessToken
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};