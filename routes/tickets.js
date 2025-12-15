const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');

const {
  createTicket,
  getTicketsForEvent,
  purchaseTicket,
  stripeWebhook,
  getMyTickets,
  downloadTicket
} = require('../controllers/ticketController');


// 1) Stripe webhook
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// 2) Purchase ticket
router.post('/purchase', protect, purchaseTicket);

// 3) Get my tickets (IMPORTANT — must be before /event/:eventId)
router.get('/my', protect, getMyTickets);

// 4) Create ticket type for event
router.post('/event/:eventId', protect, createTicket);

// 5) Get tickets for specific event
router.get('/event/:eventId', getTicketsForEvent);
router.get("/:ticketId/download", protect, downloadTicket);

module.exports = router;
