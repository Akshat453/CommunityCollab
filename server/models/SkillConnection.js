const mongoose = require('mongoose')

const SkillConnectionSchema = new mongoose.Schema({
  listing:        { type: mongoose.Schema.Types.ObjectId, ref: 'SkillListing', required: true },
  learner:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exchange_type:  { type: String, enum: ['free', 'paid', 'barter'], required: true },
  status:         { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  payment_status: { type: String, enum: ['unpaid', 'utr_submitted', 'paid', 'disputed', 'refunded'], default: 'unpaid' },
  message:        { type: String },
  teacher_upi_id:               { type: String },
  teacher_upi_name:             { type: String },
  utr_number:                   { type: String },
  utr_submitted_at:             { type: Date },
  payment_confirmed_by_teacher: { type: Boolean, default: false },
  payment_confirmed_at:         { type: Date },
  learner_completed:            { type: Boolean, default: false },
  teacher_completed:            { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('SkillConnection', SkillConnectionSchema)
