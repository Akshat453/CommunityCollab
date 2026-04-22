const mongoose = require('mongoose')

const PoolRequestSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['blinkit', 'swiggy', 'zomato', 'amazon', 'flipkart', 'dmart', 'zepto', 'custom'],
    default: 'custom'
  },
  platform_custom_name: {
    type: String  // used when platform = 'custom'
  },
  platform_base_url: {
    type: String  // optional: base URL of the platform for validation
  },
  type: {
    type: String,
    enum: ['group_buy', 'carpool', 'custom'],
    default: 'group_buy'
  },
  destination: {
    type: String  // delivery address for the order
  },
  scheduled_at: {
    type: Date
  },
  max_participants: {
    type: Number,
    required: true,
    default: 10
  },
  status: {
    type: String,
    enum: ['open', 'ordering', 'ordered', 'completed', 'cancelled'],
    default: 'open'
  },
  // Who is placing the final combined order
  designated_orderer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Proof of order placed by the orderer
  order_proof: {
    screenshot_url: { type: String },
    order_url: { type: String },
    order_id_external: { type: String },
    note: { type: String },
    submitted_at: { type: Date },
    verified_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  is_public: {
    type: Boolean,
    default: true
  },
  tags: [{ type: String }],
  location: {
    city: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joined_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed'
    },
    payment_status: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid'
    },
    payment_id: { type: String },
    delivery_confirmed: {
      type: Boolean,
      default: false
    },
    delivery_confirmed_at: { type: Date }
  }]
}, { timestamps: true })

module.exports = mongoose.model('PoolRequest', PoolRequestSchema)
