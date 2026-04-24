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
  const newBadges = []
  for (const rule of BADGE_RULES) {
    if (!existingIds.includes(rule.name) && rule.condition(user, meta)) {
      const badge = { name: rule.name, icon: rule.icon, earned_at: new Date() }
      user.badges.push(badge)
      newBadges.push(badge)
    }
  }
  await user.save()

  if (newBadges.length > 0) {
    const Notification = require('../models/Notification')
    const { notifyUser } = require('../sockets/socket')
    for (const badge of newBadges) {
      const notif = await Notification.create({
        recipient: userId,
        type: 'badge',
        title: 'New badge earned!',
        message: `You earned the "${badge.name}" ${badge.icon} badge. Keep it up!`,
        link: '/profile'
      })
      notifyUser(userId.toString(), 'notification:new', { notification: notif })
    }
  }
}

const addPoints = async (userId, points) => {
  await User.findByIdAndUpdate(userId, { $inc: { community_points: points } })
  await awardBadges(userId)
}

module.exports = { addPoints, awardBadges }
