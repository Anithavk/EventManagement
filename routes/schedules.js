// routes/schedules.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getSchedules, saveSchedule, deleteSchedule } = require("../controllers/scheduleController");

// PUBLIC
router.get("/events/:eventId/schedules", getSchedules);

// ORGANIZER / ADMIN
router.post("/events/:eventId/schedules", protect, saveSchedule);
router.put("/events/:eventId/schedules", protect, saveSchedule); // No scheduleId needed
router.delete("/events/:eventId/schedules/:scheduleId", protect, deleteSchedule);

module.exports = router;
