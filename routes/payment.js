const router = require('express').Router();
const { protect } = require('../middleware/auth');
const bodyParser = require('body-parser');
const paymentController = require('../controllers/paymentController');

// create a payment intent for a registration
router.post('/create-intent', protect, paymentController.createPaymentIntent);

// Stripe webhook: we need raw body. Use bodyParser.raw({type: 'application/json'}) specifically for this route.
// The server.js uses bodyParser.json() globally, but Stripe requires raw body for verification.
// So we override for this path. Also, to make raw body available to controller, assign to req.rawBody.
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  req.rawBody = req.body;
  paymentController.stripeWebhookHandler(req, res);
});

module.exports = router;
