const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const Resource = require('../models/Resource')
const Notification = require('../models/Notification')
const { addPoints } = require('../utils/badgeEngine')
const { recalculateTrustScore } = require('../utils/trustEngine')
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
  const resources = await Resource.find(filter).populate('owner', 'name avatar_url verified trust_score trust_level').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
  res.json({ success: true, data: resources, total, page: Number(page), pages: Math.ceil(total / limit) })
})

router.get('/:id', async (req, res) => {
  const resource = await Resource.findById(req.params.id)
    .populate('owner', 'name avatar_url verified bio trust_score trust_level')
    .populate('requests.requester', 'name avatar_url')

  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })

  // 48h dispute check on utr_submitted requests
  try {
    const now = new Date()
    let needsSave = false
    for (const req_ of resource.requests) {
      if (
        req_.status === 'utr_submitted' &&
        req_.utr_submitted_at &&
        (now - new Date(req_.utr_submitted_at)) > 48 * 60 * 60 * 1000
      ) {
        req_.status = 'disputed'
        needsSave = true
        recalculateTrustScore(req_.requester._id || req_.requester).catch(err => console.error('[Trust]', err.message))
      }
    }
    if (needsSave) await resource.save()
  } catch (err) {
    console.error('[Resource GET dispute check]', err.message)
  }

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

  notifyUser(resource.owner._id.toString(), 'resource:borrow_request', {
    requesterName: req.user.name,
    resourceTitle: resource.title
  })

  res.json({ success: true, data: resource })
})

// PATCH /api/v1/resources/:id/requests/:requestId/approve — owner approves request
router.patch('/:id/requests/:requestId/approve', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })
  if (resource.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })

  const request = resource.requests.id(req.params.requestId)
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

  request.status = 'approved'
  if (req.body.owner_upi_id) request.owner_upi_id = req.body.owner_upi_id
  if (req.body.owner_upi_name) request.owner_upi_name = req.body.owner_upi_name
  if (!resource.is_free) resource.status = 'borrowed'
  await resource.save()

  const notif = await Notification.create({
    recipient: request.requester,
    type: 'resource',
    title: 'Borrow request approved',
    message: `Your request for "${resource.title}" has been approved.`,
    link: `/resources/${resource._id}`
  })
  notifyUser(request.requester.toString(), 'resource:request_approved', { notification: notif })

  res.json({ success: true, data: resource })
})

// PATCH /api/v1/resources/:id/requests/:requestId/reject — owner rejects request
router.patch('/:id/requests/:requestId/reject', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })
  if (resource.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })

  const request = resource.requests.id(req.params.requestId)
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

  request.status = 'rejected'
  await resource.save()

  const notif = await Notification.create({
    recipient: request.requester,
    type: 'resource',
    title: 'Borrow request declined',
    message: `Your request for "${resource.title}" was declined.`,
    link: `/resources/${resource._id}`
  })
  notifyUser(request.requester.toString(), 'resource:request_rejected', { notification: notif })

  res.json({ success: true, data: resource })
})

// POST /api/v1/resources/:id/requests/:requestId/return — borrower marks item returned
router.post('/:id/requests/:requestId/return', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })

  const request = resource.requests.id(req.params.requestId)
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' })
  if (request.requester.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only borrower can mark as returned' })
  if (request.status !== 'approved') return res.status(400).json({ success: false, message: 'Request must be approved first' })

  request.status = 'returned'
  if (resource.is_free) resource.status = 'available'
  await resource.save()

  const notif = await Notification.create({
    recipient: resource.owner,
    type: 'resource',
    title: 'Item returned',
    message: `${req.user.name} has returned "${resource.title}".`,
    link: `/resources/${resource._id}`
  })
  notifyUser(resource.owner.toString(), 'resource:item_returned', { notification: notif })

  recalculateTrustScore(req.user._id).catch(err => console.error('[Trust]', err.message))

  res.json({ success: true, data: resource })
})

// POST /api/v1/resources/:id/requests/:requestId/submit-utr — borrower submits UTR
router.post('/:id/requests/:requestId/submit-utr', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })

  const request = resource.requests.id(req.params.requestId)
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' })
  if (request.requester.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only borrower can submit UTR' })
  if (request.status !== 'returned') return res.status(400).json({ success: false, message: 'Return the item before paying' })

  const { utr_number } = req.body
  if (!utr_number) return res.status(400).json({ success: false, message: 'UTR number is required' })

  request.utr_number = utr_number
  request.utr_submitted_at = new Date()
  request.status = 'utr_submitted'
  await resource.save()

  const notif = await Notification.create({
    recipient: resource.owner,
    type: 'resource',
    title: 'UTR submitted for payment',
    message: `${req.user.name} submitted UTR ${utr_number} for "${resource.title}".`,
    link: `/resources/${resource._id}`
  })
  notifyUser(resource.owner.toString(), 'resource:utr_submitted', { notification: notif })

  res.json({ success: true, message: 'UTR submitted' })
})

// PATCH /api/v1/resources/:id/requests/:requestId/confirm-payment — owner confirms payment
router.patch('/:id/requests/:requestId/confirm-payment', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })
  if (resource.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })

  const request = resource.requests.id(req.params.requestId)
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

  request.payment_confirmed_by_owner = true
  request.payment_confirmed_at = new Date()
  request.status = 'payment_confirmed'
  resource.status = 'available'
  await resource.save()

  const notif = await Notification.create({
    recipient: request.requester,
    type: 'resource',
    title: 'Payment confirmed',
    message: `Your payment for "${resource.title}" has been confirmed.`,
    link: `/resources/${resource._id}`
  })
  notifyUser(request.requester.toString(), 'resource:payment_confirmed', { notification: notif })

  recalculateTrustScore(request.requester).catch(err => console.error('[Trust]', err.message))

  res.json({ success: true, data: resource })
})

module.exports = router
