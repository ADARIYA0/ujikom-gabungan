const { addToBlacklist, generateTokens } = require('../utils/tokenUtils');
const { generateNumericOtp, hashOtp, compareOtp } = require('../utils/otpUtils');
const { getRepository } = require('../utils/getRepository');
const { sendOtpEmail, sendPasswordReset } = require('../services/emailService');
const AdminToken = require('../entities/Auth/AdminToken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const ms = require('ms');
const User = require('../entities/Auth/User');
const UserToken = require('../entities/Auth/UserToken');

function getExpiryDate(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
}

const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_NAME = isProduction ? '__Host-refreshToken' : 'refreshToken';

const ALLOWED_SAMESITE = new Set(['strict', 'lax', 'none']);
const DEFAULT_SAMESITE = isProduction ? 'strict' : 'lax';
let cookieSameSite = (process.env.COOKIE_SAMESITE || DEFAULT_SAMESITE).toLowerCase();
if (!ALLOWED_SAMESITE.has(cookieSameSite)) {
    logger.warn(`Invalid COOKIE_SAMESITE="${process.env.COOKIE_SAMESITE}", falling back to "${DEFAULT_SAMESITE}"`);
    cookieSameSite = DEFAULT_SAMESITE;
}

const cookieOptions = {
    httpOnly: true,
    secure: isProduction || process.env.COOKIE_SECURE === 'true',
    sameSite: cookieSameSite,
    path: '/',
    maxAge: ms(process.env.JWT_REFRESH_EXPIRES)
};

if (cookieOptions.sameSite === 'none' && !cookieOptions.secure) {
    logger.warn('COOKIE_SAMESITE=none requires secure=true. Overriding sameSite to "lax"');
    cookieOptions.sameSite = 'lax';
}

exports.register = async (req, res) => {
    try {
        const userRepository = getRepository(User);

        const { email, no_handphone, password, alamat, pendidikan_terakhir } = req.body;
        logger.info(`POST /auth/register accessed, email=${email}`);

        const existingUsers = await userRepository.find({
            where: [{ email }, { no_handphone }]
        });

        let errors = [];
        for (const u of existingUsers) {
            if (u.email === email) errors.push('Email is already registered');
            if (u.no_handphone === no_handphone) errors.push('Nomor Handphone is already registered');
        }

        if (errors.length > 0) {
            logger.warn(`Registration failed: ${errors.join(', ')}, email=${email}`);
            return res.status(400).json({ message: errors });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otpPlain = generateNumericOtp(6);
        const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10);
        const otpHashed = await hashOtp(otpPlain);

        const newUser = userRepository.create({
            email,
            no_handphone,
            password: hashedPassword,
            alamat,
            pendidikan_terakhir,
            status_akun: 'belum-aktif',
            otp: otpHashed,
            otp_expiry: getExpiryDate(expiresMinutes)
        });

        await userRepository.save(newUser);

        try {
            await sendOtpEmail(email, otpPlain, expiresMinutes);
            logger.info(`OTP sent for registration: email=${email}, expiresAt=${newUser.otp_expiry}`);
        } catch (mailError) {
            logger.error(`Failed to send OTP (email=${email}): ${mailError.message}`, { stack: mailError.stack });
        }

        res.status(201).json({
            message: 'Registration successful. OTP code has been sent to your email',
            user: {
                id: newUser.id,
                email: newUser.email,
                no_handphone: newUser.no_handphone
            }
        });
    } catch (error) {
        logger.error(`Registration error for email=${req.body.email}: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.login = async (req, res) => {
    try {
        const userRepository = getRepository(User);
        const userTokenRepository = getRepository(UserToken);

        const { email, password } = req.body;
        logger.info(`POST /auth/login accessed, email=${email}`);

        const user = await userRepository
            .createQueryBuilder("user")
            .addSelect("user.password")
            .where("user.email = :email", { email })
            .getOne();
        if (!user) {
            logger.warn(`Login failed: user not found, email=${email}`);
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.status_akun !== 'aktif') {
            logger.warn(`Login failed: account not verified, email=${email}`);
            return res.status(403).json({ message: 'Account not verified. Please verify your account first' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn(`Login failed: wrong password, email=${email}`);
            return res.status(400).json({ message: 'Wrong password' });
        }

        user.role = 'user';
        const { accessToken, refreshToken } = generateTokens(user);

        const userToken = userTokenRepository.create({
            user,
            refresh_token: refreshToken,
            user_agent: req.headers['user-agent'] || null,
            ip_address: req.ip,
            created_at: new Date(),
            expires_at: new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES))
        });
        await userTokenRepository.save(userToken);

        logger.info(`Login successful: userId=${user.id}`);

        res.cookie(COOKIE_NAME, refreshToken, cookieOptions);
        res.status(200).json({
            message: 'Login successful',
            accessToken
        });
    } catch (error) {
        logger.error(`Login error for email=${req.body.email}: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const userTokenRepository = getRepository(UserToken);
        const adminTokenRepository = getRepository(AdminToken);

        const refreshToken = req.refreshToken || req.cookies?.[COOKIE_NAME] || null;
        const { id, role } = req.user;

        const tokenRepo = role === 'admin'
            ? adminTokenRepository
            : userTokenRepository;

        const relationName = role === 'admin' ? 'admin' : 'user';
        const userToken = await tokenRepo.findOne({
            where: { refresh_token: refreshToken },
            relations: [relationName]
        });

        if (!userToken) {
            logger.warn(`Refresh failed: token not found in DB, subjectId=${id}, role=${role}`);
            return res.status(403).json({ message: 'Refresh token not found or has been revoked' });
        }

        const userData = userToken[relationName];
        if (!userData) {
            logger.error(`Refresh failed: ${relationName} not found in token, subjectId=${id}, role=${role}`);
            return res.status(500).json({ message: 'Internal server error' });
        }

        // Ensure role is included when generating new tokens
        const userForToken = {
            id: userData.id,
            email: userData.email,
            role: role || (userData.role || 'user')
        };

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(userForToken);

        userToken.refresh_token = newRefreshToken;
        userToken.expires_at = new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES));
        await tokenRepo.save(userToken);

        logger.info(`Refresh successful: subjectId=${id}, role=${role}`);

        res.cookie(COOKIE_NAME, newRefreshToken, cookieOptions);
        res.status(200).json({ accessToken });
    } catch (error) {
        logger.error(`refreshToken error: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const userRepository = getRepository(User);

        const { email, otp } = req.body;
        logger.info(`POST /auth/verify-otp accessed, email=${email}`);

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP required' });
        }

        const user = await userRepository.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.status_akun === 'aktif') {
            logger.warn(`Verify OTP failed: already active, email=${email}`);
            return res.status(400).json({ message: 'Account is already activated' });
        }

        if (!user.otp || !user.otp_expiry) {
            logger.warn(`Verify OTP failed: no active OTP, email=${email}`);
            return res.status(400).json({ message: 'No active OTP. Please request OTP again' });
        }

        const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS, 10);
        const lockMinutes = parseInt(process.env.OTP_LOCK_MINUTES, 10);

        if (user.otp_verify_locked_until && new Date() < new Date(user.otp_verify_locked_until)) {
            const remaining = Math.ceil((new Date(user.otp_verify_locked_until) - new Date()) / 60000);
            logger.warn(`User locked from OTP verification: email=${email}`);
            return res.status(429).json({
                message: `Too many invalid OTP attempts. Try again in ${remaining} minute(s).`
            });
        }

        if (user.otp_verify_locked_until && new Date() >= new Date(user.otp_verify_locked_until)) {
            user.otp_attempts = 0;
            user.otp_verify_locked_until = null;
            await userRepository.save(user);
            logger.info(`Lock period expired, reset attempts for email=${email}`);
        }

        const otpMatch = await compareOtp(otp, user.otp);

        if (otpMatch) {
            const now = new Date();
            if (now > new Date(user.otp_expiry)) {
                logger.warn(`Valid OTP but expired for email=${email}, expiredAt=${user.otp_expiry}`);
                return res.status(400).json({ message: 'OTP expired. Please request OTP again' });
            }

            user.status_akun = 'aktif';
            user.otp = null;
            user.otp_expiry = null;
            user.otp_attempts = 0;
            user.otp_verify_locked_until = null;

            await userRepository.save(user);
            logger.info(`Email verified successfully: email=${email}, userId=${user.id}`);

            return res.status(200).json({ message: 'Verification successful. Account is now active' });
        }

        if (!otpMatch) {
            user.otp_attempts = (user.otp_attempts || 0) + 1;

            if (user.otp_attempts >= maxAttempts) {
                user.otp_verify_locked_until = new Date(Date.now() + lockMinutes * 60 * 1000);
                logger.warn(`User locked from OTP verification due to too many failed attempts: email=${email}`);
            }

            await userRepository.save(user);

            const remainingAttempts = maxAttempts - user.otp_attempts;
            return res.status(400).json({
                message: 'Invalid OTP',
                attemptCount: user.otp_attempts,
                maxAttempts: maxAttempts,
                remainingAttempts: remainingAttempts
            });
        }

        user.status_akun = 'aktif';
        user.otp = null;
        user.otp_expiry = null;
        user.otp_attempts = 0;
        user.otp_verify_locked_until = null;

        await userRepository.save(user);
        logger.info(`Email verified successfully: email=${email}, userId=${user.id}`);

        res.status(200).json({ message: 'Verification successful. Account is now active' });
    } catch (error) {
        logger.error(`verifyOtp error: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.checkLockStatus = async (req, res) => {
    try {
        const userRepository = getRepository(User);

        const { email } = req.body;
        logger.info(`POST /auth/check-lock-status accessed, email=${email}`);

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const now = new Date();

        if (user.otp_verify_locked_until && now < new Date(user.otp_verify_locked_until)) {
            const remainingSeconds = Math.ceil((new Date(user.otp_verify_locked_until) - now) / 1000);
            const remainingMinutes = Math.floor(remainingSeconds / 60);
            const remainingSecondsOnly = remainingSeconds % 60;

            logger.info(`User ${email} is locked for OTP verification, remaining: ${remainingMinutes}:${remainingSecondsOnly.toString().padStart(2, '0')}`);

            return res.status(200).json({
                isLocked: true,
                lockType: 'otp_verify',
                remainingSeconds: remainingSeconds,
                remainingMinutes: remainingMinutes,
                message: `Too many invalid OTP attempts. Try again in ${Math.ceil(remainingSeconds / 60)} minute(s).`
            });
        }

        if (user.otp_locked_until && now < new Date(user.otp_locked_until)) {
            const remaining = Math.ceil((new Date(user.otp_locked_until) - now) / 60000);
            return res.status(200).json({
                isLocked: true,
                lockType: 'otp_resend',
                remainingMinutes: remaining,
                message: `Too many OTP requests. Try again in ${remaining} minutes`
            });
        }

        logger.info(`User ${email} is not locked, attempt count: ${user.otp_attempts || 0}`);
        return res.status(200).json({
            isLocked: false,
            attemptCount: user.otp_attempts || 0,
            maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10)
        });

    } catch (error) {
        logger.error(`checkLockStatus error: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.checkVerificationStatus = async (req, res) => {
    try {
        const userRepository = getRepository(User);

        const { email } = req.body;
        logger.info(`POST /auth/check-verification-status accessed, email=${email}`);

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            logger.warn(`User not found for verification check: ${email}`);
            return res.status(404).json({ message: 'User not found' });
        }

        const isVerified = user.status_akun === 'aktif';
        logger.info(`User verification status: email=${email}, status_akun=${user.status_akun}, isVerified=${isVerified}`);

        return res.status(200).json({
            isVerified: isVerified,
            email: user.email
        });
    } catch (error) {
        logger.error(`checkVerificationStatus error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.resendOtp = async (req, res) => {
    try {
        const userRepository = getRepository(User);

        const { email } = req.body;
        logger.info(`POST /auth/resend-otp accessed, email=${email}`);

        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await userRepository.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.status_akun === 'aktif') {
            logger.warn(`Resend OTP failed: already active, email=${email}`);
            return res.status(400).json({ message: 'Account is already activated' });
        }

        const resendLimit = parseInt(process.env.OTP_RESEND_LIMIT_PER_WINDOW, 10);
        const resendWindowMinutes = parseInt(process.env.OTP_RESEND_LIMIT_WINDOW_MINUTES, 10);
        const resendCooldownSeconds = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10);

        const now = new Date();

        if (user.otp_locked_until && new Date(user.otp_locked_until) > now) {
            const remaining = Math.ceil((new Date(user.otp_locked_until) - now) / 1000 / 60);
            logger.warn(`Resend OTP blocked due to lock: email=${email}`);
            return res.status(429).json({ message: `Too many attempts. Please try again in ${remaining} minutes` });
        }

        if (user.otp_locked_until && new Date(user.otp_locked_until) <= now) {
            user.otp_resend_count = 0;
            user.otp_locked_until = null;
            logger.info(`Resend lock period expired, reset resend count for email=${email}`);
        }

        if (user.otp_last_sent_at && (now - new Date(user.otp_last_sent_at)) > resendWindowMinutes * 60 * 1000) {
            user.otp_resend_count = 0;
        }

        if (user.otp_resend_count >= resendLimit) {
            user.otp_locked_until = new Date(now.getTime() + resendWindowMinutes * 60 * 1000);
            await userRepository.save(user);
            logger.warn(`Resend OTP limit reached for email=${email}`);
            return res.status(429).json({ message: 'Too many OTP requests. Try again later' });
        }

        if (user.otp_last_sent_at && (now - new Date(user.otp_last_sent_at)) < resendCooldownSeconds * 1000) {
            const remaining = Math.ceil((resendCooldownSeconds * 1000 - (now - new Date(user.otp_last_sent_at))) / 1000);
            logger.info(`Resend OTP cooldown active for email=${email}, remaining=${remaining}s`);
            return res.status(429).json({ message: `Wait ${remaining} seconds before sending another OTP` });
        }

        const otpPlain = generateNumericOtp(6);
        const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10);
        const otpHashed = await hashOtp(otpPlain);
        user.otp = otpHashed;
        user.otp_expiry = getExpiryDate(expiresMinutes);

        user.otp_resend_count += 1;
        user.otp_last_sent_at = now;
        user.otp_locked_until = null;

        await userRepository.save(user);

        try {
            await sendOtpEmail(email, otpPlain, expiresMinutes);
            logger.info(`OTP resent (${user.otp_resend_count}/${resendLimit}): email=${email}, expiresAt=${user.otp_expiry}`);
        } catch (mailError) {
            logger.error(`Failed to resend OTP: ${mailError.message}, email=${email}`, { stack: mailError.stack });
            return res.status(500).json({ message: 'Failed to send OTP. Please try again later' });
        }

        res.status(200).json({ message: 'OTP successfully resent to email' });
    } catch (error) {
        logger.error(`resendOtp error: ${error}`, { stack: error.stack });
        res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const userRepository = getRepository(User);

        const { email } = req.body;
        logger.info(`POST /auth/request-password-reset accessed, email=${email}`);

        const expiresMinutes = parseInt(process.env.PASSWORD_RESET_OTP_EXPIRES_MINUTES, 10);
        const resendCooldown = parseInt(process.env.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS, 10);
        const resendLimit = parseInt(process.env.PASSWORD_RESET_RESEND_LIMIT_PER_WINDOW, 10);
        const resendWindowMinutes = parseInt(process.env.PASSWORD_RESET_RESEND_LIMIT_WINDOW_MINUTES, 10);

        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            logger.warn(`Password reset requested for unknown email: ${email}`);
            return res.status(404).json({ message: 'Email is not registered' });
        }

        if (user.password_reset_locked_until && new Date() < new Date(user.password_reset_locked_until)) {
            logger.warn(`Password reset requested but locked: email=${email}`);
            return res.status(429).json({ message: 'Too many attempts. Try again later' });
        }

        // Optional: handle resend cooldown (very simple)
        if (user.password_reset_expiry) {
            const secondsLeft = (new Date(user.password_reset_expiry).getTime() - Date.now()) / 1000;
            if (secondsLeft > (expiresMinutes * 60) - resendCooldown) {
                // Still in "recent OTP" window - avoid spamming email
                logger.info(`Password reset resend cooldown for email=${email}`);
                return res.status(200).json({ message: 'Reset code has been sent' });
            }
        }

        const now = new Date();
        if (user.password_reset_last_sent_at && (now - new Date(user.password_reset_last_sent_at)) > resendWindowMinutes * 60 * 1000) {
            user.password_reset_request_count = 0;
        }

        if (user.password_reset_request_count >= resendLimit) {
            logger.warn(`Password reset resend limit reached for email=${email}`);
            return res.status(429).json({ message: 'You have reached the password reset request limit' });
        }

        if (user.password_reset_last_sent_at && (now - new Date(user.password_reset_last_sent_at)) < resendCooldown * 1000) {
            const remaining = Math.ceil((resendCooldown * 1000 - (now - new Date(user.password_reset_last_sent_at))) / 1000);
            logger.info(`Password reset resend cooldown for email=${email}, remaining=${remaining}s`);
            return res.status(429).json({ message: `Wait ${remaining} seconds before requesting OTP again` });
        }

        const otp = generateNumericOtp(6);
        const hashedOtp = await hashOtp(otp);
        user.password_reset_otp = hashedOtp;
        user.password_reset_expiry = new Date(Date.now() + expiresMinutes * 60 * 1000);
        user.password_reset_attempts = 0;
        user.password_reset_locked_until = null;
        
        if (!user.password_reset_last_sent_at) {
            user.password_reset_request_count = 0;
        } else {
            user.password_reset_request_count += 1;
        }
        const currentRequestCount = user.password_reset_request_count;
        user.password_reset_last_sent_at = now;
        await userRepository.save(user);

        try {
            await sendPasswordReset(email, otp, expiresMinutes);
        } catch (mailErr) {
            logger.error(`Failed to send password reset email to ${email}: ${mailErr.message}`, { stack: mailErr.stack });
        }

        return res.status(200).json({ message: 'Reset code has been sent' });
    } catch (error) {
        logger.error(`requestPasswordReset error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.checkPasswordResetRequestStatus = async (req, res) => {
    try {
        const userRepository = getRepository(User);
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const hasActiveRequest = !!(user.password_reset_otp && user.password_reset_expiry);
        const isExpired = user.password_reset_expiry ? new Date() > new Date(user.password_reset_expiry) : true;

        return res.status(200).json({
            hasActiveRequest: hasActiveRequest,
            isExpired: isExpired
        });
    } catch (error) {
        logger.error(`checkPasswordResetRequestStatus error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.checkPasswordResetLockStatus = async (req, res) => {
    try {
        const userRepository = getRepository(User);
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const now = new Date();
        let isLocked = false;
        let remainingSeconds = 0;
        let lockType = null;

        if (user.password_reset_locked_until && now < new Date(user.password_reset_locked_until)) {
            isLocked = true;
            remainingSeconds = Math.ceil((new Date(user.password_reset_locked_until) - now) / 1000);
            lockType = 'password_reset_verify';
        }

        if (user.password_reset_locked_until && now >= new Date(user.password_reset_locked_until)) {
            user.password_reset_attempts = 0;
            user.password_reset_locked_until = null;
            await userRepository.save(user);
            logger.info(`Password reset lock period expired, reset attempts for email=${email}`);
        }

        return res.status(200).json({
            isLocked,
            remainingSeconds,
            lockType,
            attemptCount: user.password_reset_attempts || 0
        });
    } catch (error) {
        logger.error(`checkPasswordResetLockStatus error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.verifyPasswordResetOtp = async (req, res) => {
    try {
        const userRepository = getRepository(User);

        const { email, otp } = req.body;
        logger.info(`POST /auth/verify-password-reset-otp accessed, email=${email}`);

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const user = await userRepository.findOne({ where: { email } });
        if (!user || !user.password_reset_otp || !user.password_reset_expiry) {
            return res.status(400).json({ message: 'Invalid OTP or no reset request found' });
        }

        const maxAttempts = parseInt(process.env.PASSWORD_RESET_MAX_ATTEMPTS, 10);
        if (user.password_reset_locked_until && new Date() < new Date(user.password_reset_locked_until)) {
            return res.status(429).json({ message: 'Too many attempts. Try again later' });
        }

        if (user.password_reset_locked_until && new Date() >= new Date(user.password_reset_locked_until)) {
            user.password_reset_attempts = 0;
            user.password_reset_locked_until = null;
            await userRepository.save(user);
            logger.info(`Password reset lock period expired, reset attempts for email=${email}`);
        }

        const otpMatch = await compareOtp(otp, user.password_reset_otp);
        
        if (new Date() > new Date(user.password_reset_expiry)) {
            if (!otpMatch) {
                user.password_reset_attempts = (user.password_reset_attempts || 0) + 1;
                const remainingAttempts = maxAttempts - user.password_reset_attempts;

                if (user.password_reset_attempts >= maxAttempts) {
                    const lockMinutes = parseInt(process.env.PASSWORD_RESET_LOCK_MINUTES, 10);
                    user.password_reset_locked_until = new Date(Date.now() + lockMinutes * 60 * 1000);
                    await userRepository.save(user);
                    logger.warn(`User locked from password reset due to too many attempts: email=${email}`);
                    return res.status(429).json({
                        message: `Too many invalid OTP attempts. Try again in ${lockMinutes} minute(s).`,
                        remainingAttempts: 0,
                        attemptCount: user.password_reset_attempts,
                        maxAttempts: maxAttempts
                    });
                }

                await userRepository.save(user);
                return res.status(400).json({
                    message: 'Invalid OTP',
                    remainingAttempts: remainingAttempts,
                    attemptCount: user.password_reset_attempts,
                    maxAttempts: maxAttempts
                });
            }
            return res.status(400).json({ message: 'The OTP has expired' });
        }
        if (!otpMatch) {
            user.password_reset_attempts = (user.password_reset_attempts || 0) + 1;
            const remainingAttempts = maxAttempts - user.password_reset_attempts;

            if (user.password_reset_attempts >= maxAttempts) {
                const lockMinutes = parseInt(process.env.PASSWORD_RESET_LOCK_MINUTES, 10);
                user.password_reset_locked_until = new Date(Date.now() + lockMinutes * 60 * 1000);
                await userRepository.save(user);
                logger.warn(`User locked from password reset due to too many attempts: email=${email}`);
                return res.status(429).json({
                    message: `Too many invalid OTP attempts. Try again in ${lockMinutes} minute(s).`,
                    remainingAttempts: 0,
                    attemptCount: user.password_reset_attempts,
                    maxAttempts: maxAttempts
                });
            }

            await userRepository.save(user);
            return res.status(400).json({
                message: 'Invalid OTP',
                remainingAttempts: remainingAttempts,
                attemptCount: user.password_reset_attempts,
                maxAttempts: maxAttempts
            });
        }

        // OTP valid, reset attempts counter dan return success
        user.password_reset_attempts = 0;
        await userRepository.save(user);

        logger.info(`Password reset OTP verified successfully for email=${email}`);
        return res.status(200).json({ 
            message: 'OTP verified successfully. You can now set your new password.',
            otpVerified: true 
        });
    } catch (error) {
        logger.error(`verifyPasswordResetOtp error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const userRepository = getRepository(User);
        const userTokenRepository = getRepository(UserToken);

        const { email, newPassword } = req.body;
        logger.info(`POST /auth/reset-password accessed, email=${email}`);

        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and new password are required' });
        }

        const user = await userRepository.findOne({ where: { email } });
        if (!user || !user.password_reset_otp || !user.password_reset_expiry) {
            return res.status(400).json({ message: 'Invalid reset request or no OTP verification found' });
        }

        if (new Date() > new Date(user.password_reset_expiry)) {
            return res.status(400).json({ message: 'Reset session has expired. Please request a new OTP' });
        }

        // Cek apakah OTP sudah diverifikasi (password_reset_attempts = 0 menandakan OTP valid)
        if (user.password_reset_attempts > 0) {
            return res.status(400).json({ message: 'Please verify your OTP first before setting new password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.password_reset_otp = null;
        user.password_reset_expiry = null;
        user.password_reset_attempts = 0;
        user.password_reset_locked_until = null;
        await userRepository.save(user);

        try {
            await userTokenRepository.delete({ user: user.id });
            logger.info(`Invalidated user refresh tokens after password reset: userId=${user.id}`);
        } catch (err) {
            logger.error(`Failed to invalidate user tokens for userId=${user.id}: ${err}`);
        }

        const accessToken = req.headers.authorization?.split(' ')[1];
        if (accessToken) addToBlacklist(accessToken);

        logger.info(`Password reset successful for userId=${user.id}, email=${email}`);
        return res.status(200).json({ message: 'Your password has been reset successfully. Please log in with your new password' });
    } catch (error) {
        logger.error(`resetPassword error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'An internal error occurred' });
    }
};

exports.logout = async (req, res) => {
    try {
        const userTokenRepository = getRepository(UserToken);
        const adminTokenRepository = getRepository(AdminToken);

        const accessToken = req.headers.authorization?.split(' ')[1];
        if (accessToken) addToBlacklist(accessToken);

        const refreshToken = req.cookies?.[COOKIE_NAME];
        const role = req.user?.role || 'user';

        if (refreshToken) {
            if (role === 'admin') {
                await adminTokenRepository.delete({ refresh_token: refreshToken });
            } else {
                await userTokenRepository.delete({ refresh_token: refreshToken });
            }
        }

        return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        logger.error(`logout error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'An internal error occurred' });
    }
};
