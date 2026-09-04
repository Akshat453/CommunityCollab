const express = require('express')
const router = express.Router()
const { protect, optionalProtect } = require('../middleware/auth.middleware')
const AssistancePost = require('../models/AssistancePost')
const Notification = require('../models/Notification')
const User = require('../models/User')
const { addPoints } = require('../utils/badgeEngine')
const { notifyUser } = require('../sockets/socket')
const { sendMail, assistanceResponseEmail } = require('../utils/mailer')
const { idOf, isAssistanceParticipant, redactLocation, directionsUrl } = require('../utils/workflowAccess')

const acceptedResponse = (post) => post.responses.find(r => r.status === 'accepted')

const toResponsePost = (post, userId) => {
  const obj = post.toObject()
  const canViewExact = userId && isAssistanceParticipant(post, userId)
  obj.location = redactLocation(obj.location, canViewExact)
  if (obj.coordination?.precise_location) {
    obj.coordination.precise_location = redactLocation(obj.coordination.precise_location, canViewExact)
    obj.coordination.directions_url = canViewExact ? directionsUrl(obj.coordination.precise_location) : null
    if (!canViewExact) delete obj.coordination.instructions
  }
  return obj
}

router.get('/', optionalProtect, async (req, res) => {
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
  res.json({ success: true, data: posts.map(p => toResponsePost(p, req.user?._id)), total, page: Number(page), pages: Math.ceil(total / limit) })
})

router.get('/:id', optionalProtect, async (req, res) => {
  const post = await AssistancePost.findById(req.params.id).populate('poster', 'name avatar_url verified bio').populate('responses.responder', 'name avatar_url')
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
  res.json({ success: true, data: toResponsePost(post, req.user?._id) })
})

router.post('/', protect, async (req, res) => {
  if (!req.body.title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' })
  const post = await AssistancePost.create({ ...req.body, poster: req.user._id })
  res.status(201).json({ success: true, data: post })
})

router.post('/:id/respond', protect, async (req, res) => {
  const post = await AssistancePost.findById(req.params.id)
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
  if (post.poster.toString() === req.user._id.toString()) return res.status(400).json({ success: false, message: 'You cannot respond to your own post' })
  if (post.status !== 'open') return res.status(400).json({ success: false, message: 'This post is no longer accepting responses' })
  if (post.responses.some(r => r.responder.toString() === req.user._id.toString() && r.status !== 'cancelled')) {
    return res.status(400).json({ success: false, message: 'You already responded to this post' })
  }
  post.responses.push({ responder: req.user._id, message: req.body.message })
  await post.save()

  // Notify poster
  const notif = await Notification.create({
    recipient: post.poster,
    type: 'assistance',
    title: 'New response to your post',
    message: `${req.user.name} responded to "${post.title}".`,
    link: `/assistance/${post._id}`
  })
  notifyUser(post.poster.toString(), 'assistance:new_response', { notification: notif })

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

// PATCH /api/v1/assistance/:id/responses/:responseId/accept — poster accepts a response
router.patch('/:id/responses/:responseId/accept', protect, async (req, res) => {
  const post = await AssistancePost.findById(req.params.id)
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
  if (post.poster.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only poster can accept responses' })

  const response = post.responses.id(req.params.responseId)
  if (!response) return res.status(404).json({ success: false, message: 'Response not found' })
  if (post.status !== 'open') return res.status(400).json({ success: false, message: 'Only open posts can accept a response' })

  response.status = 'accepted'
  post.status = 'matched'
  post.coordination = {
    ...(post.coordination || {}),
    precise_location: req.body.precise_location || post.location,
    instructions: req.body.instructions || '',
    agreed_time: req.body.agreed_time || post.scheduled_at || undefined
  }

  // Reject all other pending responses
  post.responses.forEach(r => {
    if (r._id.toString() !== req.params.responseId && r.status === 'pending') {
      r.status = 'rejected'
    }
  })

  await post.save()

  const notif = await Notification.create({
    recipient: response.responder,
    type: 'assistance',
    title: 'Your response was accepted',
    message: `Your response to "${post.title}" was accepted!`,
    link: `/assistance/${post._id}`
  })
  notifyUser(response.responder.toString(), 'assistance:response_accepted', { notification: notif })

  res.json({ success: true, data: post })
})

router.patch('/:id/start', protect, async (req, res) => {
  const post = await AssistancePost.findById(req.params.id)
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
  const accepted = acceptedResponse(post)
  if (!accepted) return res.status(400).json({ success: false, message: 'No accepted helper found' })
  if (accepted.responder.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only the accepted helper can start this task' })
  if (post.status === 'in_progress') return res.json({ success: true, data: post, message: 'Help is already in progress' })
  if (post.status !== 'matched') return res.status(400).json({ success: false, message: 'Help must be matched before it can start' })

  post.status = 'in_progress'
  post.coordination = post.coordination || {}
  post.coordination.started_at = new Date()
  await post.save()
  notifyUser(post.poster.toString(), 'assistance:started', { postId: post._id, title: post.title })
  res.json({ success: true, data: post })
})

router.patch('/:id/complete', protect, async (req, res) => {
  const post = await AssistancePost.findById(req.params.id)
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
  const accepted = acceptedResponse(post)
  if (!accepted) return res.status(400).json({ success: false, message: 'No accepted helper found' })
  if (accepted.responder.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only the accepted helper can mark help complete' })
  if (post.coordination?.completed_by_helper_at) {
    return res.json({ success: true, data: post, message: 'Completion is already waiting for requester confirmation' })
  }
  if (!['matched', 'in_progress'].includes(post.status)) return res.status(400).json({ success: false, message: 'This help request cannot be completed now' })

  post.coordination = post.coordination || {}
  post.coordination.completed_by_helper_at = new Date()
  post.status = 'in_progress'
  await post.save()

  const notif = await Notification.create({
    recipient: post.poster,
    type: 'assistance',
    title: 'Help marked complete',
    message: `${req.user.name} marked "${post.title}" complete. Please confirm if everything is done.`,
    link: `/assistance/${post._id}`
  })
  notifyUser(post.poster.toString(), 'assistance:completion_requested', { notification: notif })
  res.json({ success: true, data: post, message: 'Waiting for requester confirmation' })
})

router.patch('/:id/confirm-completion', protect, async (req, res) => {
  const post = await AssistancePost.findById(req.params.id)
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
  if (post.poster.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only the requester can confirm completion' })
  if (post.status === 'completed') return res.json({ success: true, data: post, message: 'Help is already completed' })
  const accepted = acceptedResponse(post)
  if (!accepted || !post.coordination?.completed_by_helper_at) return res.status(400).json({ success: false, message: 'Helper must mark completion first' })
  if (post.status !== 'in_progress') return res.status(400).json({ success: false, message: 'Help must be in progress before completion can be confirmed' })

  post.status = 'completed'
  post.coordination.confirmed_by_poster_at = new Date()
  await post.save()
  await addPoints(accepted.responder, 20)
  await addPoints(post.poster, 5)
  notifyUser(accepted.responder.toString(), 'assistance:completed', { postId: post._id, title: post.title })
  res.json({ success: true, data: post })
})

router.patch('/:id/cancel', protect, async (req, res) => {
  const post = await AssistancePost.findById(req.params.id)
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
  const accepted = acceptedResponse(post)
  const allowed = post.poster.toString() === req.user._id.toString() || accepted?.responder.toString() === req.user._id.toString()
  if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized' })
  if (post.status === 'completed') return res.status(400).json({ success: false, message: 'Completed help cannot be cancelled' })

  if (accepted && accepted.responder.toString() === req.user._id.toString()) {
    accepted.status = 'cancelled'
    post.responses.forEach(r => {
      if (r.status === 'rejected') r.status = 'pending'
    })
    post.status = 'open'
  } else {
    post.status = 'cancelled'
  }
  post.coordination = post.coordination || {}
  post.coordination.cancelled_at = new Date()
  post.coordination.cancellation_reason = req.body.reason || ''
  await post.save()
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
