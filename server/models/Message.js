const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  type: { type: String, enum: ['text', 'image', 'card'], default: 'text' },
  card_data: { type: Object }
}, { timestamps: true })

MessageSchema.index({ room: 1, createdAt: -1 })

module.exports = mongoose.model('Message', MessageSchema)
