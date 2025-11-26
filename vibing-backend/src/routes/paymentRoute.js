const express = require('express');
const paymentController = require('../controllers/paymentController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Create payment invoice
router.post('/create', verifyToken, paymentController.createPayment);

// Get payment status
router.get('/:paymentId/status', verifyToken, paymentController.getPaymentStatus);

// Get payment by event ID
router.get('/events/:eventId', verifyToken, paymentController.getPaymentByEventId);

// Get all pending payments for current user
router.get('/pending', verifyToken, paymentController.getPendingPayments);

// Get all payments (including paid) for current user
router.get('/all', verifyToken, paymentController.getAllPayments);

// Webhook endpoint (no auth required, uses token verification)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;

