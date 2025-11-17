const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { isBlacklisted } = require('../utils/tokenUtils');

/**
 * Optional authentication middleware
 * Does not block requests if token is missing, but adds user to request if token is valid
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // If no auth header, continue without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];

    // If token is blacklisted, continue without user
    if (isBlacklisted(token)) {
        logger.warn(`Blacklisted token used (optional auth), url=${req.originalUrl}`);
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        logger.debug(`Optional auth: Token verified: userId=${decoded.id}, url=${req.originalUrl}`);
    } catch (error) {
        // If token is invalid, continue without user (don't block request)
        logger.debug(`Optional auth: Invalid token (continuing without user), url=${req.originalUrl}`);
        req.user = null;
    }

    next();
};

module.exports = optionalAuth;

