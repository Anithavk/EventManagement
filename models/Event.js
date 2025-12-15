const mongoose = require('mongoose');
const scheduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    speaker: { type: String },
    description: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true }
  },
  { _id: true }
);
const eventSchema = new mongoose.Schema({
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, index: 'text' },
  description: String,
  category: String,
  startDate: Date,
  endDate: Date,
  location: {
    venue: String,
    address: String,
    city: String,
    state: String,
    country: String
  },
  images: [String],
  videos: [String],
 ticketTypes: [
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },      // e.g. "VIP"
    price: { type: Number, required: true },     // price for this ticket type
    quantity: { type: Number, required: true }   // number of tickets available
  }
],
rejectionReason: {
  type: String,
  default: "",
},
status: {
  type: String,
  enum: ["pending", "approved", "rejected", "cancelled"],
  default: "pending",
},
startDate: Date,
    endDate: Date,
    schedules: [scheduleSchema],

  createdAt: { type: Date, default: Date.now }
});

eventSchema.index({ title: 'text', description: 'text', 'location.city': 1, category: 1 });

module.exports = mongoose.model('Event', eventSchema);
