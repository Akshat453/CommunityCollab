const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String },
  link: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true })

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', NotificationSchema)
