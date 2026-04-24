const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const SkillListing = require('../models/SkillListing')
const SkillConnection = require('../models/SkillConnection')
const Notification = require('../models/Notification')
const { addPoints } = require('../utils/badgeEngine')
const { recalculateTrustScore } = require('../utils/trustEngine')
const { notifyUser } = require('../sockets/socket')
const { sendMail, skillConnectionEmail } = require('../utils/mailer')

router.get('/', async (req, res) => {
  const { q, category, mode, exchange_type, listing_type, page = 1, limit = 20 } = req.query
  const filter = { status: 'active' }
  if (category) filter.skill_category = category
  if (mode) filter.mode = mode
  if (exchange_type) filter.exchange_type = exchange_type
  if (listing_type) filter.listing_type = listing_type
  if (q) filter.$or = [
    { skill_name: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } },
    { tags: { $regex: q, $options: 'i' } }
  ]
  const total = await SkillListing.countDocuments(filter)
  const skills = await SkillListing.find(filter).populate('user', 'name avatar_url verified rating trust_score trust_level').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
  res.json({ success: true, data: skills, total, page: Number(page), pages: Math.ceil(total / limit) })
})

router.get('/mutual-matches', protect, async (req, res) => {
  const myListings = await SkillListing.find({ user: req.user._id, listing_type: 'offering', status: 'active' })
  const mySkills = myListings.map(l => l.skill_name)
  const matches = await SkillListing.find({ listing_type: 'seeking', skill_name: { $in: mySkills }, user: { $ne: req.user._id }, status: 'active' }).populate('user', 'name avatar_url verified rating trust_score trust_level')
  res.json({ success: true, data: matches })
})

// GET connections for current user on a specific listing
router.get('/connections', protect, async (req, res) => {
  const { listing } = req.query
  const filter = { $or: [{ learner: req.user._id }, { teacher: req.user._id }] }
  if (listing) filter.listing = listing
  const connections = await SkillConnection.find(filter)
    .populate('listing')
    .populate('learner', 'name avatar_url trust_score trust_level')
    .populate('teacher', 'name avatar_url trust_score trust_level')
    .sort({ createdAt: -1 })
  res.json({ success: true, data: connections })
})

router.get('/:id', async (req, res) => {
  const skill = await SkillListing.findById(req.params.id).populate('user', 'name avatar_url verified rating bio skills location trust_score trust_level')
  if (!skill) return res.status(404).json({ success: false, message: 'Skill listing not found' })
  res.json({ success: true, data: skill })
})

router.post('/', protect, async (req, res) => {
  const listing = await SkillListing.create({ ...req.body, user: req.user._id })
  await addPoints(req.user._id, 15)
  res.status(201).json({ success: true, data: listing })
})

router.patch('/:id', protect, async (req, res) => {
  const skill = await SkillListing.findById(req.params.id)
  if (!skill) return res.status(404).json({ success: false, message: 'Skill listing not found' })
  if (skill.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })
  Object.assign(skill, req.body)
  await skill.save()
  res.json({ success: true, data: skill })
})

router.delete('/:id', protect, async (req, res) => {
  const skill = await SkillListing.findById(req.params.id)
  if (!skill) return res.status(404).json({ success: false, message: 'Skill listing not found' })
  if (skill.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })
  await skill.deleteOne()
  res.json({ success: true, message: 'Skill listing deleted' })
})

// ─── SKILL CONNECTION ENDPOINTS ───────────────────────────

// POST /api/v1/skills/:id/connect — learner requests connection
router.post('/:id/connect', protect, async (req, res) => {
  const listing = await SkillListing.findById(req.params.id).populate('user', 'name email')
  if (!listing) return res.status(404).json({ success: false, message: 'Skill listing not found' })
  if (listing.user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot connect to your own listing' })
  }

  const existing = await SkillConnection.findOne({ listing: listing._id, learner: req.user._id })
  if (existing) return res.status(400).json({ success: false, message: 'Connection request already sent' })

  const connection = await SkillConnection.create({
    listing: listing._id,
    learner: req.user._id,
    teacher: listing.user._id,
    exchange_type: listing.exchange_type,
    message: req.body.message || ''
  })

  notifyUser(listing.user._id.toString(), 'skill:connection_request', {
    learnerName: req.user.name,
    skillName: listing.skill_name,
    connectionId: connection._id
  })

  try {
    const emailData = skillConnectionEmail({
      userName: listing.user.name,
      skillName: listing.skill_name,
      otherUserName: req.user.name,
      type: 'request'
    })
    await sendMail({ to: listing.user.email, ...emailData })
  } catch (err) {
    console.error('[Mail] Skill connection email failed:', err.message)
  }

  res.status(201).json({ success: true, data: connection })
})

// PATCH /api/v1/skills/connections/:id/accept — teacher accepts
router.patch('/connections/:id/accept', protect, async (req, res) => {
  const connection = await SkillConnection.findById(req.params.id)
    .populate('listing')
    .populate('learner', 'name email')
  if (!connection) return res.status(404).json({ success: false, message: 'Connection not found' })
  if (connection.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the teacher can accept' })
  }

  connection.status = 'accepted'
  await connection.save()

  notifyUser(connection.learner._id.toString(), 'skill:connection_accepted', {
    teacherName: req.user.name,
    skillName: connection.listing.skill_name,
    connectionId: connection._id,
    exchangeType: connection.exchange_type
  })

  try {
    const emailData = skillConnectionEmail({
      userName: connection.learner.name,
      skillName: connection.listing.skill_name,
      otherUserName: req.user.name,
      type: 'accepted'
    })
    await sendMail({ to: connection.learner.email, ...emailData })
  } catch (err) {
    console.error('[Mail] Skill accept email failed:', err.message)
  }

  res.json({ success: true, data: connection })
})

// PATCH /api/v1/skills/connections/:id/reject — teacher rejects
router.patch('/connections/:id/reject', protect, async (req, res) => {
  const connection = await SkillConnection.findById(req.params.id)
    .populate('listing', 'skill_name')
  if (!connection) return res.status(404).json({ success: false, message: 'Connection not found' })
  if (connection.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the teacher can reject' })
  }
  connection.status = 'rejected'
  await connection.save()

  const notif = await Notification.create({
    recipient: connection.learner,
    type: 'skill',
    title: 'Connection request declined',
    message: `Your connection request for "${connection.listing.skill_name}" was declined.`,
    link: `/skills/${connection.listing._id}`
  })
  notifyUser(connection.learner.toString(), 'skill:connection_rejected', { notification: notif, connectionId: connection._id })

  res.json({ success: true, data: connection })
})

// PATCH /api/v1/skills/connections/:id/complete — teacher or learner marks session complete
router.patch('/connections/:id/complete', protect, async (req, res) => {
  const connection = await SkillConnection.findById(req.params.id)
    .populate('listing', 'skill_name')
  if (!connection) return res.status(404).json({ success: false, message: 'Connection not found' })
  if (connection.status !== 'accepted') return res.status(400).json({ success: false, message: 'Session must be accepted first' })

  const isLearner = connection.learner.toString() === req.user._id.toString()
  const isTeacher = connection.teacher.toString() === req.user._id.toString()
  if (!isLearner && !isTeacher) return res.status(403).json({ success: false, message: 'Not authorized' })

  if (isLearner) connection.learner_completed = true
  if (isTeacher) connection.teacher_completed = true

  if (connection.learner_completed && connection.teacher_completed) {
    connection.status = 'completed'
    await connection.save()

    await addPoints(connection.learner, 10)
    await addPoints(connection.teacher, 10)

    const [learnerNotif, teacherNotif] = await Promise.all([
      Notification.create({
        recipient: connection.learner,
        type: 'skill',
        title: 'Session completed',
        message: `Your skill session for "${connection.listing.skill_name}" is complete!`,
        link: `/skills/${connection.listing._id}`
      }),
      Notification.create({
        recipient: connection.teacher,
        type: 'skill',
        title: 'Session completed',
        message: `Your skill session for "${connection.listing.skill_name}" is complete!`,
        link: `/skills/${connection.listing._id}`
      })
    ])
    notifyUser(connection.learner.toString(), 'skill:session_completed', { notification: learnerNotif })
    notifyUser(connection.teacher.toString(), 'skill:session_completed', { notification: teacherNotif })

    recalculateTrustScore(connection.learner).catch(err => console.error('[Trust]', err.message))
    recalculateTrustScore(connection.teacher).catch(err => console.error('[Trust]', err.message))
  } else {
    await connection.save()
  }

  res.json({ success: true, data: connection, message: connection.status === 'completed' ? 'Session completed!' : 'Marked as complete — waiting for other party' })
})

// POST /api/v1/skills/connections/:id/set-upi — teacher sets their UPI details
router.post('/connections/:id/set-upi', protect, async (req, res) => {
  const connection = await SkillConnection.findById(req.params.id)
  if (!connection) return res.status(404).json({ success: false, message: 'Connection not found' })
  if (connection.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the teacher can set UPI details' })
  }

  const { teacher_upi_id, teacher_upi_name } = req.body
  if (!teacher_upi_id) return res.status(400).json({ success: false, message: 'UPI ID is required' })

  connection.teacher_upi_id = teacher_upi_id
  connection.teacher_upi_name = teacher_upi_name || ''
  await connection.save()

  res.json({ success: true, data: connection, message: 'UPI details saved' })
})

// POST /api/v1/skills/connections/:id/submit-utr — learner submits UTR
router.post('/connections/:id/submit-utr', protect, async (req, res) => {
  const connection = await SkillConnection.findById(req.params.id)
    .populate('listing', 'skill_name')
  if (!connection) return res.status(404).json({ success: false, message: 'Connection not found' })
  if (connection.learner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the learner can submit UTR' })
  }
  if (connection.status !== 'completed') return res.status(400).json({ success: false, message: 'Complete the session before paying' })

  const { utr_number } = req.body
  if (!utr_number) return res.status(400).json({ success: false, message: 'UTR number is required' })

  connection.utr_number = utr_number
  connection.utr_submitted_at = new Date()
  connection.payment_status = 'utr_submitted'
  await connection.save()

  const notif = await Notification.create({
    recipient: connection.teacher,
    type: 'skill',
    title: 'UTR submitted for payment',
    message: `${req.user.name} submitted UTR ${utr_number} for "${connection.listing.skill_name}".`,
    link: `/skills/${connection.listing._id}`
  })
  notifyUser(connection.teacher.toString(), 'skill:utr_submitted', { notification: notif })

  res.json({ success: true, message: 'UTR submitted' })
})

// PATCH /api/v1/skills/connections/:id/confirm-payment — teacher confirms payment
router.patch('/connections/:id/confirm-payment', protect, async (req, res) => {
  const connection = await SkillConnection.findById(req.params.id)
    .populate('listing', 'skill_name price_per_hour')
  if (!connection) return res.status(404).json({ success: false, message: 'Connection not found' })
  if (connection.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the teacher can confirm payment' })
  }

  connection.payment_confirmed_by_teacher = true
  connection.payment_confirmed_at = new Date()
  connection.payment_status = 'paid'
  await connection.save()

  await addPoints(connection.teacher, 20)

  const notif = await Notification.create({
    recipient: connection.learner,
    type: 'skill',
    title: 'Payment confirmed',
    message: `Your payment for "${connection.listing.skill_name}" has been confirmed.`,
    link: `/skills/${connection.listing._id}`
  })
  notifyUser(connection.learner.toString(), 'skill:payment_confirmed', { notification: notif })

  recalculateTrustScore(connection.learner).catch(err => console.error('[Trust]', err.message))

  res.json({ success: true, message: 'Payment confirmed' })
})

module.exports = router
