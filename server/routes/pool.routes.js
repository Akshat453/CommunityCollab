const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const PoolRequest = require('../models/PoolRequest')
const PoolItem = require('../models/PoolItem')
const Notification = require('../models/Notification')
const User = require('../models/User')
const { addPoints } = require('../utils/badgeEngine')
const { recalculateTrustScore } = require('../utils/trustEngine')
const { notifyUser } = require('../sockets/socket')
const { sendMail, poolJoinEmailToJoiner, poolJoinEmailToOwner } = require('../utils/mailer')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const Razorpay = require('razorpay')

// ─── RAZORPAY INIT ──────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

// ─── ENSURE UPLOADS DIR EXISTS ───────────────────────────
const proofDir = path.join(__dirname, '..', 'uploads', 'pool-proofs')
if (!fs.existsSync(proofDir)) fs.mkdirSync(proofDir, { recursive: true })

// ─── MULTER FOR PROOF SCREENSHOT UPLOAD ──────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, proofDir),
  filename: (req, file, cb) => cb(null, `proof_${Date.now()}${path.extname(file.originalname)}`)
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/
    const ext = allowed.test(path.extname(file.originalname).toLowerCase())
    const mime = allowed.test(file.mimetype)
    if (ext && mime) return cb(null, true)
    cb(new Error('Only image files are allowed for proof'))
  }
})

// ─── UTILITY HELPERS ──────────────────────────────────────
const isParticipant = (pool, userId) =>
  pool.participants.some(p => p.user.toString() === userId.toString() && p.status !== 'cancelled')

const isPoolCreator = (pool, userId) =>
  pool.creator.toString() === userId.toString()

const activeCount = (pool) =>
  pool.participants.filter(p => p.status !== 'cancelled').length

// ─── UTILITY: FETCH PRODUCT METADATA FROM URL ─────────────
const fetchProductMeta = async (url) => {
  try {
    const axios = require('axios')
    const cheerio = require('cheerio')
    const res = await axios.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CommunityCollab/1.0)' }
    })
    const $ = cheerio.load(res.data)
    const name =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="title"]').attr('content') ||
      $('title').text() ||
      ''
    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="image"]').attr('content') ||
      ''
    return { name: name.slice(0, 200), image }
  } catch {
    return { name: '', image: '' }
  }
}

// ════════════════════════════════════════════════
//  POOL CRUD
// ════════════════════════════════════════════════

// GET /api/v1/pools — list all pools
router.get('/', async (req, res) => {
  const { type, status, platform, tags, q, page = 1, limit = 20 } = req.query
  const filter = {}
  if (type && type !== 'all') filter.type = type
  if (status) filter.status = status
  if (platform) filter.platform = platform
  if (tags) filter.tags = { $in: tags.split(',') }
  if (q) filter.$or = [
    { title: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } },
    { destination: { $regex: q, $options: 'i' } },
    { tags: { $regex: q, $options: 'i' } }
  ]

  const total = await PoolRequest.countDocuments(filter)
  const pools = await PoolRequest.find(filter)
    .populate('creator', 'name avatar_url verified trust_score trust_level')
    .populate('designated_orderer', 'name avatar_url')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))

  // Attach item counts
  const poolIds = pools.map(p => p._id)
  const itemCounts = await PoolItem.aggregate([
    { $match: { pool: { $in: poolIds } } },
    { $group: { _id: '$pool', count: { $sum: 1 } } }
  ])
  const countMap = {}
  itemCounts.forEach(c => { countMap[c._id.toString()] = c.count })

  const enriched = pools.map(p => {
    const obj = p.toObject()
    obj.item_count = countMap[p._id.toString()] || 0
    obj.active_participants = p.participants.filter(pt => pt.status !== 'cancelled').length
    return obj
  })

  res.json({ success: true, data: enriched, total, page: Number(page), pages: Math.ceil(total / limit) })
})

// POST /api/v1/pools/fetch-meta — fetch product name/image from URL
router.post('/fetch-meta', protect, async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ success: false, message: 'URL is required' })
  try { new URL(url) } catch { return res.status(400).json({ success: false, message: 'Invalid URL' }) }
  const meta = await fetchProductMeta(url)
  res.json({ success: true, data: meta })
})

// GET /api/v1/pools/:id — pool detail with items
router.get('/:id', async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
    .populate('creator', 'name avatar_url verified community_points trust_score trust_level')
    .populate('designated_orderer', 'name avatar_url')
    .populate('participants.user', 'name avatar_url verified trust_score trust_level')
    .populate('order_proof.verified_by', 'name avatar_url')

  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  // Dispute check: participants with utr_submitted >48h ago get flagged
  try {
    const now = new Date()
    let needsSave = false
    for (const participant of pool.participants) {
      if (
        participant.payment_status === 'utr_submitted' &&
        participant.utr_submitted_at &&
        (now - new Date(participant.utr_submitted_at)) > 48 * 60 * 60 * 1000
      ) {
        participant.payment_status = 'disputed'
        needsSave = true
        recalculateTrustScore(participant.user._id || participant.user).catch(err => console.error('[Trust]', err.message))
      }
    }
    if (needsSave) await pool.save()
  } catch (err) {
    console.error('[Pool GET dispute check]', err.message)
  }

  const items = await PoolItem.find({ pool: pool._id })
    .populate('added_by', 'name avatar_url verified')
    .sort({ createdAt: 1 })

  // Group items by user
  const itemsByUser = {}
  items.forEach(item => {
    const uid = item.added_by._id.toString()
    if (!itemsByUser[uid]) {
      itemsByUser[uid] = { user: item.added_by, items: [], total_estimated: 0 }
    }
    itemsByUser[uid].items.push(item)
    if (item.estimated_price) {
      itemsByUser[uid].total_estimated += item.estimated_price * item.quantity
    }
  })

  const poolObj = pool.toObject()
  poolObj.active_participants = activeCount(pool)

  res.json({
    success: true,
    data: {
      pool: poolObj,
      items,
      items_by_user: Object.values(itemsByUser),
      total_items: items.length,
      total_estimated_cost: items.reduce((sum, i) => sum + (i.estimated_price || 0) * i.quantity, 0),
      total_participants: activeCount(pool)
    }
  })
})

// POST /api/v1/pools — create pool
router.post('/', protect, async (req, res) => {
  const {
    title, description, platform, platform_custom_name, platform_base_url,
    type, destination, scheduled_at, max_participants, is_public, tags, location,
    carpool_details
  } = req.body

  const poolData = {
    creator: req.user._id,
    designated_orderer: req.user._id,
    title,
    description,
    platform: platform || 'custom',
    platform_custom_name,
    platform_base_url,
    type: type || 'group_buy',
    destination,
    scheduled_at,
    max_participants: max_participants || 10,
    is_public: is_public !== false,
    tags: tags || [],
    location,
    participants: [{
      user: req.user._id,
      joined_at: new Date(),
      status: 'confirmed',
      seats_requested: 1
    }]
  }

  // Attach carpool details if this is a carpool pool
  if (type === 'carpool' && carpool_details) {
    poolData.carpool_details = {
      origin: carpool_details.origin,
      destination_place: carpool_details.destination_place,
      fare_per_seat: carpool_details.fare_per_seat,
      total_seats: carpool_details.total_seats,
      departure_time: carpool_details.departure_time,
      // Geo coords for map/route matching — sent as { lat, lng }
      origin_coords: carpool_details.origin_coords || null,
      destination_coords: carpool_details.destination_coords || null
    }
    // For carpools, max_participants follows total_seats if provided
    if (carpool_details.total_seats && !max_participants) {
      poolData.max_participants = carpool_details.total_seats
    }
  }

  const pool = await PoolRequest.create(poolData)

  await addPoints(req.user._id, 15)
  res.status(201).json({ success: true, data: pool, message: 'Pool created successfully' })
})

// POST /api/v1/pools/:id/join
router.post('/:id/join', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
    .populate('creator', 'name email')

  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })
  if (pool.status !== 'open') return res.status(400).json({ success: false, message: 'This pool is no longer accepting participants' })

  const alreadyJoined = isParticipant(pool, req.user._id)
  if (alreadyJoined) return res.status(400).json({ success: false, message: 'You have already joined this pool' })

  const count = activeCount(pool)
  if (count >= pool.max_participants) {
    return res.status(400).json({ success: false, message: 'Pool is full' })
  }

  const { seats_requested } = req.body
  const seats = Number(seats_requested) || 1

  // For carpools, check if enough seats remain
  if (pool.type === 'carpool' && pool.carpool_details?.total_seats) {
    const seatsUsed = pool.participants
      .filter(p => p.status !== 'cancelled')
      .reduce((sum, p) => sum + (p.seats_requested || 1), 0)
    if (seatsUsed + seats > pool.carpool_details.total_seats) {
      return res.status(400).json({ success: false, message: `Only ${pool.carpool_details.total_seats - seatsUsed} seat(s) remaining` })
    }
  }

  pool.participants.push({
    user: req.user._id,
    joined_at: new Date(),
    status: 'confirmed',
    seats_requested: seats
  })
  await pool.save()

  await addPoints(req.user._id, 10)

  // Notify creator via socket
  notifyUser(pool.creator._id.toString(), 'pool:participant_joined', {
    poolId: pool._id,
    poolTitle: pool.title,
    joinerName: req.user.name,
    totalParticipants: activeCount(pool)
  })

  // Emails (non-blocking)
  try {
    if (req.user.email) {
      await sendMail({
        to: req.user.email,
        ...poolJoinEmailToJoiner({
          joinerName: req.user.name,
          poolTitle: pool.title,
          ownerName: pool.creator.name,
          platform: pool.platform
        })
      })
    }
    if (pool.creator.email) {
      await sendMail({
        to: pool.creator.email,
        ...poolJoinEmailToOwner({
          ownerName: pool.creator.name,
          joinerName: req.user.name,
          poolTitle: pool.title,
          currentParticipants: activeCount(pool),
          maxParticipants: pool.max_participants
        })
      })
    }
  } catch (err) {
    console.error('[Pool Join Email] Failed:', err.message)
  }

  const populated = await PoolRequest.findById(pool._id)
    .populate('creator', 'name avatar_url')
    .populate('participants.user', 'name avatar_url')

  res.json({ success: true, data: populated, message: 'Successfully joined the pool' })
})

// POST /api/v1/pools/:id/leave
router.post('/:id/leave', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })
  if (isPoolCreator(pool, req.user._id)) {
    return res.status(400).json({ success: false, message: 'Pool creator cannot leave. Cancel the pool instead.' })
  }

  const participant = pool.participants.find(p => p.user.toString() === req.user._id.toString())
  if (!participant || participant.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'You are not in this pool' })
  }

  participant.status = 'cancelled'
  await PoolItem.deleteMany({ pool: pool._id, added_by: req.user._id })
  await pool.save()

  // Notify creator
  await Notification.create({
    recipient: pool.creator,
    type: 'pool',
    title: 'Participant left your pool',
    message: `${req.user.name} has left "${pool.title}".`,
    link: `/pools/${pool._id}`
  })
  notifyUser(pool.creator.toString(), 'pool:participant_left', {
    poolId: pool._id,
    poolTitle: pool.title,
    userName: req.user.name
  })

  res.json({ success: true, message: 'Left the pool and your items have been removed' })
})

// PATCH /api/v1/pools/:id — update pool (creator only)
router.patch('/:id', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })
  if (!isPoolCreator(pool, req.user._id)) return res.status(403).json({ success: false, message: 'Only the pool creator can edit this pool' })

  const allowed = ['title', 'description', 'destination', 'scheduled_at', 'max_participants', 'is_public', 'tags', 'status', 'designated_orderer', 'platform_custom_name']
  allowed.forEach(field => {
    if (req.body[field] !== undefined) pool[field] = req.body[field]
  })
  await pool.save()
  res.json({ success: true, data: pool, message: 'Pool updated' })
})

// DELETE /api/v1/pools/:id — cancel pool (creator only)
router.delete('/:id', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
    .populate('participants.user', 'name')

  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })
  if (!isPoolCreator(pool, req.user._id)) return res.status(403).json({ success: false, message: 'Only the creator can cancel this pool' })

  pool.status = 'cancelled'
  await pool.save()

  const activeParticipants = pool.participants.filter(p => p.status !== 'cancelled' && p.user.toString() !== req.user._id.toString())

  if (activeParticipants.length > 0) {
    await Notification.insertMany(activeParticipants.map(p => ({
      recipient: p.user._id || p.user,
      type: 'pool',
      title: 'Pool was cancelled',
      message: `"${pool.title}" has been cancelled by the creator.`,
      link: '/pools'
    })))
    activeParticipants.forEach(p => {
      notifyUser((p.user._id || p.user).toString(), 'pool:cancelled', { poolId: pool._id, poolTitle: pool.title })
    })
  }

  res.json({ success: true, message: 'Pool cancelled' })
})

// PATCH /api/v1/pools/:id/designate-orderer
router.patch('/:id/designate-orderer', protect, async (req, res) => {
  const { orderer_id } = req.body
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })
  if (!isPoolCreator(pool, req.user._id)) return res.status(403).json({ success: false, message: 'Only creator can designate orderer' })

  const inPool = isParticipant(pool, orderer_id)
  if (!inPool) return res.status(400).json({ success: false, message: 'Designated orderer must be a pool participant' })

  pool.designated_orderer = orderer_id
  await pool.save()

  notifyUser(orderer_id, 'pool:designated_orderer', { poolId: pool._id, poolTitle: pool.title })
  res.json({ success: true, message: 'Orderer designated successfully', data: pool })
})

// ════════════════════════════════════════════════
//  POOL ITEMS
// ════════════════════════════════════════════════

// GET /api/v1/pools/:id/items
router.get('/:id/items', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  const items = await PoolItem.find({ pool: req.params.id })
    .populate('added_by', 'name avatar_url verified')
    .sort({ createdAt: 1 })

  const grouped = {}
  items.forEach(item => {
    const uid = item.added_by._id.toString()
    if (!grouped[uid]) grouped[uid] = { user: item.added_by, items: [], subtotal: 0 }
    grouped[uid].items.push(item)
    if (item.estimated_price) grouped[uid].subtotal += item.estimated_price * item.quantity
  })

  res.json({
    success: true,
    data: {
      items,
      grouped_by_user: Object.values(grouped),
      total_items: items.length,
      total_estimated_cost: items.reduce((sum, i) => sum + (i.estimated_price || 0) * i.quantity, 0)
    }
  })
})

// POST /api/v1/pools/:id/items — add item
router.post('/:id/items', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  if (!['open', 'ordering'].includes(pool.status)) {
    return res.status(400).json({ success: false, message: 'Items cannot be added to this pool' })
  }

  const inPool = isParticipant(pool, req.user._id) || isPoolCreator(pool, req.user._id)
  if (!inPool) return res.status(403).json({ success: false, message: 'You must join the pool before adding items' })

  const { product_link, product_name, quantity, unit, estimated_price, notes } = req.body

  if (!product_link) return res.status(400).json({ success: false, message: 'Product link is required' })
  if (!quantity || quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1' })

  try { new URL(product_link) } catch {
    return res.status(400).json({ success: false, message: 'Invalid product URL' })
  }

  let resolvedName = product_name
  let resolvedImage = ''
  if (!product_name) {
    const meta = await fetchProductMeta(product_link)
    resolvedName = meta.name || product_link
    resolvedImage = meta.image || ''
  }

  const item = await PoolItem.create({
    pool: pool._id,
    added_by: req.user._id,
    product_link,
    product_name: resolvedName,
    product_image: resolvedImage,
    quantity,
    unit: unit || 'piece',
    estimated_price: estimated_price || null,
    notes: notes || ''
  })

  const populated = await PoolItem.findById(item._id).populate('added_by', 'name avatar_url')

  if (!isPoolCreator(pool, req.user._id)) {
    notifyUser(pool.creator.toString(), 'pool:item_added', {
      poolId: pool._id,
      poolTitle: pool.title,
      itemName: resolvedName,
      addedBy: req.user.name
    })
  }

  res.status(201).json({ success: true, data: populated, message: 'Item added to pool' })
})

// PATCH /api/v1/pools/:id/items/:itemId — edit own item
router.patch('/:id/items/:itemId', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  if (!['open', 'ordering'].includes(pool.status)) {
    return res.status(400).json({ success: false, message: 'Pool is closed — items cannot be edited' })
  }

  const item = await PoolItem.findById(req.params.itemId)
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' })
  if (item.added_by.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only edit your own items' })
  }

  const allowed = ['product_link', 'product_name', 'quantity', 'unit', 'estimated_price', 'notes']
  allowed.forEach(field => { if (req.body[field] !== undefined) item[field] = req.body[field] })

  await item.save()
  const populated = await PoolItem.findById(item._id).populate('added_by', 'name avatar_url')
  res.json({ success: true, data: populated, message: 'Item updated' })
})

// DELETE /api/v1/pools/:id/items/:itemId
router.delete('/:id/items/:itemId', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  if (!['open', 'ordering'].includes(pool.status)) {
    return res.status(400).json({ success: false, message: 'Pool is closed' })
  }

  const item = await PoolItem.findById(req.params.itemId)
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' })

  const canDelete = item.added_by.toString() === req.user._id.toString() || isPoolCreator(pool, req.user._id)
  if (!canDelete) return res.status(403).json({ success: false, message: 'Permission denied' })

  await item.deleteOne()
  res.json({ success: true, message: 'Item removed from pool' })
})

// ════════════════════════════════════════════════
//  ORDER PLACEMENT & PROOF
// ════════════════════════════════════════════════

// PATCH /api/v1/pools/:id/lock — creator locks pool (open → ordering)
router.patch('/:id/lock', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })
  if (!isPoolCreator(pool, req.user._id)) return res.status(403).json({ success: false, message: 'Only creator can lock the pool' })
  if (pool.status !== 'open') return res.status(400).json({ success: false, message: 'Pool must be open to lock' })

  pool.status = 'ordering'
  await pool.save()

  pool.participants.filter(p => p.status !== 'cancelled').forEach(p => {
    notifyUser(p.user.toString(), 'pool:locked', {
      poolId: pool._id,
      poolTitle: pool.title,
      message: 'Pool is locked. The orderer is placing the combined order now.'
    })
  })

  res.json({ success: true, data: pool, message: 'Pool locked for ordering.' })
})

// POST /api/v1/pools/:id/submit-proof — orderer submits order proof (ordering → ordered)
router.post('/:id/submit-proof', protect, upload.single('screenshot'), async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
    .populate('participants.user', 'name email')

  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  const isOrderer = pool.designated_orderer?.toString() === req.user._id.toString() || isPoolCreator(pool, req.user._id)
  if (!isOrderer) return res.status(403).json({ success: false, message: 'Only the designated orderer can submit proof' })

  if (pool.status !== 'ordering') {
    return res.status(400).json({ success: false, message: 'Pool must be in ordering status' })
  }

  const { order_url, order_id_external, note, orderer_upi_id, orderer_upi_name } = req.body
  const screenshot_url = req.file ? `/uploads/pool-proofs/${req.file.filename}` : null

  if (!screenshot_url && !order_url && !order_id_external) {
    return res.status(400).json({ success: false, message: 'Provide at least one form of proof' })
  }

  pool.order_proof = {
    screenshot_url,
    order_url: order_url || null,
    order_id_external: order_id_external || null,
    note: note || null,
    submitted_at: new Date(),
    verified_by: [],
    orderer_upi_id: orderer_upi_id || null,
    orderer_upi_name: orderer_upi_name || null
  }
  pool.status = 'ordered'

  await PoolItem.updateMany({ pool: pool._id, status: 'pending' }, { status: 'ordered' })
  await pool.save()

  pool.participants.filter(p => p.status !== 'cancelled').forEach(async (p) => {
    if (p.user._id.toString() !== req.user._id.toString()) {
      notifyUser(p.user._id.toString(), 'pool:order_placed', {
        poolId: pool._id,
        poolTitle: pool.title,
        ordererName: req.user.name
      })

      try {
        await sendMail({
          to: p.user.email,
          subject: `📦 Your pool order has been placed: ${pool.title}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#FFE3BB;border-radius:12px">
              <h2 style="color:#03A6A1">Order Placed!</h2>
              <p><strong>${req.user.name}</strong> has placed the combined order for <strong>${pool.title}</strong>.</p>
              ${order_id_external ? `<p><strong>Order ID:</strong> ${order_id_external}</p>` : ''}
              ${order_url ? `<p><strong>Track:</strong> <a href="${order_url}" style="color:#FF4F0F">${order_url}</a></p>` : ''}
              ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
              <p>Log in to CommunityCollab to confirm your delivery.</p>
              <p style="color:#888;font-size:12px">CommunityCollab — Collaborate. Share. Thrive.</p>
            </div>
          `
        })
      } catch (err) {
        console.error('[Mail] Order proof email failed:', err.message)
      }
    }
  })

  res.json({ success: true, data: pool, message: 'Order proof submitted. Participants notified.' })
})

// PATCH /api/v1/pools/:id/items/:itemId/status — orderer updates item status
router.patch('/:id/items/:itemId/status', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  const isOrderer = pool.designated_orderer?.toString() === req.user._id.toString() || isPoolCreator(pool, req.user._id)
  if (!isOrderer) return res.status(403).json({ success: false, message: 'Only the orderer can update item status' })

  const { status, orderer_note, substitution_link, substitution_name } = req.body
  const item = await PoolItem.findById(req.params.itemId)
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' })

  item.status = status
  if (orderer_note) item.orderer_note = orderer_note
  if (substitution_link) item.substitution_link = substitution_link
  if (substitution_name) item.substitution_name = substitution_name

  await item.save()

  notifyUser(item.added_by.toString(), 'pool:item_status_updated', {
    poolId: pool._id,
    itemName: item.product_name,
    status,
    orderer_note
  })

  res.json({ success: true, data: item, message: 'Item status updated' })
})

// POST /api/v1/pools/:id/confirm-delivery
router.post('/:id/confirm-delivery', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })
  if (pool.status !== 'ordered') return res.status(400).json({ success: false, message: 'Order has not been placed yet' })

  const participant = pool.participants.find(p => p.user.toString() === req.user._id.toString() && p.status !== 'cancelled')
  if (!participant) return res.status(403).json({ success: false, message: 'You are not a participant' })

  participant.delivery_confirmed = true
  participant.delivery_confirmed_at = new Date()

  if (pool.order_proof && !pool.order_proof.verified_by.map(v => v.toString()).includes(req.user._id.toString())) {
    pool.order_proof.verified_by.push(req.user._id)
  }

  const active = pool.participants.filter(p => p.status !== 'cancelled')
  const allConfirmed = active.every(p => p.delivery_confirmed)
  if (allConfirmed) {
    pool.status = 'completed'
    await addPoints(pool.creator.toString(), 30)
  }

  await pool.save()
  await addPoints(req.user._id, 10)

  notifyUser(pool.designated_orderer?.toString() || pool.creator.toString(), 'pool:delivery_confirmed', {
    poolId: pool._id,
    confirmedBy: req.user.name,
    allConfirmed
  })

  res.json({
    success: true,
    message: allConfirmed ? 'All confirmed! Pool completed.' : 'Delivery confirmed.',
    data: {
      all_confirmed: allConfirmed,
      confirmed_count: active.filter(p => p.delivery_confirmed).length,
      total: active.length
    }
  })
})

// POST /api/v1/pools/:id/submit-utr — participant submits UTR after delivery confirmed
router.post('/:id/submit-utr', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  const participant = pool.participants.find(p => p.user.toString() === req.user._id.toString() && p.status !== 'cancelled')
  if (!participant) return res.status(403).json({ success: false, message: 'You are not a participant' })
  if (!participant.delivery_confirmed) return res.status(400).json({ success: false, message: 'Confirm delivery before submitting payment' })

  const { utr_number } = req.body
  if (!utr_number) return res.status(400).json({ success: false, message: 'UTR number is required' })

  participant.utr_number = utr_number
  participant.utr_submitted_at = new Date()
  participant.payment_status = 'utr_submitted'
  await pool.save()

  const ordererId = (pool.designated_orderer || pool.creator).toString()
  const notif = await Notification.create({
    recipient: ordererId,
    type: 'pool',
    title: 'UTR submitted for payment',
    message: `${req.user.name} submitted UTR ${utr_number} for "${pool.title}". Please confirm receipt.`,
    link: `/pools/${pool._id}`
  })
  notifyUser(ordererId, 'pool:utr_submitted', { notification: notif, poolId: pool._id, poolTitle: pool.title, participantName: req.user.name, utrNumber: utr_number })

  res.json({ success: true, message: 'UTR submitted successfully' })
})

// PATCH /api/v1/pools/:id/confirm-payment/:participantUserId — orderer confirms payment received
router.patch('/:id/confirm-payment/:participantUserId', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  const isOrderer = (pool.designated_orderer?.toString() === req.user._id.toString()) || isPoolCreator(pool, req.user._id)
  if (!isOrderer) return res.status(403).json({ success: false, message: 'Only the orderer can confirm payment' })

  const participant = pool.participants.find(p => p.user.toString() === req.params.participantUserId && p.status !== 'cancelled')
  if (!participant) return res.status(404).json({ success: false, message: 'Participant not found' })

  participant.payment_confirmed_by_orderer = true
  participant.payment_confirmed_at = new Date()
  participant.payment_status = 'paid'
  await pool.save()

  const notif = await Notification.create({
    recipient: req.params.participantUserId,
    type: 'pool',
    title: 'Payment confirmed',
    message: `Your payment for "${pool.title}" has been confirmed by the orderer.`,
    link: `/pools/${pool._id}`
  })
  notifyUser(req.params.participantUserId, 'pool:payment_confirmed', { notification: notif, poolId: pool._id, poolTitle: pool.title })

  recalculateTrustScore(req.params.participantUserId).catch(err => console.error('[Trust]', err.message))

  res.json({ success: true, message: 'Payment confirmed' })
})

// GET /api/v1/pools/:id/order-summary
router.get('/:id/order-summary', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
    .populate('creator', 'name avatar_url')
    .populate('designated_orderer', 'name avatar_url')

  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  const items = await PoolItem.find({ pool: pool._id })
    .populate('added_by', 'name avatar_url')
    .sort({ createdAt: 1 })

  const summary = {
    pool_title: pool.title,
    platform: pool.platform === 'custom' ? pool.platform_custom_name : pool.platform,
    destination: pool.destination,
    total_participants: activeCount(pool),
    total_items: items.length,
    total_estimated_cost: items.reduce((sum, i) => sum + (i.estimated_price || 0) * i.quantity, 0),
    items_by_user: {},
    all_items_flat: items.map(i => ({
      id: i._id,
      product_name: i.product_name,
      product_link: i.product_link,
      product_image: i.product_image,
      quantity: i.quantity,
      unit: i.unit,
      estimated_price: i.estimated_price,
      notes: i.notes,
      status: i.status,
      orderer_note: i.orderer_note,
      added_by: i.added_by
    }))
  }

  items.forEach(item => {
    const uid = item.added_by._id.toString()
    if (!summary.items_by_user[uid]) {
      summary.items_by_user[uid] = { user: item.added_by, items: [], subtotal: 0 }
    }
    summary.items_by_user[uid].items.push(item)
    if (item.estimated_price) summary.items_by_user[uid].subtotal += item.estimated_price * item.quantity
  })

  res.json({ success: true, data: summary })
})

// ════════════════════════════════════════════════
//  RAZORPAY PAYMENT
// ════════════════════════════════════════════════

// POST /api/v1/pools/:id/razorpay/create-order
// Creates a Razorpay order for a participant's share.
// Amount = their item total (group_buy) or fare × seats (carpool)
router.post('/:id/razorpay/create-order', protect, async (req, res) => {
  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  const participant = pool.participants.find(
    p => p.user.toString() === req.user._id.toString() && p.status !== 'cancelled'
  )
  if (!participant) return res.status(403).json({ success: false, message: 'You are not a participant' })

  if (participant.payment_status === 'paid') {
    return res.status(400).json({ success: false, message: 'Payment already completed' })
  }

  // Calculate amount
  let amountPaise = 0

  if (pool.type === 'carpool' && pool.carpool_details?.fare_per_seat) {
    const seats = participant.seats_requested || 1
    amountPaise = Math.round(pool.carpool_details.fare_per_seat * seats * 100)
  } else {
    // For group buy: sum up this participant's items
    const items = await PoolItem.find({ pool: pool._id, added_by: req.user._id })
    const total = items.reduce((sum, item) => sum + (item.estimated_price || 0) * item.quantity, 0)
    amountPaise = Math.round(total * 100)
  }

  // Allow custom amount override (e.g. if orderer set final amounts)
  if (req.body.amount_paise) {
    amountPaise = Number(req.body.amount_paise)
  }

  if (amountPaise < 100) {
    return res.status(400).json({ success: false, message: 'Amount too low to process (minimum ₹1)' })
  }

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `pool_${pool._id}_user_${req.user._id}_${Date.now()}`,
    notes: {
      pool_id: pool._id.toString(),
      pool_title: pool.title,
      user_id: req.user._id.toString(),
      user_name: req.user.name
    }
  })

  // Store the razorpay order id on the participant record
  participant.razorpay_order_id = order.id
  await pool.save()

  res.json({
    success: true,
    data: {
      razorpay_order_id: order.id,
      amount: amountPaise,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID,
      pool_title: pool.title,
      user_name: req.user.name,
      user_email: req.user.email || '',
      seats: participant.seats_requested || 1
    }
  })
})

// POST /api/v1/pools/:id/razorpay/verify-payment
// Verifies Razorpay payment signature and marks participant as paid
router.post('/:id/razorpay/verify-payment', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment verification fields' })
  }

  // Verify signature: HMAC SHA256 of "order_id|payment_id" with key_secret
  const body = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature' })
  }

  const pool = await PoolRequest.findById(req.params.id)
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' })

  const participant = pool.participants.find(
    p => p.user.toString() === req.user._id.toString() && p.status !== 'cancelled'
  )
  if (!participant) return res.status(403).json({ success: false, message: 'Participant not found' })

  participant.payment_status = 'paid'
  participant.razorpay_payment_id = razorpay_payment_id
  participant.payment_confirmed_by_orderer = true
  participant.payment_confirmed_at = new Date()
  await pool.save()

  // Notify the orderer
  const ordererId = (pool.designated_orderer || pool.creator).toString()
  const notif = await Notification.create({
    recipient: ordererId,
    type: 'pool',
    title: 'Razorpay payment received',
    message: `${req.user.name} paid their share for "${pool.title}" via Razorpay.`,
    link: `/pools/${pool._id}`
  })
  notifyUser(ordererId, 'pool:payment_confirmed', { notification: notif, poolId: pool._id, poolTitle: pool.title })

  await recalculateTrustScore(req.user._id).catch(err => console.error('[Trust]', err.message))

  res.json({ success: true, message: 'Payment verified and confirmed' })
})

module.exports = router
