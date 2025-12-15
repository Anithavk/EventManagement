const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const adminController = require("../controllers/adminController");;

router.use(protect);
router.use(requireRole('admin'));
// event analytics
router.get("/events-analytics", protect, adminController.getEventsAnalytics);
router.put("/events/:id/status", protect, adminController.updateEventStatus);
router.delete("/events/:id", protect, adminController.deleteEvent);
router.get("/users", protect, adminController.listUsers);
router.get("/payments", protect, adminController.getPayments);


module.exports = router;
