const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

// ===============================
// GET: /api/admin/events-analytics
// ===============================
exports.getEventsAnalytics = async (req, res, next) => {
  try {
    const events = await Event.find().lean();

    const enriched = await Promise.all(
      events.map(async (event) => {
        const ticketsSold = await Ticket.countDocuments({ event: event._id });

        const revenueAgg = await Ticket.aggregate([
          { $match: { event: event._id } },
          { $group: { _id: null, total: { $sum: "$price" } } }
        ]);

        return {
          ...event,
          ticketsSold,
          revenue: revenueAgg[0]?.total || 0,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

// ===============================
// PUT: /api/admin/events/:id/status
// ===============================
exports.updateEventStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    const allowedStatuses = [
      "draft",
      "published",
      "approved",
      "rejected",
      "cancelled",
      "completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.status = status;
    if (status === "rejected") {
      event.rejectionReason = reason || "No reason provided";
    }

    await event.save();

    res.json({
      message: `Event ${status} successfully`,
      event,
    });
  } catch (err) {
    next(err);
  }
};

// ===============================
// DELETE: /api/admin/events/:id
// ===============================
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    await Ticket.deleteMany({ event: event._id });

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ===============================
// GET: /api/admin/users
// ===============================
exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    next(err);
  }
};
exports.getPayments = async (req, res) => {
  const payments = await Ticket.find()
    .populate("user", "email")
    .populate("event", "title");

  res.json(payments);
};
