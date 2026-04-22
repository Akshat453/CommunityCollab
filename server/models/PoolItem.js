const mongoose = require('mongoose')

const PoolItemSchema = new mongoose.Schema({
  pool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoolRequest',
    required: true,
    index: true
  },
  added_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product_link: {
    type: String,
    required: true,
    trim: true
  },
  product_name: {
    type: String,
    trim: true
  },
  product_image: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unit: {
    type: String,
    default: 'piece'
  },
  estimated_price: {
    type: Number
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'ordered', 'out_of_stock', 'substituted', 'delivered'],
    default: 'pending'
  },
  orderer_note: {
    type: String
  },
  substitution_link: {
    type: String
  },
  substitution_name: {
    type: String
  }
}, { timestamps: true })

PoolItemSchema.index({ pool: 1, added_by: 1, product_link: 1 }, { unique: false })

module.exports = mongoose.model('PoolItem', PoolItemSchema)
