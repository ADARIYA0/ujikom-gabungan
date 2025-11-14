const bcrypt = require('bcryptjs');

function generateNumericOtp(digits = 6) {
    const min = 10 ** (digits - 1);
    const max = 10 ** digits - 1;
    return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
}

async function hashOtp(otp) {
    const saltRounds = parseInt(process.env.OTP_BCRYPT_ROUNDS, 10);
    return await bcrypt.hash(otp, saltRounds);
}

async function compareOtp(otp, hashed) {
    return await bcrypt.compare(otp, hashed);
}

module.exports = { generateNumericOtp, hashOtp, compareOtp };
