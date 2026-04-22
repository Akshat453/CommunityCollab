const mongoose = require('mongoose')

const SkillConnectionSchema = new mongoose.Schema({
  listing:        { type: mongoose.Schema.Types.ObjectId, ref: 'SkillListing', required: true },
  learner:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exchange_type:  { type: String, enum: ['free', 'paid', 'barter'], required: true },
  status:         { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  payment_status: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
  payment_id:     { type: String },
  message:        { type: String }
}, { timestamps: true })

module.exports = mongoose.model('SkillConnection', SkillConnectionSchema)
