const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('./logger');
const ms = require('ms');

const generateAlphanumeric = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Generate random bytes
    const bytes = crypto.randomBytes(length);
    
    // Map each byte to a character from our charset
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }
    
    return result;
};

const hashToken = async (token) => {
    const rounds = parseInt(process.env.OTP_BCRYPT_ROUNDS || '12', 10);
    return await bcrypt.hash(token, rounds);
};

const compareToken = async (token, hash) => {
    return await bcrypt.compare(token, hash);
};

function generateTokens(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role || 'user'
    };

    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES }
    );

    const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );

    logger.debug(`Generated tokens for userId=${user.id}, email=${user.email}, role=${user.role}`);
    return { accessToken, refreshToken };
}

function getRefreshExpiryDate() {
    return new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES));
}

let blacklist = [];
function addToBlacklist(token) {
    blacklist.push(token);
}

function isBlacklisted(token) {
    return blacklist.includes(token);
}

module.exports = {
    generateAlphanumeric,
    hashToken,
    compareToken,
    addToBlacklist,
    generateTokens,
    getRefreshExpiryDate,
    isBlacklisted
};
