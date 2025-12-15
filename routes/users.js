const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getUserTickets,getUpcomingEvents,updateProfile,getProfile } = require("../controllers/userController");

// GET /api/users/tickets
router.get("/tickets", protect, getUserTickets);
router.get("/upcoming-events", protect, getUpcomingEvents);
router.put("/profile", protect, updateProfile);
router.get("/profile", protect, getProfile);

module.exports = router;
