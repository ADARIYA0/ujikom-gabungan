const logger = require('../utils/logger');

module.exports = function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role || !allowedRoles.includes(role)) {
            logger.warn(`Authorization failed: role=${role}, allowedRoles=${allowedRoles.join(',')}, userId=${req.user?.id}, url=${req.originalUrl}`);
            return res.status(403).json({ message: 'Forbidden: role tidak diizinkan' });
        }
        next();
    };
};
