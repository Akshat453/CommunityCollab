const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  let token
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' })
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid' })
  }
}

const optionalProtect = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer')) return next()

  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
  } catch {
    req.user = null
  }
  next()
}

module.exports = { protect, optionalProtect }
