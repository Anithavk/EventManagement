const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Ticket = require('../models/Ticket');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const { generateQRCode } = require('../utils/qrGenerator');
const { sendMail } = require('../utils/mailer');
const Event = require('../models/Event');

exports.createPaymentIntent = async (req, res, next) => {
  // Create PaymentIntent for a registration: server-side to avoid price tampering.
  try {
    const { registrationId } = req.body;
    const registration = await Registration.findById(registrationId).populate('ticket event user');
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    if (registration.paymentStatus === 'paid') return res.status(400).json({ message: 'Already paid' });

    const amount = Math.round((registration.ticket.price || 0) * 100); // in cents/paise
    const currency = registration.ticket.currency || 'INR';

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        registrationId: String(registration._id),
        eventId: String(registration.event)
      }
    });

    // Save a Payment document for tracking
    await Payment.create({
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency,
      registration: registration._id,
      status: paymentIntent.status,
      raw: paymentIntent
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
};

// Webhook endpoint to confirm payment and mark registration paid
// IMPORTANT: configure Stripe webhook to POST to /api/payment/webhook with raw body
exports.stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const rawBody = req.rawBody || req.body; // we will ensure raw body is available in route
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      try {
        const payment = await Payment.findOne({ stripePaymentIntentId: pi.id });
        if (!payment) {
          // create if missing
          await Payment.create({ stripePaymentIntentId: pi.id, amount: pi.amount_received, currency: pi.currency, status: 'succeeded', raw: pi });
        } else {
          payment.status = 'succeeded';
          payment.raw = pi;
          await payment.save();
        }

        const registrationId = pi.metadata.registrationId;
        if (registrationId) {
          const reg = await Registration.findById(registrationId).populate('user ticket event');
          if (reg) {
            reg.paymentStatus = 'paid';
            reg.paymentIntentId = pi.id;

            // increment ticket soldQuantity
            const ticket = await Ticket.findById(reg.ticket._id);
            ticket.soldQuantity = (ticket.soldQuantity || 0) + 1;
            await ticket.save();

            // generate QR and store (data url)
            const qr = await generateQRCode(`${reg._id}:${pi.id}`);
            reg.qrCodeUrl = qr;
            await reg.save();

            // send confirmation email
            try {
              await sendMail({
                to: reg.user.email,
                subject: `Ticket confirmation - ${reg.event.title}`,
                html: `<p>Hi ${reg.user.name},</p>
                <p>Thanks for booking. Your ticket is confirmed. Registration ID: ${reg._id}</p>
                <p><img src="${qr}" alt="QR code" /></p>`
              });
            } catch (mailErr) {
              console.error('Failed sending mail', mailErr);
            }
          }
        }
      } catch (err) {
        console.error('Error processing payment succeeded webhook', err);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      // mark payment failed
      const pi = event.data.object;
      const payment = await Payment.findOne({ stripePaymentIntentId: pi.id });
      if (payment) {
        payment.status = 'failed';
        payment.raw = pi;
        await payment.save();
        // mark registration failed if present
        if (pi.metadata && pi.metadata.registrationId) {
          await Registration.findByIdAndUpdate(pi.metadata.registrationId, { paymentStatus: 'failed' });
        }
      }
      break;
    }
    default:
      // console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
};
