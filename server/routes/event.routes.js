const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const Event = require('../models/Event')
const Notification = require('../models/Notification')
const User = require('../models/User')
const { addPoints } = require('../utils/badgeEngine')
const { notifyUser } = require('../sockets/socket')
const { sendMail, eventJoinEmail } = require('../utils/mailer')

router.get('/', async (req, res) => {
  const { q, category, date, status, tags, page = 1, limit = 20 } = req.query
  const filter = {}
  if (status) filter.status = status
  else filter.status = { $in: ['published', 'ongoing'] }
  if (category) filter.category = category
  if (tags) filter.tags = { $in: tags.split(',') }
  if (q) filter.$or = [
    { title: { $regex: q, $options: 'i' } },
    { 'location.city': { $regex: q, $options: 'i' } },
    { tags: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } }
  ]
  if (date) filter.starts_at = { $gte: new Date(date) }
  const total = await Event.countDocuments(filter)
  const events = await Event.find(filter).populate('organizer', 'name avatar_url verified').sort({ starts_at: 1 }).skip((page - 1) * limit).limit(Number(limit))
  res.json({ success: true, data: events, total, page: Number(page), pages: Math.ceil(total / limit) })
})

router.get('/:id', async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name avatar_url verified bio').populate('participants.user', 'name avatar_url')
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' })
  res.json({ success: true, data: event })
})

router.post('/', protect, async (req, res) => {
  if (!req.body.title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' })
  if (!req.body.starts_at || new Date(req.body.starts_at) <= new Date()) {
    return res.status(400).json({ success: false, message: 'Event start time must be in the future' })
  }
  if (req.body.ends_at && new Date(req.body.ends_at) <= new Date(req.body.starts_at)) {
    return res.status(400).json({ success: false, message: 'Event end time must be after the start time' })
  }
  if (req.body.max_volunteers !== undefined && Number(req.body.max_volunteers) < 1) {
    return res.status(400).json({ success: false, message: 'Volunteer capacity must be at least 1' })
  }
  const event = await Event.create({ ...req.body, organizer: req.user._id })
  await addPoints(req.user._id, 30)
  res.status(201).json({ success: true, data: event })
})

router.patch('/:id', protect, async (req, res) => {
  const event = await Event.findById(req.params.id)
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' })
  if (event.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })
  if (['completed', 'cancelled'].includes(event.status)) {
    return res.status(400).json({ success: false, message: 'Completed or cancelled events cannot be edited' })
  }
  if (req.body.starts_at && new Date(req.body.starts_at) <= new Date()) {
    return res.status(400).json({ success: false, message: 'Event start time must be in the future' })
  }
  if (req.body.ends_at && new Date(req.body.ends_at) <= new Date(req.body.starts_at || event.starts_at)) {
    return res.status(400).json({ success: false, message: 'Event end time must be after the start time' })
  }
  if (req.body.max_volunteers !== undefined && Number(req.body.max_volunteers) < event.participants.filter(p => p.status !== 'cancelled').length) {
    return res.status(400).json({ success: false, message: 'Volunteer capacity cannot be below current registrations' })
  }
  const allowed = ['title', 'description', 'category', 'cover_image_url', 'location', 'starts_at', 'ends_at', 'max_volunteers', 'status', 'resources_needed', 'tasks', 'tags']
  allowed.forEach(field => { if (req.body[field] !== undefined) event[field] = req.body[field] })
  await event.save()
  res.json({ success: true, data: event })
})

router.delete('/:id', protect, async (req, res) => {
  const event = await Event.findById(req.params.id).populate('participants.user', '_id')
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' })
  if (event.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })

  const participantIds = event.participants
    .filter(p => p.user && p.user._id.toString() !== req.user._id.toString())
    .map(p => p.user._id || p.user)

  if (participantIds.length > 0) {
    await Notification.insertMany(participantIds.map(uid => ({
      recipient: uid,
      type: 'event',
      title: 'Event cancelled',
      message: `"${event.title}" has been cancelled.`,
      link: '/events'
    })))
    participantIds.forEach(uid => notifyUser(uid.toString(), 'event:cancelled', { eventId: event._id, eventTitle: event.title }))
  }

  await event.deleteOne()
  res.json({ success: true, message: 'Event deleted' })
})

router.post('/:id/join', protect, async (req, res) => {
  const existing = await Event.findById(req.params.id).select('_id')
  if (!existing) return res.status(404).json({ success: false, message: 'Event not found' })

  const activeParticipantsExpr = {
    $filter: {
      input: '$participants',
      as: 'p',
      cond: { $ne: ['$$p.status', 'cancelled'] }
    }
  }
  const event = await Event.findOneAndUpdate(
    {
      _id: req.params.id,
      organizer: { $ne: req.user._id },
      status: { $in: ['published', 'ongoing'] },
      starts_at: { $gt: new Date() },
      participants: {
        $not: {
          $elemMatch: {
            user: req.user._id,
            status: { $ne: 'cancelled' }
          }
        }
      },
      $expr: {
        $or: [
          { $eq: ['$max_volunteers', null] },
          { $lt: [{ $size: activeParticipantsExpr }, '$max_volunteers'] }
        ]
      }
    },
    {
      $push: { participants: { user: req.user._id, role: req.body.role || 'participant', registered_at: new Date() } },
      $inc: { registered_count: 1 }
    },
    { new: true, runValidators: true }
  )
  if (!event) return res.status(409).json({ success: false, message: 'Event is full or no longer accepting registrations' })
  await addPoints(req.user._id, 10)
  notifyUser(event.organizer.toString(), 'event:new_participant', { eventId: event._id, user: req.user.name })

  try {
    const organizer = await User.findById(event.organizer)
    const emailData = eventJoinEmail({
      userName: req.user.name,
      eventTitle: event.title,
      eventDate: new Date(event.starts_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      eventLocation: event.location?.address || event.location?.city || 'TBD',
      organizerName: organizer?.name || 'Organizer'
    })
    await sendMail({ to: req.user.email, ...emailData })
  } catch (err) {
    console.error('[Mail] Event join email failed:', err.message)
  }

  res.json({ success: true, data: event })
})

router.post('/:id/leave', protect, async (req, res) => {
  const event = await Event.findById(req.params.id)
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' })
  if (new Date(event.starts_at) <= new Date()) return res.status(400).json({ success: false, message: 'Cannot leave after the event has started' })
  const idx = event.participants.findIndex(p => p.user.toString() === req.user._id.toString() && p.status !== 'cancelled')
  if (idx === -1) return res.status(400).json({ success: false, message: 'Not registered' })
  event.participants.splice(idx, 1)
  event.registered_count = Math.max(0, event.registered_count - 1)
  await event.save()

  await Notification.create({
    recipient: event.organizer,
    type: 'event',
    title: 'Participant left your event',
    message: `${req.user.name} has left "${event.title}".`,
    link: `/events/${event._id}`
  })
  notifyUser(event.organizer.toString(), 'event:participant_left', { eventId: event._id, eventTitle: event.title, userName: req.user.name })

  res.json({ success: true, data: event })
})

// PATCH /api/v1/events/:id/tasks/:taskId — organizer updates a task
router.patch('/:id/tasks/:taskId', protect, async (req, res) => {
  const event = await Event.findById(req.params.id)
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' })
  if (event.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only organizer can update tasks' })

  const task = event.tasks?.id(req.params.taskId)
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' })

  const prevAssignee = task.assigned_to?.toString()
  const allowed = ['title', 'description', 'assigned_to', 'status', 'due_at']
  allowed.forEach(field => { if (req.body[field] !== undefined) task[field] = req.body[field] })
  await event.save()

  const newAssignee = task.assigned_to?.toString()
  if (newAssignee && newAssignee !== prevAssignee) {
    const notif = await Notification.create({
      recipient: newAssignee,
      type: 'event',
      title: 'Task assigned to you',
      message: `You've been assigned "${task.title}" in "${event.title}".`,
      link: `/events/${event._id}`
    })
    notifyUser(newAssignee, 'event:task_assigned', { notification: notif })
  }

  if (req.body.status) {
    notifyUser(event.organizer.toString(), 'event:task_updated', { eventId: event._id, taskTitle: task.title, status: task.status })
  }

  res.json({ success: true, data: event })
})

module.exports = router
