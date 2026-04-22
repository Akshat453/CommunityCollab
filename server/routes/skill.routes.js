const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const { protect } = require('../middleware/auth.middleware')
const SkillListing = require('../models/SkillListing')
const SkillConnection = require('../models/SkillConnection')
const { addPoints } = require('../utils/badgeEngine')
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
  const skills = await SkillListing.find(filter).populate('user', 'name avatar_url verified rating').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
  res.json({ success: true, data: skills, total, page: Number(page), pages: Math.ceil(total / limit) })
})

router.get('/mutual-matches', protect, async (req, res) => {
  const myListings = await SkillListing.find({ user: req.user._id, listing_type: 'offering', status: 'active' })
  const mySkills = myListings.map(l => l.skill_name)
  const matches = await SkillListing.find({ listing_type: 'seeking', skill_name: { $in: mySkills }, user: { $ne: req.user._id }, status: 'active' }).populate('user', 'name avatar_url verified rating')
  res.json({ success: true, data: matches })
})

// GET connections for current user on a specific listing
router.get('/connections', protect, async (req, res) => {
  const { listing } = req.query
  const filter = { $or: [{ learner: req.user._id }, { teacher: req.user._id }] }
  if (listing) filter.listing = listing
  const connections = await SkillConnection.find(filter)
    .populate('listing')
    .populate('learner', 'name avatar_url')
    .populate('teacher', 'name avatar_url')
    .sort({ createdAt: -1 })
  res.json({ success: true, data: connections })
})

router.get('/:id', async (req, res) => {
  const skill = await SkillListing.findById(req.params.id).populate('user', 'name avatar_url verified rating bio skills location')
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

  // Check if connection already exists
  const existing = await SkillConnection.findOne({ listing: listing._id, learner: req.user._id })
  if (existing) return res.status(400).json({ success: false, message: 'Connection request already sent' })

  const connection = await SkillConnection.create({
    listing: listing._id,
    learner: req.user._id,
    teacher: listing.user._id,
    exchange_type: listing.exchange_type,
    message: req.body.message || ''
  })

  // Notify teacher via socket
  notifyUser(listing.user._id.toString(), 'skill:connection_request', {
    learnerName: req.user.name,
    skillName: listing.skill_name,
    connectionId: connection._id
  })

  // Send email to listing owner
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

  // Notify learner via socket
  notifyUser(connection.learner._id.toString(), 'skill:connection_accepted', {
    teacherName: req.user.name,
    skillName: connection.listing.skill_name,
    connectionId: connection._id,
    exchangeType: connection.exchange_type
  })

  // Send accepted email to learner
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
  if (!connection) return res.status(404).json({ success: false, message: 'Connection not found' })
  if (connection.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the teacher can reject' })
  }
  connection.status = 'rejected'
  await connection.save()
  res.json({ success: true, data: connection })
})

// ─── SKILL PAYMENT ENDPOINTS ──────────────────────────────

router.post('/connections/:id/create-payment-order', protect, async (req, res) => {
  const Razorpay = require('razorpay')
  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })

  const connection = await SkillConnection.findById(req.params.id)
    .populate({ path: 'listing', model: 'SkillListing' })
    .populate('teacher', 'name email')
    .populate('learner', 'name email')

  if (!connection) return res.status(404).json({ success: false, message: 'Connection not found' })
  if (connection.learner._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the learner can initiate payment' })
  }
  if (connection.exchange_type !== 'paid') {
    return res.status(400).json({ success: false, message: 'This connection is not a paid session' })
  }
  if (connection.status !== 'accepted') {
    return res.status(400).json({ success: false, message: 'Teacher has not accepted yet' })
  }
  if (connection.payment_status === 'paid') {
    return res.status(400).json({ success: false, message: 'Already paid' })
  }

  const amountInPaise = Math.round(connection.listing.price_per_hour * 100)

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `skill_${connection._id}_${req.user._id}`,
    notes: {
      connection_id: connection._id.toString(),
      skill_name: connection.listing.skill_name,
      learner_id: connection.learner._id.toString(),
      teacher_id: connection.teacher._id.toString()
    }
  })

  res.json({
    success: true,
    data: {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
      skill_name: connection.listing.skill_name,
      price_per_hour: connection.listing.price_per_hour,
      teacher_name: connection.teacher.name
    }
  })
})

router.post('/connections/:id/verify-payment', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expected !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed' })
  }

  const connection = await SkillConnection.findById(req.params.id)
    .populate({ path: 'listing', model: 'SkillListing' })
    .populate('teacher', 'name email')

  if (!connection) return res.status(404).json({ success: false, message: 'Connection not found' })

  connection.payment_status = 'paid'
  connection.payment_id = razorpay_payment_id
  await connection.save()

  // Award points to teacher
  await addPoints(connection.teacher._id, 20)

  // Emails
  try {
    await sendMail({
      to: req.user.email,
      subject: `Payment confirmed — ${connection.listing.skill_name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#FFE3BB;border-radius:12px">
          <h2 style="color:#03A6A1">Session Payment Confirmed!</h2>
          <p>Your payment of <strong>&#8377;${connection.listing.price_per_hour}</strong> for
          <strong>${connection.listing.skill_name}</strong> with
          <strong>${connection.teacher.name}</strong> is confirmed.</p>
          <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
          <p>Reach out to your teacher to schedule the session.</p>
          <p style="color:#888;font-size:12px">CommunityCollab — Collaborate. Share. Thrive.</p>
        </div>
      `
    })
    await sendMail({
      to: connection.teacher.email,
      subject: `Payment received for your skill: ${connection.listing.skill_name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#FFE3BB;border-radius:12px">
          <h2 style="color:#03A6A1">You received a payment!</h2>
          <p><strong>${req.user.name}</strong> has paid <strong>&#8377;${connection.listing.price_per_hour}</strong>
          for a session of <strong>${connection.listing.skill_name}</strong>.</p>
          <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
          <p style="color:#888;font-size:12px">CommunityCollab — Collaborate. Share. Thrive.</p>
        </div>
      `
    })
  } catch (err) {
    console.error('[Mail] Skill payment email failed:', err.message)
  }

  // Notify teacher via socket
  notifyUser(connection.teacher._id.toString(), 'skill:payment_received', {
    learnerName: req.user.name,
    skillName: connection.listing.skill_name,
    amount: connection.listing.price_per_hour,
    paymentId: razorpay_payment_id
  })

  res.json({ success: true, message: 'Skill payment verified', data: { payment_id: razorpay_payment_id } })
})

module.exports = router
