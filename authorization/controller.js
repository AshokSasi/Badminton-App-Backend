require('dotenv').config();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sequelize = require('../database/database');
const defineUser = require('../common/models/User');
const User = defineUser(sequelize);
const JWT_SECRET = process.env.JWT_SECRET;

const encryptPassword = (password) =>
  crypto.createHash('sha256').update(password).digest('hex');

const generateAccessToken = (username, userId) =>
  jwt.sign({ username, userId }, JWT_SECRET, { expiresIn: '14d' });


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
    const { name, email, password, confirmPassword} = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }
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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const encryptedPassword = encryptPassword(password);
    const user = await User.findOne({ where: { email, password: encryptedPassword } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    const accessToken = generateAccessToken(user.name, user.id);
    res.status(200).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      token: accessToken
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};