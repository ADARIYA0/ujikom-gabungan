const { AppDataSource } = require('../config/database');
const logger = require('./logger');

/**
 * Lazy getter untuk repository TypeORM.
 * Pastikan DataSource sudah diinisialisasi.
 * @param {EntityClass} entityClass
 * @returns {Repository}
 */
function getRepository(entityClass) {
    if (!AppDataSource.isInitialized) {
        throw new Error(`DataSource belum diinisialisasi. Panggil connectDB() dulu.`);
    }

    if (!entityClass) {
        const error = new Error('Entity class tidak boleh undefined atau null');
        logger.error(`Gagal mendapatkan repository: ${error.message}`);
        throw error;
    }

    try {
        // Support both entity class and entity name string
        const entityName = typeof entityClass === 'string' ? entityClass : (entityClass.name || entityClass.options?.name);
        return AppDataSource.getRepository(entityClass);
    } catch (error) {
        const entityName = typeof entityClass === 'string' ? entityClass : (entityClass?.name || 'unknown');
        logger.error(`Gagal mendapatkan repository untuk ${entityName}: ${error.message}`, { 
            stack: error.stack,
            entityClass: entityClass?.name || entityClass 
        });
        throw error;
    }
}

module.exports = { getRepository };
