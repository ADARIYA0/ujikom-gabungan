const { validate } = require('../middlewares/validate');
const express = require('express');
const authController = require('../controllers/authController');
const authValidator = require('../validators/authValidator');
const verifyRefreshToken = require('../middlewares/refreshMiddleware');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', authValidator.registerValidator, validate, authController.register);
router.post('/login', authValidator.loginValidator, validate, authController.login);
router.post('/refresh-token', verifyRefreshToken, authController.refreshToken);
router.post('/logout', verifyToken, authController.logout);

router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/check-lock-status', authController.checkLockStatus);
router.post('/check-verification-status', authController.checkVerificationStatus);

router.post('/request-reset', authValidator.requestResetValidator, validate, authController.requestPasswordReset);
router.post('/check-password-reset-request-status', authController.checkPasswordResetRequestStatus);
router.post('/check-password-reset-lock-status', authController.checkPasswordResetLockStatus);
router.post('/verify-password-reset-otp', authValidator.verifyPasswordResetOtpValidator, validate, authController.verifyPasswordResetOtp);
router.post('/reset-password', authValidator.resetPasswordValidator, validate, authController.resetPassword);

module.exports = router;
