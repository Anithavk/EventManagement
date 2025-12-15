const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { eventAnalytics } = require('../controllers/analyticsController');

router.get('/event/:eventId', protect, eventAnalytics);

module.exports = router;
