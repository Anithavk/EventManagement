const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const adminController = require("../controllers/adminController");
const {
  createEvent,
  updateEvent,
  getEvent,
  searchEvents,
  getAllEvents,
  addImage
} = require('../controllers/eventController');

router.get('/', searchEvents); 

router.get('/', getAllEvents);  // <-- THIS MUST BE FIRST

router.post('/', protect, requireRole('organizer', 'admin'), createEvent);
router.put('/:id', protect, updateEvent);
router.get('/:id', getEvent);
router.post('/:id/image', protect, addImage);
router.delete("/:id", protect, adminController.deleteEvent);


module.exports = router;
