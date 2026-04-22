const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { signToken } = require('../utils/jwt')

router.post('/register', async (req, res) => {
  const { name, email, password, city } = req.body
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, and password are required' })
  const existing = await User.findOne({ email })
  if (existing) return res.status(400).json({ success: false, message: 'Email already in use' })
  const user = await User.create({ name, email, password, location: { city: city || '' } })
  const token = signToken(user._id)
  res.status(201).json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email, avatar_url: user.avatar_url, role: user.role, community_points: user.community_points, badges: user.badges, location: user.location } })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' })
  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid credentials' })
  const token = signToken(user._id)
  res.json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email, avatar_url: user.avatar_url, role: user.role, community_points: user.community_points, badges: user.badges, location: user.location, bio: user.bio, skills: user.skills, interests: user.interests, verified: user.verified } })
})

module.exports = router
