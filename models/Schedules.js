const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  speaker: { type: String },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true }
});

const eventSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true },
  description: String,
  category: String,
  location: String,
  image: String,
  videoUrl: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  // 👇 Add schedules correctly
  schedules: [scheduleSchema],

  ticketTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: "TicketType" }],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
}, { timestamps: true });
