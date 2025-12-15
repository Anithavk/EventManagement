require("dotenv").config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const connectDB = require('./config/db');

// routes
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const ticketsRoutes = require('./routes/tickets');
const registrationsRoutes = require('./routes/registrations');
const schedulesRoutes = require('./routes/schedules');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const userRoutes= require("./routes/users");

const { errorHandler } = require('./middleware/errorHandler');



const app = express();
connectDB();

app.use(helmet());
const cors = require("cors");

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://graceful-nougat-f56002.netlify.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());
app.use(morgan('dev'));
app.post(
  "/api/tickets/webhook",
  express.raw({ type: "application/json" }),
  require("./controllers/ticketController").stripeWebhook
);
// webhook raw body FIRST
//app.use("/api/tickets/webhook", express.raw({ type: "application/json" }));


// normal JSON for rest APIs
app.use(express.json());

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api', schedulesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use("/api/users", userRoutes);
// app.use("/api/users", require("./routes/users"));
app.get("/", (req, res) => {
  res.status(200).send("Event backend is running 🚀");
});


// ERROR HANDLER
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});