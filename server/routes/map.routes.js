const express = require('express')
const router = express.Router()
const Event = require('../models/Event')
const PoolRequest = require('../models/PoolRequest')
const SkillListing = require('../models/SkillListing')
const Resource = require('../models/Resource')
const AssistancePost = require('../models/AssistancePost')
const { approximateLocation } = require('../utils/workflowAccess')

// Haversine distance in km
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// GET /api/v1/map/pins
// Query params: types (csv), lat, lng, radius_km (default 10)
router.get('/pins', async (req, res) => {
  const { types = 'events,pools,skills,resources,assistance', lat, lng, radius_km = 10 } = req.query
  const typeList = types.split(',')
  const results = []
  const userLat = parseFloat(lat)
  const userLng = parseFloat(lng)
  const radius = parseFloat(radius_km)
  const hasGeo = !isNaN(userLat) && !isNaN(userLng)

  const withinRadius = (itemLat, itemLng) => {
    if (!hasGeo || isNaN(itemLat) || isNaN(itemLng)) return !hasGeo // if no user location, show all
    return haversineKm(userLat, userLng, itemLat, itemLng) <= radius
  }

  if (typeList.includes('events')) {
    const events = await Event.find({ status: 'published' })
      .select('title location starts_at category registered_count max_volunteers')
      .limit(200)
    events.forEach(e => {
      if (!e.location?.lat || !e.location?.lng) return
      if (!withinRadius(e.location.lat, e.location.lng)) return
      const loc = approximateLocation(e.location)
      results.push({
        type: 'event', id: e._id, title: e.title,
        lat: loc.lat, lng: loc.lng,
        meta: { category: e.category, starts_at: e.starts_at, registered_count: e.registered_count, max_volunteers: e.max_volunteers }
      })
    })
  }

  if (typeList.includes('pools')) {
    const pools = await PoolRequest.find({ status: 'open', type: { $ne: 'carpool' } })
      .select('title location type platform platform_custom_name')
      .limit(200)
    pools.forEach(p => {
      if (!p.location?.lat || !p.location?.lng) return
      if (!withinRadius(p.location.lat, p.location.lng)) return
      const loc = approximateLocation(p.location)
      results.push({
        type: 'pool', id: p._id, title: p.title,
        lat: loc.lat, lng: loc.lng,
        meta: { pool_type: p.type, platform: p.platform, platform_custom_name: p.platform_custom_name }
      })
    })
  }

  if (typeList.includes('skills')) {
    const skills = await SkillListing.find({ status: 'active', mode: { $in: ['in_person', 'both'] } })
      .select('skill_name location listing_type skill_category')
      .limit(200)
    skills.forEach(s => {
      if (!s.location?.lat || !s.location?.lng) return
      if (!withinRadius(s.location.lat, s.location.lng)) return
      const loc = approximateLocation(s.location)
      results.push({
        type: 'skill', id: s._id, title: s.skill_name,
        lat: loc.lat, lng: loc.lng,
        meta: { listing_type: s.listing_type, category: s.skill_category }
      })
    })
  }

  if (typeList.includes('resources')) {
    const resources = await Resource.find({ status: 'available' })
      .select('title location type is_free price_per_day')
      .limit(200)
    resources.forEach(r => {
      if (!r.location?.lat || !r.location?.lng) return
      if (!withinRadius(r.location.lat, r.location.lng)) return
      const loc = approximateLocation(r.location)
      results.push({
        type: 'resource', id: r._id, title: r.title,
        lat: loc.lat, lng: loc.lng,
        meta: { resource_type: r.type, is_free: r.is_free, price_per_day: r.price_per_day }
      })
    })
  }

  if (typeList.includes('assistance')) {
    const posts = await AssistancePost.find({ status: 'open' })
      .select('title location category post_type urgency')
      .limit(200)
    posts.forEach(p => {
      if (!p.location?.lat || !p.location?.lng) return
      if (!withinRadius(p.location.lat, p.location.lng)) return
      const loc = approximateLocation(p.location)
      results.push({
        type: 'assistance', id: p._id, title: p.title,
        lat: loc.lat, lng: loc.lng,
        meta: { category: p.category, post_type: p.post_type, urgency: p.urgency }
      })
    })
  }

  res.json({ success: true, data: results, total: results.length })
})

// GET /api/v1/map/carpools
// Find carpools whose destination is near the rider's desired destination
// Query params: dest_lat, dest_lng, origin_lat?, origin_lng?, dest_radius_km (default 5), origin_radius_km (default 15)
router.get('/carpools', async (req, res) => {
  const {
    dest_lat, dest_lng,
    origin_lat, origin_lng,
    dest_radius_km = 5,
    origin_radius_km = 15
  } = req.query

  const dLat = parseFloat(dest_lat)
  const dLng = parseFloat(dest_lng)

  if (isNaN(dLat) || isNaN(dLng)) {
    return res.status(400).json({ success: false, message: 'dest_lat and dest_lng are required' })
  }

  const oLat = parseFloat(origin_lat)
  const oLng = parseFloat(origin_lng)
  const hasOrigin = !isNaN(oLat) && !isNaN(oLng)

  const carpools = await PoolRequest.find({ type: 'carpool', status: 'open' })
    .populate('creator', 'name avatar_url trust_score trust_level')
    .select('title carpool_details participants max_participants creator')
    .limit(500)

  const matched = []
  for (const c of carpools) {
    const cd = c.carpool_details
    if (!cd?.destination_coords?.lat || !cd?.destination_coords?.lng) continue
    if (!cd?.origin_coords?.lat || !cd?.origin_coords?.lng) continue

    // Check destination proximity
    const destDist = haversineKm(dLat, dLng, cd.destination_coords.lat, cd.destination_coords.lng)
    if (destDist > parseFloat(dest_radius_km)) continue

    // Optionally check origin proximity (are they coming from near you?)
    if (hasOrigin) {
      const originDist = haversineKm(oLat, oLng, cd.origin_coords.lat, cd.origin_coords.lng)
      if (originDist > parseFloat(origin_radius_km)) continue
    }

    // Check seats available
    const seatsUsed = c.participants
      .filter(p => p.status !== 'cancelled')
      .reduce((sum, p) => sum + (p.seats_requested || 1), 0)
    const seatsLeft = (cd.total_seats || c.max_participants) - seatsUsed
    if (seatsLeft <= 0) continue

    matched.push({
      id: c._id,
      title: c.title,
      origin: cd.origin,
      destination: cd.destination_place,
      origin_coords: approximateLocation(cd.origin_coords),
      destination_coords: approximateLocation(cd.destination_coords),
      fare_per_seat: cd.fare_per_seat,
      total_seats: cd.total_seats,
      seats_left: seatsLeft,
      departure_time: cd.departure_time,
      creator: c.creator,
      dest_distance_km: Math.round(destDist * 10) / 10
    })
  }

  // Sort by closest destination match
  matched.sort((a, b) => a.dest_distance_km - b.dest_distance_km)

  res.json({ success: true, data: matched, total: matched.length })
})

module.exports = router
