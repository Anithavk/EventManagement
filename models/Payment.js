const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  stripePaymentIntentId: String,
  amount: Number,
  currency: String,
  registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' },
  status: String,
  raw: Object,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
