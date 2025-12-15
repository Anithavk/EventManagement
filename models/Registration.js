const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  status: { type: String, enum: ['booked', 'cancelled', 'checked_in'], default: 'booked' },
  paymentIntentId: String,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  qrCodeUrl: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Registration', registrationSchema);
