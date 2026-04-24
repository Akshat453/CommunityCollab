const mongoose = require('mongoose')

const ResourceSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['tool', 'workspace', 'vehicle', 'meal', 'groceries', 'other'], required: true },
  title: { type: String, required: true },
  description: { type: String },
  image_urls: [{ type: String }],
  availability_schedule: { type: Object },
  location: { city: String, lat: Number, lng: Number },
  is_free: { type: Boolean, default: true },
  price_per_day: { type: Number },
  condition: { type: String, enum: ['new', 'good', 'fair'], default: 'good' },
  status: { type: String, enum: ['available', 'borrowed', 'unavailable'], default: 'available' },
  tags: [{ type: String }],
  requests: [{
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    start_date: Date,
    end_date: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'returned', 'utr_submitted', 'payment_confirmed'],
      default: 'pending'
    },
    message: String,
    owner_upi_id: { type: String },
    owner_upi_name: { type: String },
    utr_number: { type: String },
    utr_submitted_at: { type: Date },
    payment_confirmed_by_owner: { type: Boolean, default: false },
    payment_confirmed_at: { type: Date }
  }]
}, { timestamps: true })

module.exports = mongoose.model('Resource', ResourceSchema)
