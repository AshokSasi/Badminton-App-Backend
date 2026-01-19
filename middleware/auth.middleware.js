const jwt = require('jsonwebtoken')
const JWT_SECRET = 'dev_secret_change_later'

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return res.sendStatus(401)

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch {
    res.sendStatus(401)
  }
}

module.exports = requireAuth