const { eventValidationRules, validate } = require('../validators/eventValidator');
const authorizeRoles = require('../middlewares/authorizeRoles');
const express = require('express');
const eventController = require('../controllers/eventController');
const upload = require('../middlewares/upload');
const verifyToken = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuth');

const router = express.Router();

router.get('/', optionalAuth, eventController.getAllEvent);
router.get('/export/attendance', verifyToken, authorizeRoles('admin'), eventController.exportEventAttendanceSummary);

router.post(
    '/',
    verifyToken,
    authorizeRoles('admin'),
    upload.fields([
        { name: 'flyer_kegiatan', maxCount: 1 },
        { name: 'sertifikat_kegiatan', maxCount: 1 }
    ]),
    eventValidationRules,
    validate,
    eventController.createEvent
);

router.get('/slug/:slug', optionalAuth, eventController.getEventBySlug);
router.get('/:id', optionalAuth, eventController.getEventById);

router.post('/:id/register', verifyToken, eventController.registerEvent);
router.post('/:id/checkin', verifyToken, eventController.checkInEvent);

router.put(
    '/:id',
    verifyToken,
    authorizeRoles('admin'),
    upload.fields([
        { name: 'flyer_kegiatan', maxCount: 1 },
        { name: 'sertifikat_kegiatan', maxCount: 1 }
    ]),
    eventValidationRules,
    validate,
    eventController.updateEvent
);

router.delete(
    '/:id',
    verifyToken,
    authorizeRoles('admin'),
    eventController.deleteEvent
);

module.exports = router;
