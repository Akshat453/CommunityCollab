const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  phone: { type: String },
  avatar_url: { type: String, default: '' },
  bio: { type: String, default: '' },
  location: {
    city: { type: String, default: '' },
    lat: { type: Number },
    lng: { type: Number }
  },
  verified: { type: Boolean, default: false },
  verification_type: { type: String, enum: ['email', 'phone', 'id'], default: 'email' },
  skills: [{ type: String }],
  interests: [{ type: String }],
  community_points: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  badges: [{ name: String, icon: String, earned_at: Date }],
  role: { type: String, enum: ['user', 'organizer', 'admin'], default: 'user' },
  trust_score: { type: Number, default: 50 },
  trust_level: { type: String, enum: ['new', 'low', 'moderate', 'good', 'trusted', 'verified_community_member'], default: 'new' }
}, { timestamps: true })

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', UserSchema)
