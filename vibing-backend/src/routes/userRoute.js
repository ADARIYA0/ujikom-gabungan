const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const userEventController = require('../controllers/userEventController');

const router = express.Router();

// Get user's registered events
router.get('/events', verifyToken, userEventController.getMyEvents);

// Get user's event history (completed events)
router.get('/events/history', verifyToken, userEventController.getEventHistory);

module.exports = router;

