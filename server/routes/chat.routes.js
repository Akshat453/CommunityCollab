const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { protect } = require('../middleware/auth.middleware')
const Message = require('../models/Message')
const User = require('../models/User')

// GET /chat/rooms — rooms the logged-in user participates in, with last message + partner info
router.get('/rooms', protect, async (req, res) => {
  const userId = req.user._id

  const rooms = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: userId },
          { room: { $regex: userId.toString() } }
        ]
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$room',
        lastMessage: { $first: '$$ROOT' },
        messageCount: { $sum: 1 }
      }
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    // Populate the last message sender
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.sender',
        foreignField: '_id',
        as: 'lastMessageSenderArr'
      }
    },
    {
      $addFields: {
        'lastMessage.senderInfo': { $arrayElemAt: ['$lastMessageSenderArr', 0] }
      }
    },
    { $unset: 'lastMessageSenderArr' }
  ])

  // For DM rooms (format: dm:{id1}_{id2}), resolve the partner's user record
  const enriched = await Promise.all(
    rooms.map(async (room) => {
      if (room._id?.startsWith('dm:')) {
        const [, ids] = room._id.split(':')
        const [idA, idB] = ids.split('_')
        const partnerId = idA === userId.toString() ? idB : idA
        try {
          const partner = await User.findById(partnerId).select('name avatar_url verified')
          return { ...room, partner }
        } catch {
          return room
        }
      }
      return room
    })
  )

  res.json({ success: true, data: enriched })
})

// GET /chat/:room — message history for a room (newest-last, paginated)
router.get('/:room', protect, async (req, res) => {
  const { page = 1, limit = 50 } = req.query
  const messages = await Message.find({ room: req.params.room })
    .populate('sender', 'name avatar_url verified')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
  res.json({ success: true, data: messages.reverse() })
})

// POST /chat — send a message via REST (fallback; prefer socket)
router.post('/', protect, async (req, res) => {
  const message = await Message.create({ ...req.body, sender: req.user._id })
  const populated = await message.populate('sender', 'name avatar_url')
  res.status(201).json({ success: true, data: populated })
})

module.exports = router
