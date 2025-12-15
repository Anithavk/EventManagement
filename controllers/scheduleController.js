const Event = require("../models/Event");
const notifyAttendees = require("../utils/notifyAttendees");

// Helper: Validate schedule data
const validateSchedule = (schedule) => {
  const errors = [];
  if (!schedule.title || typeof schedule.title !== "string") {
    errors.push("Title is required and must be a string.");
  }
  if (!schedule.startTime) {
    errors.push("Start time is required.");
  }
  if (!schedule.endTime) {
    errors.push("End time is required.");
  }
  // Optional: check that startTime < endTime
  if (schedule.startTime && schedule.endTime && new Date(schedule.startTime) >= new Date(schedule.endTime)) {
    errors.push("Start time must be before end time.");
  }
  return errors;
};

// GET schedules
exports.getSchedules = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event.schedules);
  } catch (err) {
    next(err);
  }
};

// POST / PUT schedule (add or update)
exports.saveSchedule = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization
    if (String(event.organizer) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const incoming = req.body;

    // Validate schedule data
    const validationErrors = validateSchedule(incoming);
    if (validationErrors.length) {
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }

    if (incoming._id) {
      // Update existing schedule
      const schedule = event.schedules.id(incoming._id);
      if (!schedule) return res.status(404).json({ message: "Schedule not found" });

      // Prevent overwriting _id
      Object.assign(schedule, { ...incoming, _id: schedule._id });

      await event.save();

      try {
        await notifyAttendees(event._id, `Schedule updated: ${schedule.title}`);
      } catch (err) {
        console.error("Notification failed:", err);
      }

      res.json({ message: "Schedule updated", schedule });
    } else {
      // Add new schedule
      const newSchedule = event.schedules.create(incoming); // ensures _id is generated
      event.schedules.push(newSchedule);

      await event.save();

      try {
        await notifyAttendees(event._id, `New schedule added: ${newSchedule.title}`);
      } catch (err) {
        console.error("Notification failed:", err);
      }

      res.json({ message: "Schedule added", schedule: newSchedule });
    }
  } catch (err) {
    next(err);
  }
};

// DELETE schedule
exports.deleteSchedule = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization
    if (String(event.organizer) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const scheduleIndex = event.schedules.findIndex(
      (s) => s._id.toString() === req.params.scheduleId
    );

    if (scheduleIndex === -1) return res.status(404).json({ message: "Schedule not found" });

    const removedSchedule = event.schedules.splice(scheduleIndex, 1)[0];
    await event.save();

    try {
      await notifyAttendees(event._id, `Schedule removed: ${removedSchedule.title}`);
    } catch (err) {
      console.error("Notification failed:", err);
    }

    res.json({ message: "Schedule deleted", schedule: removedSchedule });
  } catch (err) {
    next(err);
  }
};
