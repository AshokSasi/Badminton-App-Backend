require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;


function requireAuth(req, res, next) {
  console.log('Auth middleware called');
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    console.log('Auth success, userId:', req.userId);
    next();
  } catch (err) {
    console.log('Auth failed:', err.message);
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth