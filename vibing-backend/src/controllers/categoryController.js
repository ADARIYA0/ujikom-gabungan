const { AppDataSource } = require('../config/database');
const logger = require('../utils/logger');
const categoryRepo = () => AppDataSource.getRepository('EventCategory');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await categoryRepo().find();
        const baseUrl = process.env.APP_BASE_URL
            ? `${process.env.APP_BASE_URL}/uploads/categories/`
            : `${req.protocol}://${req.get('host')}/uploads/categories/`;

        const data = categories.map(cat => ({
            id: cat.id,
            nama_kategori: cat.nama_kategori,
            slug: cat.slug,
            kategori_logo: cat.kategori_logo,
            kategori_logo_url: cat.kategori_logo ? (baseUrl + cat.kategori_logo) : null,
            created_at: cat.created_at,
            updated_at: cat.updated_at
        }));

        logger.info(`Categories retrieved: count=${data.length}`);
        return res.json({ data });
    } catch (error) {
        logger.error('getAllCategories error', { message: error, stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};
