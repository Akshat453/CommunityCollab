const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema({
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['charity', 'cleanup', 'workshop', 'health', 'fundraiser', 'social'], required: true },
  cover_image_url: { type: String },
  location: { address: String, city: String, lat: Number, lng: Number },
  starts_at: { type: Date, required: true },
  ends_at: { type: Date },
  max_volunteers: { type: Number },
  registered_count: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'], default: 'published' },
  resources_needed: [{ name: String, quantity: Number, unit: String, pledged: Number }],
  tasks: [{ title: String, description: String, assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, status: { type: String, enum: ['open', 'in_progress', 'done'], default: 'open' }, due_at: Date }],
  participants: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: { type: String, enum: ['volunteer', 'participant', 'donor'], default: 'participant' }, status: { type: String, enum: ['registered', 'attended', 'cancelled'], default: 'registered' }, registered_at: Date }],
  donations: [{ donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, amount: Number, message: String, payment_id: String, donated_at: Date }],
  tags: [{ type: String }]
}, { timestamps: true })

module.exports = mongoose.model('Event', EventSchema)
