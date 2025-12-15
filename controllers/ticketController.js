const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const PDFDocument = require("pdfkit");


// --------------------------------------------------
// Create a ticket type for an event (Organizer Only)
// --------------------------------------------------
exports.createTicket = async (req, res) => {
  try {
    const { price, quantity, ticketType } = req.body;
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const ticket = await Ticket.create({
      event: eventId,
      eventDate: event.startDate || new Date(),
      user: req.user._id,
      quantity,
      price,
      ticketType   // <-- FIXED
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// --------------------------------------------------
// Get all tickets for an event
// --------------------------------------------------
exports.getTicketsForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const tickets = await Ticket.find({ event: eventId });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------------------------------------
// Purchase Ticket  (User)
// --------------------------------------------------

// controllers/ticketController.js

exports.purchaseTicket = async (req, res) => {
  try {
    const { eventId, ticketTypeId, quantity } = req.body;

    if (!eventId || !ticketTypeId)
      return res.status(400).json({ message: "Missing fields" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const ticketType = event.ticketTypes.id(ticketTypeId);
    if (!ticketType)
      return res.status(400).json({ message: "Invalid ticket type" });

    // ❌ Prevent purchase if sold out
    if (ticketType.quantity <= 0) {
      return res.status(400).json({ message: "This ticket type is sold out" });
    }

    // ❌ Prevent purchase if not enough quantity
    if (ticketType.quantity < quantity) {
      return res.status(400).json({ message: "Not enough tickets available" });
    }

    // Stripe checkout create...
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: ticketType.name },
            unit_amount: ticketType.price * 100,
          },
          quantity,
        },
      ],

      metadata: {
        eventId,
        ticketTypeId,
        quantity,
        userId: req.user._id.toString(),
      },

      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      console.log("checkout.session.completed");

      const session = event.data.object;
       // 🔒 DUPLICATE PROTECTION — PUT IT HERE
      const exists = await Ticket.findOne({
        paymentIntentId: session.payment_intent,
      });

      if (exists) {
        console.log("⚠️ Duplicate webhook ignored");
        return res.json({ received: true });
      }
      const { eventId, ticketTypeId, quantity, userId } = session.metadata;

      const eventDoc = await Event.findById(eventId);
      if (!eventDoc) throw new Error("Event not found");

      const ticketType = eventDoc.ticketTypes.id(ticketTypeId);
      if (!ticketType) throw new Error("Ticket type not found");

      ticketType.quantity -= Number(quantity);
      eventDoc.markModified("ticketTypes");
      await eventDoc.save();
       const totalAmount = ticketType.price * Number(quantity);

      await Ticket.create({
        event: eventId,
        eventDate: eventDoc.startDate || new Date(),
        user: userId,
        quantity: Number(quantity),
        price: ticketType.price,
        totalAmount: totalAmount, 
        ticketType: ticketType.name,
        status: "paid",
        paymentIntentId: session.payment_intent,      
      });

      console.log("Ticket stored in DB");
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook processing failed:", err.message);
    res.status(500).send("Webhook handler failed");
  }
};

// exports.purchaseTicket = async (req, res) => {
//   try {
//     const { ticketId, quantity } = req.body;

//     // 1. Fetch ticket
//     const ticket = await Ticket.findById(ticketId).populate("event");
//     if (!ticket) return res.status(404).json({ message: "Ticket not found" });

//     // 2. Build Stripe product name
//     const productName = `${ticket.event.title} - ${ticket.ticketType} Ticket`;

//     // 3. Create stripe checkout session
//     const session = await stripe.checkout.sessions.create({
//       mode: 'payment',
//       payment_method_types: ['card'],

//       line_items: [
//         {
//           price_data: {
//             currency: 'inr',
//             unit_amount: ticket.price * 100,
//             product_data: {
//               name: productName,
//             },
//           },
//           quantity: quantity,
//         },
//       ],

//       success_url: 'http://localhost:3000/success',
//       cancel_url: 'http://localhost:3000/cancel',
//     });

//     // 4. Return checkout link
//     res.json({ url: session.url });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };




// --------------------------------------------------
// Stripe Webhook
// --------------------------------------------------
// exports.stripeWebhook = async (req, res) => {
//   const sig = req.headers["stripe-signature"];

//   let event;
//   try {
//     event = Stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   // Handle payment success
//   if (event.type === "payment_intent.succeeded") {
//     const intent = event.data.object;

//     await Ticket.findOneAndUpdate(
//       { paymentIntentId: intent.id },
//       { status: "paid" }
//     );
//   }

//   // Handle payment failure
//   if (event.type === "payment_intent.payment_failed") {
//     const intent = event.data.object;

//     await Ticket.findOneAndUpdate(
//       { paymentIntentId: intent.id },
//       { status: "failed" }
//     );
//   }

//   res.json({ received: true });
// };
// --------------------------------------------------
// Get all tickets purchased by logged-in user
// --------------------------------------------------
exports.getMyTickets = async (req, res) => {
  console.log("HIT /my route");
  console.log("User:", req.user);

  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .populate("event", "title date location");

    res.json(tickets);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
// GET /tickets/:ticketId/download
// controllers/ticketController.js


exports.downloadTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate("event")
      .populate("user");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const { event } = ticket;

    const startDate = event.startDate
      ? new Date(event.startDate).toDateString()
      : "N/A";

    const endDate = event.endDate
      ? new Date(event.endDate).toDateString()
      : "N/A";

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ticket_${ticket._id}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(22).text("🎟 Event Ticket", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Ticket ID: ${ticket._id}`);
    doc.text(`Event: ${event.title}`);
    doc.text(`Ticket Type: ${ticket.ticketType}`);
    doc.text(`Price: ₹${ticket.price}`);
    doc.text(`Quantity: ${ticket.quantity}`);

    doc.moveDown();

    doc.text(`Event Start: ${startDate}`);
    doc.text(`Event End: ${endDate}`);

    doc.moveDown();

    if (event.location) {
      const loc = event.location;
      doc.text(`Venue: ${loc.venue}`);
      doc.text(
        `Address: ${loc.address}, ${loc.city}, ${loc.state}, ${loc.country}`
      );
    }

    doc.end();
  } catch (err) {
    console.error("PDF Error:", err.message);
    res.status(500).json({ message: "Failed to generate ticket PDF" });
  }
};



