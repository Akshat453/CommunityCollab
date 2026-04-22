const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String },
  link: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('Notification', NotificationSchema)
