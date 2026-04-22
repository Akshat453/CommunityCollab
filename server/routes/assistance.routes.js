const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const AssistancePost = require('../models/AssistancePost')
const User = require('../models/User')
const { addPoints } = require('../utils/badgeEngine')
const { sendMail, assistanceResponseEmail } = require('../utils/mailer')

router.get('/', async (req, res) => {
  const { q, post_type, category, urgency, status, page = 1, limit = 20 } = req.query
  const filter = {}
  if (post_type) filter.post_type = post_type
  if (category) filter.category = category
  if (urgency) filter.urgency = urgency
  if (status) filter.status = status
  if (q) filter.$or = [
    { title: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } },
    { tags: { $regex: q, $options: 'i' } }
  ]
  const total = await AssistancePost.countDocuments(filter)
  const posts = await AssistancePost.find(filter).populate('poster', 'name avatar_url verified').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
  res.json({ success: true, data: posts, total, page: Number(page), pages: Math.ceil(total / limit) })
})

router.get('/:id', async (req, res) => {
  const post = await AssistancePost.findById(req.params.id).populate('poster', 'name avatar_url verified bio').populate('responses.responder', 'name avatar_url')
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
  res.json({ success: true, data: post })
})

router.post('/', protect, async (req, res) => {
  const post = await AssistancePost.create({ ...req.body, poster: req.user._id })
  res.status(201).json({ success: true, data: post })
})

router.post('/:id/respond', protect, async (req, res) => {
  const post = await AssistancePost.findById(req.params.id)
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
  post.responses.push({ responder: req.user._id, message: req.body.message })
  await post.save()
  if (post.urgency === 'urgent') await addPoints(req.user._id, 20)

  // Send response notification email to poster
  try {
    const poster = await User.findById(post.poster)
    if (poster?.email) {
      const emailData = assistanceResponseEmail({
        posterName: poster.name,
        responderName: req.user.name,
        postTitle: post.title
      })
      await sendMail({ to: poster.email, ...emailData })
    }
  } catch (err) {
    console.error('[Mail] Assistance response email failed:', err.message)
  }

  res.json({ success: true, data: post })
})

router.delete('/:id', protect, async (req, res) => {
  const post = await AssistancePost.findById(req.params.id)
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
  if (post.poster.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })
  await post.deleteOne()
  res.json({ success: true, message: 'Post deleted' })
})

module.exports = router
