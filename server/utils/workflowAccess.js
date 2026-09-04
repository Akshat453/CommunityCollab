const mongoose = require('mongoose')
const PoolRequest = require('../models/PoolRequest')
const Event = require('../models/Event')
const SkillConnection = require('../models/SkillConnection')
const Resource = require('../models/Resource')
const AssistancePost = require('../models/AssistancePost')

const idOf = (value) => (value?._id || value)?.toString()

const hasActivePoolParticipant = (pool, userId) =>
  pool?.participants?.some(p => idOf(p.user) === userId.toString() && p.status !== 'cancelled')

const isPoolMember = (pool, userId) =>
  idOf(pool?.creator) === userId.toString() ||
  idOf(pool?.designated_orderer) === userId.toString() ||
  hasActivePoolParticipant(pool, userId)

const isResourceParticipant = (resource, userId) =>
  idOf(resource?.owner) === userId.toString() ||
  resource?.requests?.some(r => idOf(r.requester) === userId.toString() && [
    'approved',
    'in_possession',
    'return_pending',
    'returned',
    'utr_submitted',
    'payment_confirmed'
  ].includes(r.status))

const isAssistanceParticipant = (post, userId) =>
  idOf(post?.poster) === userId.toString() ||
  post?.responses?.some(r => idOf(r.responder) === userId.toString() && r.status === 'accepted')

const canAccessRoom = async (room, userId) => {
  if (!room || !userId) return false

  if (room.startsWith('dm:')) {
    const ids = room.replace('dm:', '').split('_')
    return ids.length === 2 && ids.includes(userId.toString()) && ids.every(id => mongoose.Types.ObjectId.isValid(id))
  }

  const [kind, entityId] = room.split(':')
  if (!mongoose.Types.ObjectId.isValid(entityId)) return false

  if (kind === 'pool') {
    const pool = await PoolRequest.findById(entityId).select('creator designated_orderer participants')
    return isPoolMember(pool, userId)
  }
  if (kind === 'event') {
    const event = await Event.findById(entityId).select('organizer participants')
    return idOf(event?.organizer) === userId.toString() ||
      event?.participants?.some(p => idOf(p.user) === userId.toString() && p.status !== 'cancelled')
  }
  if (kind === 'skill') {
    const connection = await SkillConnection.findById(entityId).select('learner teacher status')
    return !!connection && [idOf(connection.learner), idOf(connection.teacher)].includes(userId.toString())
  }
  if (kind === 'resource') {
    const resource = await Resource.findById(entityId).select('owner requests')
    return isResourceParticipant(resource, userId)
  }
  if (kind === 'assistance') {
    const post = await AssistancePost.findById(entityId).select('poster responses')
    return isAssistanceParticipant(post, userId)
  }

  return false
}

const approximateLocation = (location) => {
  if (!location) return location
  return {
    city: location.city || '',
    lat: typeof location.lat === 'number' ? Number(location.lat.toFixed(2)) : undefined,
    lng: typeof location.lng === 'number' ? Number(location.lng.toFixed(2)) : undefined
  }
}

const redactLocation = (location, canViewExact) => {
  if (!location) return location
  if (canViewExact) return location
  return approximateLocation(location)
}

const directionsUrl = (location) => {
  if (!location) return null
  if (typeof location.lat === 'number' && typeof location.lng === 'number') {
    return `https://www.openstreetmap.org/directions?to=${location.lat}%2C${location.lng}`
  }
  if (location.address || location.city) {
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(location.address || location.city)}`
  }
  return null
}

module.exports = {
  idOf,
  isPoolMember,
  hasActivePoolParticipant,
  isResourceParticipant,
  isAssistanceParticipant,
  canAccessRoom,
  approximateLocation,
  redactLocation,
  directionsUrl
}
