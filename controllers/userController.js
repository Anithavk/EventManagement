const asyncHandler = require("express-async-handler");
const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const User = require("../models/User"); 

// GET /api/users/tickets
exports.getUserTickets = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store");
  const userId = req.user._id;

  // Find tickets for logged-in user + join event details
  const tickets = await Ticket.find({ user: userId })
    .populate({ path: "event", select: "title startDate location" })
    .sort({ createdAt: -1 });

  const result = tickets.map(t => ({
    _id: t._id,
    ticketId: t.ticketId,
    eventTitle: t.event ? t.event.title : "Deleted Event",
    eventId: t.event?._id,
    ticketType: t.ticketType,
    quantity: t.quantity,
    totalPrice: t.totalPrice,
    paymentStatus: t.paymentStatus,
    createdAt: t.createdAt,
  }));

  res.json(result);
});


// GET /api/users/upcoming-events
exports.getUpcomingEvents = async (req, res) => {
  res.set("Cache-Control", "no-store");
  const userId = req.user._id;

  const tickets = await Ticket.find({
    user: userId,
    status: "paid", // match your schema
  }).populate("event");

  const now = new Date();
  const upcoming = tickets
    .filter(t => t.event && new Date(t.event.startDate) > now)
    .map(t => ({
      _id: t.event._id,
      title: t.event.title,
      location: t.event.location,
      date: t.event.startDate,
    }));

  const uniqueEvents = Array.from(
    new Map(upcoming.map(e => [e._id.toString(), e])).values()
  );

  res.json(uniqueEvents);
};

// PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name },
    { new: true }
  ).select("-password");

  if (!updatedUser) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(updatedUser);
});


// GET /api/users/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
});

// PUT /api/users/profile
// exports.updateProfile = asyncHandler(async (req, res) => {
//   const { name } = req.body;

//   if (!name) {
//     return res.status(400).json({ message: "Name is required" });
//   }

//   const updated = await User.findByIdAndUpdate(
//     req.user._id,
//     { name },
//     { new: true }
//   ).select("-password");

//   res.json(updated);
// });
