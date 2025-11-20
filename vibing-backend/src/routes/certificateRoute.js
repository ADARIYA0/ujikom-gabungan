const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const verifyToken = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');

// Log route registration
logger.info('Certificate routes registered: /api/certificate/download/:attendanceId');

// Generate certificate for attendance
router.post('/generate/:attendanceId', verifyToken, certificateController.generateCertificate);

// Download certificate
router.get('/download/:attendanceId', verifyToken, certificateController.downloadCertificate);

module.exports = router;

