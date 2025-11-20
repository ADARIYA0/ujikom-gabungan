const Admin = require('../entities/Auth/Admin');
const AdminToken = require('../entities/Auth/AdminToken');
const { generateTokens } = require('../utils/tokenUtils');
const { getRepository } = require('../utils/getRepository');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const ms = require('ms');

exports.registerAdmin = async (req, res) => {
    try {
        const adminRepository = getRepository(Admin);

        const { email, password } = req.body;
        logger.info(`POST /auth/admin/register accessed, email=${email}`);

        if (!email || !password) return res.status(400).json({ message: 'Email dan password diperlukan' });

        const existing = await adminRepository.findOne({ where: { email } });
        if (existing) return res.status(400).json({ message: 'Email sudah terdaftar' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = adminRepository.create({
            email,
            password: hashedPassword,
            status_akun: 'belum-aktif'
        });

        await adminRepository.save(newAdmin);

        res.status(201).json({ message: 'Admin berhasil dibuat', admin: { id: newAdmin.id, email: newAdmin.email } });
    } catch (error) {
        logger.error(`registerAdmin error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};

exports.loginAdmin = async (req, res) => {
    try {
        const adminRepository = getRepository(Admin);
        const adminTokenRepository = getRepository(AdminToken);

        // Support both 'identifier' (email or username) and 'email' for backward compatibility
        const { identifier, email, password } = req.body;
        const loginIdentifier = identifier || email;
        
        logger.info(`POST /auth/admin/login accessed, identifier=${loginIdentifier}`);

        if (!loginIdentifier || !password) {
            return res.status(400).json({ message: 'Email/Username dan password diperlukan' });
        }

        // Try to find admin by email (since Admin entity only has email field)
        // If identifier is provided, treat it as email
        const admin = await adminRepository
            .createQueryBuilder("admin")
            .addSelect("admin.password")
            .where("admin.email = :identifier", { identifier: loginIdentifier })
            .getOne();

        if (!admin) {
            logger.warn(`Login failed: admin not found, identifier=${loginIdentifier}`);
            return res.status(404).json({ message: 'Admin tidak ditemukan' });
        }

        /* if (admin.status_akun !== 'aktif') {
            logger.warn(`Login failed: admin not active, identifier=${loginIdentifier}`);
            return res.status(403).json({ message: 'Admin tidak aktif' });
        } */

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            logger.warn(`Login failed: wrong password, identifier=${loginIdentifier}`);
            return res.status(400).json({ message: 'Email/Username atau password salah' });
        }

        // Prepare admin object for token generation
        const adminForToken = {
            id: admin.id,
            email: admin.email,
            role: 'admin'
        };

        const { accessToken, refreshToken } = generateTokens(adminForToken);

        const adminToken = adminTokenRepository.create({
            admin,
            refresh_token: refreshToken,
            user_agent: req.headers['user-agent'] || null,
            ip_address: req.ip,
            created_at: new Date(),
            expires_at: new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES))
        });
        await adminTokenRepository.save(adminToken);

        logger.info(`Admin login successful: adminId=${admin.id}, email=${admin.email}`);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: "/api/auth/refresh-token",
            maxAge: ms(process.env.JWT_REFRESH_EXPIRES)
        });

        res.status(200).json({
            message: 'Login berhasil',
            accessToken
        });
    } catch (error) {
        const identifier = req.body.identifier || req.body.email || 'unknown';
        logger.error(`loginAdmin error for identifier=${identifier}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
    }
};
