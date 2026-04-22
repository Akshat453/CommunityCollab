const User = require('../models/User')

const BADGE_RULES = [
  { id: 'first_step', name: 'First Step', icon: '🎯', condition: (u) => u.community_points >= 10 },
  { id: 'pool_master', name: 'Pool Master', icon: '🚗', condition: (u, meta) => (meta.poolsCreated || 0) >= 5 },
  { id: 'skill_guru', name: 'Skill Guru', icon: '📚', condition: (u, meta) => (meta.skillSessionsTaught || 0) >= 10 },
  { id: 'super_volunteer', name: 'Super Volunteer', icon: '🤝', condition: (u, meta) => (meta.eventsAttended || 0) >= 20 },
  { id: 'community_pillar', name: 'Community Pillar', icon: '🏛️', condition: (u) => u.community_points >= 500 }
]

const awardBadges = async (userId, meta = {}) => {
  const user = await User.findById(userId)
  if (!user) return
  const existingIds = user.badges.map(b => b.name)
  for (const rule of BADGE_RULES) {
    if (!existingIds.includes(rule.name) && rule.condition(user, meta)) {
      user.badges.push({ name: rule.name, icon: rule.icon, earned_at: new Date() })
    }
  }
  await user.save()
}

const addPoints = async (userId, points) => {
  await User.findByIdAndUpdate(userId, { $inc: { community_points: points } })
  await awardBadges(userId)
}

module.exports = { addPoints, awardBadges }
