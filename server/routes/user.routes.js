const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const User = require('../models/User')

router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ success: true, data: user })
})

// Search users by name or email — used by Messages "new chat" flow
router.get('/', protect, async (req, res) => {
  const { q, limit = 10 } = req.query
  if (!q?.trim()) return res.json({ success: true, data: [] })
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { name: { $regex: q.trim(), $options: 'i' } },
      { email: { $regex: q.trim(), $options: 'i' } }
    ]
  }).select('name email avatar_url verified').limit(Number(limit))
  res.json({ success: true, data: users })
})

router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select('-__v')
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  res.json({ success: true, data: user })
})

router.patch('/me', protect, async (req, res) => {
  const allowed = ['name', 'bio', 'phone', 'avatar_url', 'skills', 'interests', 'location']
  const updates = {}
  allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field] })
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
  res.json({ success: true, data: user })
})

module.exports = router
