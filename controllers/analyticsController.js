const Registration = require('../models/Registration');
const Ticket = require('../models/Ticket');

exports.eventAnalytics = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;

    // Total tickets sold
    const totalSold = await Registration.countDocuments({ event: eventId, paymentStatus: 'paid' });

    // Revenue aggregated from Payment collection (or sum of ticket.price * sold)
    const payments = await require('../models/Payment').aggregate([
      { $match: { 'raw.metadata.eventId': eventId, status: 'succeeded' } },
      { $group: { _id: null, revenue: { $sum: '$amount' } } }
    ]);
    const revenue = payments[0]?.revenue || 0;

    // ticket type breakdown
    const breakdown = await Registration.aggregate([
      { $match: { event: require('mongoose').Types.ObjectId(eventId), paymentStatus: 'paid' } },
      { $group: { _id: '$ticket', count: { $sum: 1 } } }
    ]);
    // join with ticket names
    const detailed = await Promise.all(breakdown.map(async b => {
      const t = await Ticket.findById(b._id);
      return { ticket: t?.name || 'Unknown', count: b.count };
    }));

    res.json({ totalSold, revenue: revenue / 100, ticketBreakdown: detailed }); // revenue in major currency units
  } catch (err) {
    next(err);
  }
};
