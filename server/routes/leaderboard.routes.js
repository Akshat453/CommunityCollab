const express = require('express')
const router = express.Router()
const User = require('../models/User')

router.get('/', async (req, res) => {
  const { period, limit = 20 } = req.query
  let dateFilter = {}
  if (period === 'month') dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
  else if (period === 'week') dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
  const leaders = await User.find(dateFilter).select('name avatar_url community_points badges location verified trust_score trust_level').sort({ community_points: -1 }).limit(Number(limit))
  res.json({ success: true, data: leaders })
})

module.exports = router
