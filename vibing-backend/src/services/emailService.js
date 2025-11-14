const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function verifyTransporter() {
  try {
    await transporter.verify();
    logger.info('Email transporter ready');
  } catch (error) {
    logger.error(`Email transporter verify failed: ${error}`);
    throw error;
  }
}

async function sendOtpEmail(to, otp, expiresMinutes = 15) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Verifikasi Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background-color: #fafafa;">
        <h2 style="text-align: center; color: #333;">Verifikasi Akun Anda</h2>
        <p style="font-size: 16px; color: #555;">
          Halo,<br><br>
          Terima kasih telah mendaftar di aplikasi kami. 
          Gunakan kode OTP berikut untuk menyelesaikan proses verifikasi akun Anda:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #00897B; letter-spacing: 5px;">
            ${otp}
          </span>
        </div>
        
        <p style="font-size: 16px; color: #555;">
          Kode ini berlaku selama <b>${expiresMinutes} menit</b>. 
          Jangan bagikan kode ini kepada siapapun demi keamanan akun Anda.
        </p>

        <p style="font-size: 14px; color: #888; margin-top: 30px;">
          Jika Anda tidak melakukan permintaan verifikasi email ini, abaikan email ini.
        </p>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />

        <p style="font-size: 12px; color: #aaa; text-align: center;">
          &copy; ${new Date().getFullYear()} PT Vibing Global Media. Semua Hak Dilindungi.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${to} (messageId=${info.messageId})`);
    return info;
  } catch (error) {
    logger.error(`Failed to send OTP email to ${to}: ${error}`);
    throw error;
  }
}

async function sendPasswordReset(to, otp, expiresMinutes = 10) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Reset Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background-color: #fafafa;">
        <h2 style="text-align: center; color: #333;">Reset Password Akun Anda</h2>
        <p style="font-size: 16px; color: #555;">
          Halo,<br><br>
          Anda meminta untuk mereset password akun Anda. 
          Gunakan kode OTP berikut untuk menyelesaikan proses reset password Anda:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #00897B; letter-spacing: 5px;">
            ${otp}
          </span>
        </div>
        
        <p style="font-size: 16px; color: #555;">
          Kode ini berlaku selama <b>${expiresMinutes} menit</b>. 
          Jangan bagikan kode ini kepada siapapun demi keamanan akun Anda.
        </p>

        <p style="font-size: 14px; color: #888; margin-top: 30px;">
          Jika Anda tidak melakukan permintaan reset password pada akun Anda, abaikan email ini.
        </p>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />

        <p style="font-size: 12px; color: #aaa; text-align: center;">
          &copy; ${new Date().getFullYear()} PT Vibing Global Media. Semua Hak Dilindungi.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`OTP password reset sent to ${to} (messageId=${info.messageId})`);
    return info;
  } catch (error) {
    logger.error(`Failed to send password reset email to ${to}: ${error}`);
    throw error;
  }
}

async function sendEventTokenEmail(to, token, eventTitle, expiresMinutes = 15) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Kode Daftar Hadir: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background-color: #fafafa;">
        <h2 style="text-align: center; color: #333;">Kode Daftar Hadir untuk Acara Anda</h2>
        <p style="font-size: 16px; color: #555;">
          Halo,<br><br>
          Terima kasih telah mendaftar untuk acara <b>"${eventTitle}"</b>. 
          Gunakan kode berikut untuk mengisi daftar hadir saat menghadiri acara tersebut:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #00897B; letter-spacing: 5px;">
            ${token}
          </span>
        </div>

        <p style="font-size: 16px; color: #555;">
          Kode ini berlaku selama <b>${expiresMinutes} menit</b>. 
          Jangan bagikan kode ini kepada siapapun demi keamanan data kehadiran Anda.
        </p>

        <p style="font-size: 14px; color: #888; margin-top: 30px;">
          Jika Anda tidak melakukan pendaftaran acara ini, abaikan email ini.
        </p>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />

        <p style="font-size: 12px; color: #aaa; text-align: center;">
          &copy; ${new Date().getFullYear()} PT Vibing Global Media. Semua Hak Dilindungi.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Event token email sent to ${to} (messageId=${info.messageId})`);
    return info;
  } catch (error) {
    logger.error(`Failed to send event token email to ${to}: ${error}`);
    throw error;
  }
}

module.exports = { verifyTransporter, sendOtpEmail, sendPasswordReset, sendEventTokenEmail };
