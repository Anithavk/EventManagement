const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { createRegistrationPlaceholder, getUserRegistrations, exportRegistrationsCSV } = require('../controllers/registrationController');

router.post('/create', protect, createRegistrationPlaceholder);
router.get('/me', protect, getUserRegistrations);
router.get('/export/:eventId', protect, exportRegistrationsCSV);

module.exports = router;
