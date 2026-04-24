const User = require('../models/User')

const recalculateTrustScore = async (userId) => {
  const user = await User.findById(userId)
  if (!user) return

  const PoolRequest = require('../models/PoolRequest')
  const SkillConnection = require('../models/SkillConnection')
  const Resource = require('../models/Resource')

  const [completedPools, completedSkills, completedResources, poolsWithDisputes] = await Promise.all([
    PoolRequest.find({
      'participants.user': userId,
      'participants.payment_status': 'paid'
    }),
    SkillConnection.find({
      $or: [{ learner: userId }, { teacher: userId }],
      status: 'completed'
    }),
    Resource.find({
      'requests.requester': userId,
      'requests.status': 'payment_confirmed'
    }),
    PoolRequest.find({
      'participants.user': userId,
      'participants.payment_status': 'disputed'
    })
  ])

  const completedPoolCount = completedPools.reduce((sum, pool) => {
    const p = pool.participants.find(p => p.user.toString() === userId.toString())
    return sum + (p && p.payment_status === 'paid' ? 1 : 0)
  }, 0)

  const completedResourceCount = completedResources.reduce((sum, res) => {
    const req = res.requests.find(r => r.requester.toString() === userId.toString() && r.status === 'payment_confirmed')
    return sum + (req ? 1 : 0)
  }, 0)

  const openDisputeCount = poolsWithDisputes.reduce((sum, pool) => {
    const p = pool.participants.find(p => p.user.toString() === userId.toString())
    return sum + (p && p.payment_status === 'disputed' ? 1 : 0)
  }, 0)

  let score = 0

  // Profile completeness
  if (user.phone) score += 15
  if (user.verified) score += 5
  if (user.avatar_url) score += 5
  if (user.bio && user.bio.length > 30) score += 5

  // Community points
  if (user.community_points > 100) score += 5
  if (user.community_points > 300) score += 5
  if (user.community_points > 500) score += 5

  // Completed transactions (capped)
  score += Math.min(completedPoolCount * 3, 15)
  score += Math.min(completedSkills.length * 3, 15)
  score += Math.min(completedResourceCount * 3, 9)

  // Rating
  if (user.rating >= 4) score += 10
  else if (user.rating >= 3) score += 5

  // Account age
  const ageDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  if (ageDays > 30) score += 3
  if (ageDays > 90) score += 3
  if (ageDays > 180) score += 4

  // Dispute penalties
  if (openDisputeCount === 0) score += 5
  score -= openDisputeCount * 15

  // Incomplete profile penalty
  if (!user.phone && !user.bio && !user.avatar_url) score -= 10

  // Clamp
  score = Math.max(0, Math.min(100, score))

  let level
  if (score <= 20) level = 'new'
  else if (score <= 40) level = 'low'
  else if (score <= 60) level = 'moderate'
  else if (score <= 75) level = 'good'
  else if (score <= 89) level = 'trusted'
  else level = 'verified_community_member'

  await User.findByIdAndUpdate(userId, { trust_score: score, trust_level: level })
}

module.exports = { recalculateTrustScore }
