const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const Notification = require('../models/Notification')

router.get('/unread-count', protect, async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, read: false })
  res.json({ success: true, count })
})

router.get('/', protect, async (req, res) => {
  const { page = 1, limit = 30 } = req.query
  const total = await Notification.countDocuments({ recipient: req.user._id })
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
  const unread = await Notification.countDocuments({ recipient: req.user._id, read: false })
  res.json({ success: true, data: notifications, total, unread, page: Number(page), pages: Math.ceil(total / limit) })
})

router.patch('/:id/read', protect, async (req, res) => {
  const notif = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true }, { new: true })
  res.json({ success: true, data: notif })
})

router.patch('/read-all', protect, async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true })
  res.json({ success: true, message: 'All notifications marked as read' })
})

router.delete('/clear', protect, async (req, res) => {
  await Notification.deleteMany({ recipient: req.user._id, read: true })
  res.json({ success: true, message: 'Read notifications cleared' })
})

module.exports = router
