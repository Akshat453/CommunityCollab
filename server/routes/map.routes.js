const express = require('express')
const router = express.Router()
const Event = require('../models/Event')
const PoolRequest = require('../models/PoolRequest')
const SkillListing = require('../models/SkillListing')

router.get('/pins', async (req, res) => {
  const { types = 'events,pools,skills' } = req.query
  const typeList = types.split(',')
  const results = []

  if (typeList.includes('events')) {
    const events = await Event.find({ status: 'published' }).select('title location starts_at category').limit(50)
    events.forEach(e => results.push({ type: 'event', id: e._id, title: e.title, lat: e.location?.lat, lng: e.location?.lng, category: e.category }))
  }
  if (typeList.includes('pools')) {
    const pools = await PoolRequest.find({ status: 'open' }).select('title location type').limit(50)
    pools.forEach(p => results.push({ type: 'pool', id: p._id, title: p.title, lat: p.location?.lat, lng: p.location?.lng }))
  }
  if (typeList.includes('skills')) {
    const skills = await SkillListing.find({ status: 'active' }).select('skill_name location listing_type').limit(50)
    skills.forEach(s => results.push({ type: 'skill', id: s._id, title: s.skill_name, lat: s.location?.lat, lng: s.location?.lng }))
  }

  res.json({ success: true, data: results.filter(r => r.lat && r.lng) })
})

module.exports = router
