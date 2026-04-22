const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const { protect } = require('../middleware/auth.middleware')
const Resource = require('../models/Resource')
const User = require('../models/User')
const { addPoints } = require('../utils/badgeEngine')
const { notifyUser } = require('../sockets/socket')
const { sendMail, resourceRequestEmail } = require('../utils/mailer')

router.get('/', async (req, res) => {
  const { q, type, isFree, status, page = 1, limit = 20 } = req.query
  const filter = {}
  if (type) filter.type = type
  if (status) filter.status = status
  if (isFree !== undefined && isFree !== '') filter.is_free = isFree === 'true'
  if (q) filter.$or = [
    { title: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } },
    { tags: { $regex: q, $options: 'i' } }
  ]
  const total = await Resource.countDocuments(filter)
  const resources = await Resource.find(filter).populate('owner', 'name avatar_url verified').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
  res.json({ success: true, data: resources, total, page: Number(page), pages: Math.ceil(total / limit) })
})

router.get('/:id', async (req, res) => {
  const resource = await Resource.findById(req.params.id).populate('owner', 'name avatar_url verified bio').populate('requests.requester', 'name avatar_url')
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })
  res.json({ success: true, data: resource })
})

router.post('/', protect, async (req, res) => {
  const resource = await Resource.create({ ...req.body, owner: req.user._id })
  await addPoints(req.user._id, 15)
  res.status(201).json({ success: true, data: resource })
})

router.patch('/:id', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })
  if (resource.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })
  Object.assign(resource, req.body)
  await resource.save()
  res.json({ success: true, data: resource })
})

router.delete('/:id', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })
  if (resource.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })
  await resource.deleteOne()
  res.json({ success: true, message: 'Resource deleted' })
})

router.post('/:id/request', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id).populate('owner', 'name email')
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })
  resource.requests.push({ requester: req.user._id, start_date: req.body.start_date, end_date: req.body.end_date, message: req.body.message })
  await resource.save()

  // Send borrow request email to owner
  try {
    const emailData = resourceRequestEmail({
      ownerName: resource.owner.name,
      requesterName: req.user.name,
      resourceTitle: resource.title,
      startDate: req.body.start_date || 'TBD',
      endDate: req.body.end_date || 'TBD'
    })
    if (resource.owner.email) await sendMail({ to: resource.owner.email, ...emailData })
  } catch (err) {
    console.error('[Mail] Resource request email failed:', err.message)
  }

  // Notify owner via socket
  notifyUser(resource.owner._id.toString(), 'resource:borrow_request', {
    requesterName: req.user.name,
    resourceTitle: resource.title
  })

  res.json({ success: true, data: resource })
})

// ─── RAZORPAY PAYMENT ENDPOINTS ───────────────────────────

router.post('/:id/create-payment-order', protect, async (req, res) => {
  const Razorpay = require('razorpay')
  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })

  const { start_date, end_date } = req.body
  if (!start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'Start and end date required' })
  }

  const resource = await Resource.findById(req.params.id).populate('owner', 'name email')
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })
  if (resource.is_free) return res.status(400).json({ success: false, message: 'Resource is free — no payment needed' })
  if (resource.status !== 'available') return res.status(400).json({ success: false, message: 'Resource is not available' })

  const days = Math.max(1, Math.ceil(
    (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)
  ))
  const totalAmount = resource.price_per_day * days
  const amountInPaise = Math.round(totalAmount * 100)

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `resource_${resource._id}_${req.user._id}`,
    notes: {
      resource_id: resource._id.toString(),
      resource_title: resource.title,
      requester_id: req.user._id.toString(),
      owner_id: resource.owner._id.toString(),
      days: days.toString(),
      start_date,
      end_date
    }
  })

  res.json({
    success: true,
    data: {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
      resource_title: resource.title,
      price_per_day: resource.price_per_day,
      days,
      total_amount: totalAmount,
      owner_name: resource.owner.name
    }
  })
})

router.post('/:id/verify-payment', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, start_date, end_date } = req.body

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expected !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed' })
  }

  const resource = await Resource.findById(req.params.id).populate('owner', 'name email')
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })

  const days = start_date && end_date
    ? Math.max(1, Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)))
    : 1
  const totalAmount = resource.price_per_day * days

  // Create borrow request entry and mark as paid
  resource.requests.push({
    requester: req.user._id,
    start_date,
    end_date,
    message: `Paid booking — Payment ID: ${razorpay_payment_id}`,
    payment_status: 'paid',
    payment_id: razorpay_payment_id
  })
  resource.status = 'borrowed'
  await resource.save()

  // Email borrower
  try {
    await sendMail({
      to: req.user.email,
      subject: `Booking confirmed: ${resource.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#FFE3BB;border-radius:12px">
          <h2 style="color:#03A6A1">Booking Confirmed!</h2>
          <p>Your payment of <strong>&#8377;${totalAmount}</strong> for <strong>${resource.title}</strong> is confirmed.</p>
          <div style="background:#fff;border-radius:8px;padding:16px;margin:16px 0">
            <p><strong>Owner:</strong> ${resource.owner.name}</p>
            <p><strong>From:</strong> ${start_date}</p>
            <p><strong>To:</strong> ${end_date}</p>
            <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
          </div>
          <p style="color:#888;font-size:12px">CommunityCollab — Collaborate. Share. Thrive.</p>
        </div>
      `
    })
  } catch (err) {
    console.error('[Mail] Resource payment email failed:', err.message)
  }

  // Notify owner via socket
  notifyUser(resource.owner._id.toString(), 'resource:payment_received', {
    borrowerName: req.user.name,
    resourceTitle: resource.title,
    amount: totalAmount,
    paymentId: razorpay_payment_id
  })

  res.json({ success: true, message: 'Payment verified and booking confirmed', data: { payment_id: razorpay_payment_id } })
})

module.exports = router
