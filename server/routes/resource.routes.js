const express = require('express')
const router = express.Router()
const { protect, optionalProtect } = require('../middleware/auth.middleware')
const Resource = require('../models/Resource')
const Notification = require('../models/Notification')
const { addPoints } = require('../utils/badgeEngine')
const { recalculateTrustScore } = require('../utils/trustEngine')
const { notifyUser } = require('../sockets/socket')
const { sendMail, resourceRequestEmail } = require('../utils/mailer')
const { idOf, isResourceParticipant, redactLocation, directionsUrl } = require('../utils/workflowAccess')

const rangesOverlap = (aStart, aEnd, bStart, bEnd) =>
  new Date(aStart) <= new Date(bEnd) && new Date(bStart) <= new Date(aEnd)

const isValidUtr = (value) => /^[A-Za-z0-9][A-Za-z0-9-]{5,35}$/.test(String(value || '').trim())

const toResponseResource = (resource, userId) => {
  const obj = resource.toObject()
  const canViewExact = userId && isResourceParticipant(resource, userId)
  obj.location = redactLocation(obj.location, canViewExact)
  obj.directions_url = canViewExact ? directionsUrl(obj.location) : null
  obj.requests = obj.requests?.map(r => ({
    ...r,
    pickup_location: redactLocation(r.pickup_location, canViewExact && (idOf(resource.owner) === userId.toString() || idOf(r.requester) === userId.toString())),
    return_location: redactLocation(r.return_location, canViewExact && (idOf(resource.owner) === userId.toString() || idOf(r.requester) === userId.toString()))
  }))
  return obj
}

router.get('/', optionalProtect, async (req, res) => {
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
  res.json({ success: true, data: resources.map(r => toResponseResource(r, req.user?._id)), total, page: Number(page), pages: Math.ceil(total / limit) })
})

router.get('/:id', optionalProtect, async (req, res) => {
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

  res.json({ success: true, data: toResponseResource(resource, req.user?._id) })
})

router.post('/', protect, async (req, res) => {
  if (!req.body.title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' })
  const resource = await Resource.create({ ...req.body, owner: req.user._id })
  await addPoints(req.user._id, 15)
  res.status(201).json({ success: true, data: resource })
})

router.patch('/:id', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })
  if (resource.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' })
  const allowed = ['title', 'description', 'type', 'image_urls', 'availability_schedule', 'location', 'is_free', 'price_per_day', 'condition', 'status', 'tags']
  allowed.forEach(field => { if (req.body[field] !== undefined) resource[field] = req.body[field] })
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
  if (resource.owner._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot request your own resource' })
  }
  if (resource.status !== 'available') return res.status(400).json({ success: false, message: 'Resource is not currently available' })
  const { start_date, end_date } = req.body
  if (!start_date || !end_date || new Date(start_date) >= new Date(end_date) || new Date(start_date) < new Date()) {
    return res.status(400).json({ success: false, message: 'Valid start and end dates are required' })
  }
  const conflict = resource.requests.some(r =>
    ['approved', 'in_possession', 'return_pending'].includes(r.status) &&
    rangesOverlap(start_date, end_date, r.start_date, r.end_date)
  )
  if (conflict) return res.status(400).json({ success: false, message: 'This resource is already reserved for overlapping dates' })

  resource.requests.push({ requester: req.user._id, start_date, end_date, message: req.body.message })
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
  if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending requests can be approved' })

  const updated = await Resource.findOneAndUpdate(
    {
      _id: resource._id,
      owner: req.user._id,
      $and: [
        { requests: { $elemMatch: { _id: request._id, status: 'pending' } } },
        {
          requests: {
            $not: {
              $elemMatch: {
                _id: { $ne: request._id },
                status: { $in: ['approved', 'in_possession', 'return_pending'] },
                start_date: { $lte: request.end_date },
                end_date: { $gte: request.start_date }
              }
            }
          }
        }
      ]
    },
    {
      $set: {
        'requests.$[target].status': 'approved',
        'requests.$[target].pickup_location': req.body.pickup_location || resource.location,
        'requests.$[target].pickup_instructions': req.body.pickup_instructions || '',
        'requests.$[target].agreed_pickup_at': req.body.agreed_pickup_at || request.start_date,
        'requests.$[target].return_location': req.body.return_location || resource.location,
        'requests.$[target].owner_upi_id': req.body.owner_upi_id || request.owner_upi_id,
        'requests.$[target].owner_upi_name': req.body.owner_upi_name || request.owner_upi_name,
        status: 'borrowed'
      }
    },
    {
      new: true,
      runValidators: true,
      arrayFilters: [{ 'target._id': request._id, 'target.status': 'pending' }]
    }
  )
  if (!updated) return res.status(409).json({ success: false, message: 'Another approved request overlaps these dates' })

  const notif = await Notification.create({
    recipient: request.requester,
    type: 'resource',
    title: 'Borrow request approved',
    message: `Your request for "${resource.title}" has been approved.`,
    link: `/resources/${resource._id}`
  })
  notifyUser(request.requester.toString(), 'resource:request_approved', { notification: notif })

  res.json({ success: true, data: updated })
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
  if (request.status === 'return_pending') return res.json({ success: true, data: resource, message: 'Return is already awaiting owner confirmation' })
  if (request.status !== 'in_possession') return res.status(400).json({ success: false, message: 'Handover must be completed before return' })

  request.status = 'return_pending'
  request.borrower_returned_at = new Date()
  await resource.save()

  const notif = await Notification.create({
    recipient: resource.owner,
    type: 'resource',
    title: 'Return awaiting confirmation',
    message: `${req.user.name} marked "${resource.title}" as returned. Confirm after you receive it.`,
    link: `/resources/${resource._id}`
  })
  notifyUser(resource.owner.toString(), 'resource:item_returned', { notification: notif })

  res.json({ success: true, data: resource })
})

router.post('/:id/requests/:requestId/confirm-handover', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })

  const request = resource.requests.id(req.params.requestId)
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' })
  if (![resource.owner.toString(), request.requester.toString()].includes(req.user._id.toString())) {
    return res.status(403).json({ success: false, message: 'Not authorized' })
  }
  if (request.status === 'in_possession') return res.json({ success: true, data: resource, message: 'Handover already confirmed' })
  if (request.status !== 'approved') return res.status(400).json({ success: false, message: 'Request must be approved first' })

  if (resource.owner.toString() === req.user._id.toString()) request.owner_handover_confirmed_at = new Date()
  if (request.requester.toString() === req.user._id.toString()) request.borrower_received_at = new Date()
  if (request.owner_handover_confirmed_at && request.borrower_received_at) request.status = 'in_possession'
  await resource.save()
  res.json({ success: true, data: resource, message: request.status === 'in_possession' ? 'Handover confirmed' : 'Waiting for the other side to confirm handover' })
})

router.post('/:id/requests/:requestId/confirm-return', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })
  if (resource.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only owner can confirm return' })

  const request = resource.requests.id(req.params.requestId)
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' })
  if (request.status !== 'return_pending') return res.status(400).json({ success: false, message: 'Borrower must mark it returned first' })

  request.status = 'returned'
  request.owner_return_confirmed_at = new Date()
  if (resource.is_free) resource.status = 'available'
  await resource.save()
  await addPoints(request.requester, 10)
  recalculateTrustScore(request.requester).catch(err => console.error('[Trust]', err.message))

  const notif = await Notification.create({
    recipient: request.requester,
    type: 'resource',
    title: 'Return confirmed',
    message: `"${resource.title}" return has been confirmed.`,
    link: `/resources/${resource._id}`
  })
  notifyUser(request.requester.toString(), 'resource:return_confirmed', { notification: notif })

  res.json({ success: true, data: resource })
})

// POST /api/v1/resources/:id/requests/:requestId/submit-utr — borrower submits UTR
router.post('/:id/requests/:requestId/submit-utr', protect, async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' })

  const request = resource.requests.id(req.params.requestId)
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' })
  if (request.requester.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only borrower can submit UTR' })
  if (resource.is_free) return res.status(400).json({ success: false, message: 'This resource does not require payment' })
  if (request.status === 'payment_confirmed') return res.json({ success: true, message: 'Payment already confirmed' })
  if (request.status === 'utr_submitted') return res.json({ success: true, message: 'UTR already submitted' })
  if (request.status !== 'returned') return res.status(400).json({ success: false, message: 'Owner must confirm return before payment' })

  const { utr_number } = req.body
  if (!isValidUtr(utr_number)) return res.status(400).json({ success: false, message: 'Enter a valid UTR number' })
  const duplicateUtr = resource.requests.some(r => r._id.toString() !== request._id.toString() && r.utr_number?.toLowerCase() === utr_number.toLowerCase())
  if (duplicateUtr) return res.status(400).json({ success: false, message: 'This UTR has already been submitted for this resource' })

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
  if (resource.is_free) return res.status(400).json({ success: false, message: 'This resource does not require payment' })
  if (request.status === 'payment_confirmed') return res.json({ success: true, data: resource, message: 'Payment already confirmed' })
  if (request.status !== 'utr_submitted') return res.status(400).json({ success: false, message: 'Borrower must submit a UTR first' })

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
