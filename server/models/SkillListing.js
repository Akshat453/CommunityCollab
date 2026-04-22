const mongoose = require('mongoose')

const SkillListingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listing_type: { type: String, enum: ['offering', 'seeking'], required: true },
  skill_name: { type: String, required: true },
  skill_category: { type: String, enum: ['tech', 'languages', 'arts_music', 'life_skills', 'fitness', 'academic', 'trades', 'other'], required: true },
  description: { type: String },
  proficiency_level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  mode: { type: String, enum: ['online', 'in_person', 'both'], default: 'both' },
  exchange_type: { type: String, enum: ['free', 'paid', 'barter'], default: 'free' },
  price_per_hour: { type: Number },
  what_i_offer_in_return: { type: String },
  availability: { type: Object },
  tags: [{ type: String }],
  location: { city: String, lat: Number, lng: Number },
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' }
}, { timestamps: true })

module.exports = mongoose.model('SkillListing', SkillListingSchema)
