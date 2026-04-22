const mongoose = require('mongoose')

const AssistancePostSchema = new mongoose.Schema({
  poster: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post_type: { type: String, enum: ['offering', 'requesting'], required: true },
  category: { type: String, enum: ['errand', 'tutoring', 'delivery', 'transport', 'eldercare', 'petcare', 'other'], required: true },
  title: { type: String, required: true },
  description: { type: String },
  urgency: { type: String, enum: ['low', 'medium', 'urgent'], default: 'low' },
  location: { city: String, lat: Number, lng: Number },
  scheduled_at: { type: Date },
  status: { type: String, enum: ['open', 'matched', 'completed', 'cancelled'], default: 'open' },
  tags: [{ type: String }],
  responses: [{ responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, message: String, status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' } }]
}, { timestamps: true })

module.exports = mongoose.model('AssistancePost', AssistancePostSchema)
