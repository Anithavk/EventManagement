const Registration = require('../models/Registration');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { generateQRCode } = require('../utils/qrGenerator');
const Payment = require('../models/Payment');

exports.createRegistrationPlaceholder = async (req, res, next) => {
  // Creates registration in pending state and returns a client_secret for Stripe PaymentIntent creation on server
  // NOTE: in this design we create PaymentIntent server-side and return client_secret to frontend to complete payment.
  try {
    const { userId } = req.user ? { userId: req.user._id } : req.body;
    const { eventId, ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.salesEnd && new Date() > ticket.salesEnd) {
      return res.status(400).json({ message: 'Ticket sales ended' });
    }
    // create a registration record with pending paymentStatus
    const reg = await Registration.create({ user: userId, event: eventId, ticket: ticketId, paymentStatus: 'pending' });
    res.json({ registrationId: reg._id });
  } catch (err) {
    next(err);
  }
};

exports.getUserRegistrations = async (req, res, next) => {
  try {
    const regs = await Registration.find({ user: req.user._id }).populate('event ticket');
    res.json(regs);
  } catch (err) {
    next(err);
  }
};

exports.exportRegistrationsCSV = async (req, res, next) => {
  try {
    const regs = await Registration.find({ event: req.params.eventId }).populate('user ticket');
    const rows = regs.map(r => ({
      name: r.user?.name,
      email: r.user?.email,
      ticket: r.ticket?.name,
      status: r.status,
      paymentStatus: r.paymentStatus,
      createdAt: r.createdAt
    }));
    const { exportRegistrationsToCSV } = require('../utils/csvExport');
    const filename = await exportRegistrationsToCSV(rows);
    res.download(filename);
  } catch (err) {
    next(err);
  }
};
