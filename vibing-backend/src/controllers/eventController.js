const { AppDataSource } = require('../config/database');
const { cleanupFiles, renameUploadedFileToSlug } = require('../utils/fileHelper');
const { generateAlphanumeric, hashToken, compareToken } = require('../utils/tokenUtils');
const { sendEventTokenEmail } = require('../services/emailService');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths } = require('date-fns');
const logger = require('../utils/logger');
const path = require('path');
const slugify = require('slugify');

const attendanceRepo = () => AppDataSource.getRepository('Attendance');
const categoryRepo = () => AppDataSource.getRepository('EventCategory');
const eventRepo = () => AppDataSource.getRepository('Event');

exports.getAllEvent = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const offset = (page - 1) * limit;

        logger.info(`GET /event?page=${page}&limit=${limit} accessed`);

        const qb = eventRepo().createQueryBuilder('kegiatan')
            .leftJoinAndSelect('kegiatan.category', 'category')
            .orderBy('kegiatan.waktu_mulai', 'ASC');

        if (req.query.category) {
            qb.andWhere('category.slug = :slug', { slug: req.query.category });
        }

        if (req.query.search) {
            qb.andWhere('(kegiatan.judul_kegiatan LIKE :q OR kegiatan.deskripsi_kegiatan LIKE :q)', { q: `%${req.query.search}%` });
        }

        if (req.query.upcoming === 'true') {
            qb.andWhere('kegiatan.waktu_berakhir >= :now', { now: new Date() });
        }

        if (req.query.time_range) {
            const now = new Date();

            switch (req.query.time_range) {
                case 'today':
                    qb.andWhere('DATE(kegiatan.waktu_mulai) = CURDATE()');
                    break;
                case 'this_week':
                    qb.andWhere('kegiatan.waktu_mulai BETWEEN :start AND :end', {
                        start: startOfWeek(now, { weekStartsOn: 1 }),
                        end: endOfWeek(now, { weekStartsOn: 1 })
                    });
                    break;
                case 'this_month':
                    qb.andWhere('kegiatan.waktu_mulai BETWEEN :start AND :end', {
                        start: startOfMonth(now),
                        end: endOfMonth(now)
                    });
                    break;
                case 'next_month':
                    qb.andWhere('kegiatan.waktu_mulai BETWEEN :start AND :end', {
                        start: startOfMonth(addMonths(now, 1)),
                        end: endOfMonth(addMonths(now, 1))
                    });
                    break;
                default:
                    logger.warn(`Unknown time_range filter: ${req.query.time_range}`);
            }
        }

        const [items, total] = await qb.skip(offset).take(limit).getManyAndCount();
        const userId = req.user?.id || null;

        const events = await Promise.all(items.map(async ev => {
            const count = await attendanceRepo().createQueryBuilder('d')
                .where('d.event = :id', { id: ev.id })
                .getCount();

            const is_full = (ev.kapasitas_peserta > 0) && (count >= ev.kapasitas_peserta);

            // Check if user is registered for this event
            // For paid events, user is only considered registered if payment is paid
            let is_registered = false;
            let attendance_status = null;
            if (userId) {
                const isPaidEvent = Number(ev.harga) > 0;
                
                if (isPaidEvent) {
                    const userAttendance = await attendanceRepo()
                        .createQueryBuilder('d')
                        .leftJoin('d.payment', 'payment')
                        .addSelect([
                            'payment.id',
                            'payment.status',
                            'payment.amount',
                            'payment.paid_at'
                        ])
                        .where('d.event = :eventId', { eventId: ev.id })
                        .andWhere('d.user = :userId', { userId })
                        .getOne();
                    
                    if (userAttendance) {
                        // Only consider registered if payment exists and is paid
                        if (userAttendance.payment && userAttendance.payment.status === 'paid') {
                            is_registered = true;
                            attendance_status = userAttendance.status_absen;
                        }
                        // If payment is pending, user is not considered registered yet
                    }
                } else {
                    // For free events, just check if attendance exists
                    const userAttendance = await attendanceRepo().createQueryBuilder('d')
                        .where('d.event = :eventId', { eventId: ev.id })
                        .andWhere('d.user = :userId', { userId })
                        .getOne();
                    
                    if (userAttendance) {
                        is_registered = true;
                        attendance_status = userAttendance.status_absen;
                    }
                }
            }

            return {
                id: ev.id,
                judul_kegiatan: ev.judul_kegiatan,
                slug: ev.slug,
                deskripsi_kegiatan: ev.deskripsi_kegiatan,
                lokasi_kegiatan: ev.lokasi_kegiatan,
                flyer_kegiatan: ev.flyer_kegiatan,
                sertifikat_kegiatan: ev.sertifikat_kegiatan,
                kapasitas_peserta: ev.kapasitas_peserta,
                harga: ev.harga,
                waktu_mulai: ev.waktu_mulai,
                waktu_berakhir: ev.waktu_berakhir,
                kategori: ev.category
                    ? {
                        id: ev.category.id,
                        nama_kategori: ev.category.nama_kategori,
                        slug: ev.category.slug
                    }
                    : null,
                attendee_count: count,
                is_full,
                is_registered,
                attendance_status
            };
        }));

        logger.info(`Events retrieved: count=${events.length}, total=${total}`);
        return res.json({ meta: { page, limit, total }, data: events });
    } catch (error) {
        logger.error(`getAllEvent error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        const meta = {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            eventId,
            files: Object.keys(req.files || {})
        };
        logger.info('PUT /event/:id update request', meta);

        const existingEvent = await eventRepo().findOne({ where: { id: eventId } });
        if (!existingEvent) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        const {
            judul_kegiatan,
            slug: providedSlug,
            deskripsi_kegiatan,
            lokasi_kegiatan,
            kapasitas_peserta,
            harga,
            waktu_mulai,
            waktu_berakhir,
            kategori_id,
            kategori_slug
        } = req.body;

        let category = null;
        if (kategori_id) {
            category = await categoryRepo().findOne({ where: { id: parseInt(kategori_id, 10) } });
            if (!category) {
                logger.warn('Kategori tidak ditemukan saat update event', { kategori_id });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        } else if (kategori_slug) {
            category = await categoryRepo().findOne({ where: { slug: kategori_slug } });
            if (!category) {
                logger.warn('Kategori slug tidak ditemukan saat update event', { kategori_slug });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        }

        // Check for duplicate title at same date (excluding current event)
        if (judul_kegiatan && waktu_mulai) {
            const title = judul_kegiatan.trim();
            const startDate = new Date(waktu_mulai);
            const existing = await eventRepo()
                .createQueryBuilder('e')
                .where('LOWER(e.judul_kegiatan) = LOWER(:title)', { title })
                .andWhere('DATE(e.waktu_mulai) = DATE(:start)', { start: startDate })
                .andWhere('e.id != :eventId', { eventId })
                .getOne();

            if (existing) {
                logger.warn('Duplicate event title at same date detected', { title, start: startDate });
                return res.status(409).json({ message: 'Event dengan judul yang sama pada tanggal tersebut sudah ada' });
            }
        }

        let eventSlug = providedSlug ? slugify(providedSlug, { lower: true, strict: true }) :
            (judul_kegiatan ? slugify(judul_kegiatan, { lower: true, strict: true }) : existingEvent.slug);

        // Make sure slug is unique (append counter if necessary)
        let counter = 0;
        let exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        while (exists && exists.id !== eventId) {
            counter += 1;
            eventSlug = `${eventSlug}-${counter}`;
            exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        }

        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const flyerFile = req.files?.flyer_kegiatan?.[0] || null;
        const sertifikatFile = req.files?.sertifikat_kegiatan?.[0] || null;

        let flyer = existingEvent.flyer_kegiatan;
        let sertifikat = existingEvent.sertifikat_kegiatan;

        try {
            if (flyerFile) {
                // Delete old flyer if exists
                if (existingEvent.flyer_kegiatan) {
                    const oldFlyerPath = path.join(uploadBase, 'flyer', existingEvent.flyer_kegiatan);
                    cleanupFiles([oldFlyerPath]);
                }
                const res = await renameUploadedFileToSlug(flyerFile, path.join(uploadBase, 'flyer'), `${eventSlug}-flyer`);
                flyer = res.filename;
            }
            if (sertifikatFile) {
                // Delete old certificate if exists
                if (existingEvent.sertifikat_kegiatan) {
                    const oldCertPath = path.join(uploadBase, 'certificates', existingEvent.sertifikat_kegiatan);
                    cleanupFiles([oldCertPath]);
                }
                const res = await renameUploadedFileToSlug(sertifikatFile, path.join(uploadBase, 'certificates'), `${eventSlug}-certificate`);
                sertifikat = res.filename;
            }
        } catch (err) {
            const filePathsToCleanup = [
                flyerFile?.path,
                sertifikatFile?.path
            ].filter(Boolean);
            cleanupFiles(filePathsToCleanup);
            logger.error('File rename to slug failed', { error: err.message, stack: err.stack });
            return res.status(500).json({ message: 'Failed to process uploaded files' });
        }

        const updateData = {
            ...(judul_kegiatan && { judul_kegiatan }),
            ...(eventSlug && { slug: eventSlug }),
            ...(deskripsi_kegiatan && { deskripsi_kegiatan }),
            ...(lokasi_kegiatan && { lokasi_kegiatan }),
            ...(flyer !== undefined && { flyer_kegiatan: flyer }),
            ...(sertifikat !== undefined && { sertifikat_kegiatan: sertifikat }),
            ...(kapasitas_peserta !== undefined && { kapasitas_peserta: parseInt(kapasitas_peserta, 10) }),
            ...(harga !== undefined && { harga: parseFloat(harga) }),
            ...(waktu_mulai && { waktu_mulai: new Date(waktu_mulai) }),
            ...(waktu_berakhir && { waktu_berakhir: new Date(waktu_berakhir) }),
            ...(category && { category: { id: category.id } })
        };

        const updated = await AppDataSource.manager.transaction(async (manager) => {
            const repo = manager.getRepository('Event');
            await repo.update(eventId, updateData);
            return await repo.findOne({ 
                where: { id: eventId },
                relations: ['category']
            });
        });

        logger.info('Event updated', { id: updated.id, slug: updated.slug });
        return res.status(200).json({
            message: 'Event updated',
            data: {
                id: updated.id,
                judul_kegiatan: updated.judul_kegiatan,
                slug: updated.slug,
                waktu_mulai: updated.waktu_mulai,
                waktu_berakhir: updated.waktu_berakhir
            }
        });
    } catch (error) {
        const toCleanup = [];
        toCleanup.push(req.files?.flyer_kegiatan?.[0]?.path);
        toCleanup.push(req.files?.sertifikat_kegiatan?.[0]?.path);
        cleanupFiles(toCleanup.filter(Boolean));

        logger.error('updateEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        logger.info('DELETE /event/:id delete request', { eventId, ip: req.ip });

        const event = await eventRepo().findOne({ where: { id: eventId } });
        if (!event) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        // Check if event has any attendance records
        const attendanceCount = await attendanceRepo().count({ where: { event: { id: eventId } } });
        if (attendanceCount > 0) {
            return res.status(409).json({ 
                message: `Event tidak dapat dihapus karena sudah memiliki ${attendanceCount} peserta terdaftar` 
            });
        }

        // Delete associated files
        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const filesToDelete = [];
        
        if (event.flyer_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'flyer', event.flyer_kegiatan));
        }
        if (event.sertifikat_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'certificates', event.sertifikat_kegiatan));
        }
        
        cleanupFiles(filesToDelete);

        // Delete event
        await eventRepo().delete(eventId);

        logger.info('Event deleted', { id: eventId, slug: event.slug });
        return res.status(200).json({
            message: 'Event berhasil dihapus',
            data: {
                id: eventId
            }
        });
    } catch (error) {
        logger.error('deleteEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getEventBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        logger.info(`GET /event/slug/${slug} accessed`);

        const ev = await eventRepo().findOne({
            where: { slug },
            relations: ['category']
        });

        if (!ev) {
            logger.warn(`Event not found: slug=${slug}`);
            return res.status(404).json({ message: 'Event not found' });
        }

        const attendeeCount = await attendanceRepo().createQueryBuilder('d')
            .where('d.kegiatan_id = :id', { id: ev.id })
            .getCount();

        // Check if user is registered for this event
        // For paid events, user is only considered registered if payment is paid
        const userId = req.user?.id || null;
        let is_registered = false;
        let attendance_status = null;
        if (userId) {
            const isPaidEvent = Number(ev.harga) > 0;
            
            if (isPaidEvent) {
                // For paid events, check attendance with payment status
                const userAttendance = await attendanceRepo()
                    .createQueryBuilder('d')
                    .leftJoin('d.payment', 'payment')
                    .addSelect([
                        'payment.id',
                        'payment.status',
                        'payment.amount',
                        'payment.paid_at'
                    ])
                    .where('d.event = :eventId', { eventId: ev.id })
                    .andWhere('d.user = :userId', { userId })
                    .getOne();
                
                if (userAttendance) {
                    // Only consider registered if payment exists and is paid
                    if (userAttendance.payment && userAttendance.payment.status === 'paid') {
                        is_registered = true;
                        attendance_status = userAttendance.status_absen;
                    }
                    // If payment is pending, user is not considered registered yet
                }
            } else {
                // For free events, just check if attendance exists
                const userAttendance = await attendanceRepo().createQueryBuilder('d')
                    .where('d.event = :eventId', { eventId: ev.id })
                    .andWhere('d.user = :userId', { userId })
                    .getOne();
                
                if (userAttendance) {
                    is_registered = true;
                    attendance_status = userAttendance.status_absen;
                }
            }
        }

        const response = {
            id: ev.id,
            judul_kegiatan: ev.judul_kegiatan,
            slug: ev.slug,
            deskripsi_kegiatan: ev.deskripsi_kegiatan,
            lokasi_kegiatan: ev.lokasi_kegiatan,
            flyer_kegiatan: ev.flyer_kegiatan,
            sertifikat_kegiatan: ev.sertifikat_kegiatan,
            kapasitas_peserta: ev.kapasitas_peserta,
            harga: ev.harga,
            waktu_mulai: ev.waktu_mulai,
            waktu_berakhir: ev.waktu_berakhir,
            kategori: ev.category
                ? {
                    id: ev.category.id,
                    nama_kategori: ev.category.nama_kategori,
                    slug: ev.category.slug
                }
                : null,
            attendee_count: attendeeCount,
            is_full: (ev.kapasitas_peserta > 0) && (attendeeCount >= ev.kapasitas_peserta),
            is_registered,
            attendance_status
        };

        logger.info(`Event retrieved successfully: slug=${slug}`);
        return res.json(response);
    } catch (error) {
        logger.error(`getEventBySlug error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        const meta = {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            eventId,
            files: Object.keys(req.files || {})
        };
        logger.info('PUT /event/:id update request', meta);

        const existingEvent = await eventRepo().findOne({ where: { id: eventId } });
        if (!existingEvent) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        const {
            judul_kegiatan,
            slug: providedSlug,
            deskripsi_kegiatan,
            lokasi_kegiatan,
            kapasitas_peserta,
            harga,
            waktu_mulai,
            waktu_berakhir,
            kategori_id,
            kategori_slug
        } = req.body;

        let category = null;
        if (kategori_id) {
            category = await categoryRepo().findOne({ where: { id: parseInt(kategori_id, 10) } });
            if (!category) {
                logger.warn('Kategori tidak ditemukan saat update event', { kategori_id });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        } else if (kategori_slug) {
            category = await categoryRepo().findOne({ where: { slug: kategori_slug } });
            if (!category) {
                logger.warn('Kategori slug tidak ditemukan saat update event', { kategori_slug });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        }

        // Check for duplicate title at same date (excluding current event)
        if (judul_kegiatan && waktu_mulai) {
            const title = judul_kegiatan.trim();
            const startDate = new Date(waktu_mulai);
            const existing = await eventRepo()
                .createQueryBuilder('e')
                .where('LOWER(e.judul_kegiatan) = LOWER(:title)', { title })
                .andWhere('DATE(e.waktu_mulai) = DATE(:start)', { start: startDate })
                .andWhere('e.id != :eventId', { eventId })
                .getOne();

            if (existing) {
                logger.warn('Duplicate event title at same date detected', { title, start: startDate });
                return res.status(409).json({ message: 'Event dengan judul yang sama pada tanggal tersebut sudah ada' });
            }
        }

        let eventSlug = providedSlug ? slugify(providedSlug, { lower: true, strict: true }) :
            (judul_kegiatan ? slugify(judul_kegiatan, { lower: true, strict: true }) : existingEvent.slug);

        // Make sure slug is unique (append counter if necessary)
        let counter = 0;
        let exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        while (exists && exists.id !== eventId) {
            counter += 1;
            eventSlug = `${eventSlug}-${counter}`;
            exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        }

        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const flyerFile = req.files?.flyer_kegiatan?.[0] || null;
        const sertifikatFile = req.files?.sertifikat_kegiatan?.[0] || null;

        let flyer = existingEvent.flyer_kegiatan;
        let sertifikat = existingEvent.sertifikat_kegiatan;

        try {
            if (flyerFile) {
                // Delete old flyer if exists
                if (existingEvent.flyer_kegiatan) {
                    const oldFlyerPath = path.join(uploadBase, 'flyer', existingEvent.flyer_kegiatan);
                    cleanupFiles([oldFlyerPath]);
                }
                const res = await renameUploadedFileToSlug(flyerFile, path.join(uploadBase, 'flyer'), `${eventSlug}-flyer`);
                flyer = res.filename;
            }
            if (sertifikatFile) {
                // Delete old certificate if exists
                if (existingEvent.sertifikat_kegiatan) {
                    const oldCertPath = path.join(uploadBase, 'certificates', existingEvent.sertifikat_kegiatan);
                    cleanupFiles([oldCertPath]);
                }
                const res = await renameUploadedFileToSlug(sertifikatFile, path.join(uploadBase, 'certificates'), `${eventSlug}-certificate`);
                sertifikat = res.filename;
            }
        } catch (err) {
            const filePathsToCleanup = [
                flyerFile?.path,
                sertifikatFile?.path
            ].filter(Boolean);
            cleanupFiles(filePathsToCleanup);
            logger.error('File rename to slug failed', { error: err.message, stack: err.stack });
            return res.status(500).json({ message: 'Failed to process uploaded files' });
        }

        const updateData = {
            ...(judul_kegiatan && { judul_kegiatan }),
            ...(eventSlug && { slug: eventSlug }),
            ...(deskripsi_kegiatan && { deskripsi_kegiatan }),
            ...(lokasi_kegiatan && { lokasi_kegiatan }),
            ...(flyer !== undefined && { flyer_kegiatan: flyer }),
            ...(sertifikat !== undefined && { sertifikat_kegiatan: sertifikat }),
            ...(kapasitas_peserta !== undefined && { kapasitas_peserta: parseInt(kapasitas_peserta, 10) }),
            ...(harga !== undefined && { harga: parseFloat(harga) }),
            ...(waktu_mulai && { waktu_mulai: new Date(waktu_mulai) }),
            ...(waktu_berakhir && { waktu_berakhir: new Date(waktu_berakhir) }),
            ...(category && { category: { id: category.id } })
        };

        const updated = await AppDataSource.manager.transaction(async (manager) => {
            const repo = manager.getRepository('Event');
            await repo.update(eventId, updateData);
            return await repo.findOne({ 
                where: { id: eventId },
                relations: ['category']
            });
        });

        logger.info('Event updated', { id: updated.id, slug: updated.slug });
        return res.status(200).json({
            message: 'Event updated',
            data: {
                id: updated.id,
                judul_kegiatan: updated.judul_kegiatan,
                slug: updated.slug,
                waktu_mulai: updated.waktu_mulai,
                waktu_berakhir: updated.waktu_berakhir
            }
        });
    } catch (error) {
        const toCleanup = [];
        toCleanup.push(req.files?.flyer_kegiatan?.[0]?.path);
        toCleanup.push(req.files?.sertifikat_kegiatan?.[0]?.path);
        cleanupFiles(toCleanup.filter(Boolean));

        logger.error('updateEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        logger.info('DELETE /event/:id delete request', { eventId, ip: req.ip });

        const event = await eventRepo().findOne({ where: { id: eventId } });
        if (!event) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        // Check if event has any attendance records
        const attendanceCount = await attendanceRepo().count({ where: { event: { id: eventId } } });
        if (attendanceCount > 0) {
            return res.status(409).json({ 
                message: `Event tidak dapat dihapus karena sudah memiliki ${attendanceCount} peserta terdaftar` 
            });
        }

        // Delete associated files
        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const filesToDelete = [];
        
        if (event.flyer_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'flyer', event.flyer_kegiatan));
        }
        if (event.sertifikat_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'certificates', event.sertifikat_kegiatan));
        }
        
        cleanupFiles(filesToDelete);

        // Delete event
        await eventRepo().delete(eventId);

        logger.info('Event deleted', { id: eventId, slug: event.slug });
        return res.status(200).json({
            message: 'Event berhasil dihapus',
            data: {
                id: eventId
            }
        });
    } catch (error) {
        logger.error('deleteEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        logger.info(`GET /event/${id} accessed`);

        const ev = await eventRepo().findOne({
            where: { id },
            relations: ['category']
        });

        if (!ev) {
            logger.warn(`Event not found: id=${id}`);
            return res.status(404).json({ message: 'Event not found' });
        }

        const attendeeCount = await attendanceRepo().createQueryBuilder('d')
            .where('d.kegiatan_id = :id', { id })
            .getCount();

        // Check if user is registered for this event
        // For paid events, user is only considered registered if payment is paid
        const userId = req.user?.id || null;
        let is_registered = false;
        let attendance_status = null;
        if (userId) {
            const isPaidEvent = Number(ev.harga) > 0;
            
            if (isPaidEvent) {
                // For paid events, check attendance with payment status
                const userAttendance = await attendanceRepo()
                    .createQueryBuilder('d')
                    .leftJoin('d.payment', 'payment')
                    .addSelect([
                        'payment.id',
                        'payment.status',
                        'payment.amount',
                        'payment.paid_at'
                    ])
                    .where('d.event = :eventId', { eventId: ev.id })
                    .andWhere('d.user = :userId', { userId })
                    .getOne();
                
                if (userAttendance) {
                    // Only consider registered if payment exists and is paid
                    if (userAttendance.payment && userAttendance.payment.status === 'paid') {
                        is_registered = true;
                        attendance_status = userAttendance.status_absen;
                    }
                    // If payment is pending, user is not considered registered yet
                }
            } else {
                // For free events, just check if attendance exists
                const userAttendance = await attendanceRepo().createQueryBuilder('d')
                    .where('d.event = :eventId', { eventId: ev.id })
                    .andWhere('d.user = :userId', { userId })
                    .getOne();
                
                if (userAttendance) {
                    is_registered = true;
                    attendance_status = userAttendance.status_absen;
                }
            }
        }

        const response = {
            id: ev.id,
            judul_kegiatan: ev.judul_kegiatan,
            slug: ev.slug,
            deskripsi_kegiatan: ev.deskripsi_kegiatan,
            lokasi_kegiatan: ev.lokasi_kegiatan,
            flyer_kegiatan: ev.flyer_kegiatan,
            sertifikat_kegiatan: ev.sertifikat_kegiatan,
            kapasitas_peserta: ev.kapasitas_peserta,
            harga: ev.harga,
            waktu_mulai: ev.waktu_mulai,
            waktu_berakhir: ev.waktu_berakhir,
            kategori: ev.category
                ? {
                    id: ev.category.id,
                    nama_kategori: ev.category.nama_kategori
                }
                : null,
            attendee_count: attendeeCount,
            is_full: (ev.kapasitas_peserta > 0) && (attendeeCount >= ev.kapasitas_peserta),
            is_registered,
            attendance_status
        };

        logger.info(`Event retrieved successfully: id=${id}`);
        return res.json(response);
    } catch (error) {
        logger.error(`getEventById error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        const meta = {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            eventId,
            files: Object.keys(req.files || {})
        };
        logger.info('PUT /event/:id update request', meta);

        const existingEvent = await eventRepo().findOne({ where: { id: eventId } });
        if (!existingEvent) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        const {
            judul_kegiatan,
            slug: providedSlug,
            deskripsi_kegiatan,
            lokasi_kegiatan,
            kapasitas_peserta,
            harga,
            waktu_mulai,
            waktu_berakhir,
            kategori_id,
            kategori_slug
        } = req.body;

        let category = null;
        if (kategori_id) {
            category = await categoryRepo().findOne({ where: { id: parseInt(kategori_id, 10) } });
            if (!category) {
                logger.warn('Kategori tidak ditemukan saat update event', { kategori_id });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        } else if (kategori_slug) {
            category = await categoryRepo().findOne({ where: { slug: kategori_slug } });
            if (!category) {
                logger.warn('Kategori slug tidak ditemukan saat update event', { kategori_slug });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        }

        // Check for duplicate title at same date (excluding current event)
        if (judul_kegiatan && waktu_mulai) {
            const title = judul_kegiatan.trim();
            const startDate = new Date(waktu_mulai);
            const existing = await eventRepo()
                .createQueryBuilder('e')
                .where('LOWER(e.judul_kegiatan) = LOWER(:title)', { title })
                .andWhere('DATE(e.waktu_mulai) = DATE(:start)', { start: startDate })
                .andWhere('e.id != :eventId', { eventId })
                .getOne();

            if (existing) {
                logger.warn('Duplicate event title at same date detected', { title, start: startDate });
                return res.status(409).json({ message: 'Event dengan judul yang sama pada tanggal tersebut sudah ada' });
            }
        }

        let eventSlug = providedSlug ? slugify(providedSlug, { lower: true, strict: true }) :
            (judul_kegiatan ? slugify(judul_kegiatan, { lower: true, strict: true }) : existingEvent.slug);

        // Make sure slug is unique (append counter if necessary)
        let counter = 0;
        let exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        while (exists && exists.id !== eventId) {
            counter += 1;
            eventSlug = `${eventSlug}-${counter}`;
            exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        }

        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const flyerFile = req.files?.flyer_kegiatan?.[0] || null;
        const sertifikatFile = req.files?.sertifikat_kegiatan?.[0] || null;

        let flyer = existingEvent.flyer_kegiatan;
        let sertifikat = existingEvent.sertifikat_kegiatan;

        try {
            if (flyerFile) {
                // Delete old flyer if exists
                if (existingEvent.flyer_kegiatan) {
                    const oldFlyerPath = path.join(uploadBase, 'flyer', existingEvent.flyer_kegiatan);
                    cleanupFiles([oldFlyerPath]);
                }
                const res = await renameUploadedFileToSlug(flyerFile, path.join(uploadBase, 'flyer'), `${eventSlug}-flyer`);
                flyer = res.filename;
            }
            if (sertifikatFile) {
                // Delete old certificate if exists
                if (existingEvent.sertifikat_kegiatan) {
                    const oldCertPath = path.join(uploadBase, 'certificates', existingEvent.sertifikat_kegiatan);
                    cleanupFiles([oldCertPath]);
                }
                const res = await renameUploadedFileToSlug(sertifikatFile, path.join(uploadBase, 'certificates'), `${eventSlug}-certificate`);
                sertifikat = res.filename;
            }
        } catch (err) {
            const filePathsToCleanup = [
                flyerFile?.path,
                sertifikatFile?.path
            ].filter(Boolean);
            cleanupFiles(filePathsToCleanup);
            logger.error('File rename to slug failed', { error: err.message, stack: err.stack });
            return res.status(500).json({ message: 'Failed to process uploaded files' });
        }

        const updateData = {
            ...(judul_kegiatan && { judul_kegiatan }),
            ...(eventSlug && { slug: eventSlug }),
            ...(deskripsi_kegiatan && { deskripsi_kegiatan }),
            ...(lokasi_kegiatan && { lokasi_kegiatan }),
            ...(flyer !== undefined && { flyer_kegiatan: flyer }),
            ...(sertifikat !== undefined && { sertifikat_kegiatan: sertifikat }),
            ...(kapasitas_peserta !== undefined && { kapasitas_peserta: parseInt(kapasitas_peserta, 10) }),
            ...(harga !== undefined && { harga: parseFloat(harga) }),
            ...(waktu_mulai && { waktu_mulai: new Date(waktu_mulai) }),
            ...(waktu_berakhir && { waktu_berakhir: new Date(waktu_berakhir) }),
            ...(category && { category: { id: category.id } })
        };

        const updated = await AppDataSource.manager.transaction(async (manager) => {
            const repo = manager.getRepository('Event');
            await repo.update(eventId, updateData);
            return await repo.findOne({ 
                where: { id: eventId },
                relations: ['category']
            });
        });

        logger.info('Event updated', { id: updated.id, slug: updated.slug });
        return res.status(200).json({
            message: 'Event updated',
            data: {
                id: updated.id,
                judul_kegiatan: updated.judul_kegiatan,
                slug: updated.slug,
                waktu_mulai: updated.waktu_mulai,
                waktu_berakhir: updated.waktu_berakhir
            }
        });
    } catch (error) {
        const toCleanup = [];
        toCleanup.push(req.files?.flyer_kegiatan?.[0]?.path);
        toCleanup.push(req.files?.sertifikat_kegiatan?.[0]?.path);
        cleanupFiles(toCleanup.filter(Boolean));

        logger.error('updateEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        logger.info('DELETE /event/:id delete request', { eventId, ip: req.ip });

        const event = await eventRepo().findOne({ where: { id: eventId } });
        if (!event) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        // Check if event has any attendance records
        const attendanceCount = await attendanceRepo().count({ where: { event: { id: eventId } } });
        if (attendanceCount > 0) {
            return res.status(409).json({ 
                message: `Event tidak dapat dihapus karena sudah memiliki ${attendanceCount} peserta terdaftar` 
            });
        }

        // Delete associated files
        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const filesToDelete = [];
        
        if (event.flyer_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'flyer', event.flyer_kegiatan));
        }
        if (event.sertifikat_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'certificates', event.sertifikat_kegiatan));
        }
        
        cleanupFiles(filesToDelete);

        // Delete event
        await eventRepo().delete(eventId);

        logger.info('Event deleted', { id: eventId, slug: event.slug });
        return res.status(200).json({
            message: 'Event berhasil dihapus',
            data: {
                id: eventId
            }
        });
    } catch (error) {
        logger.error('deleteEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const meta = {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            files: Object.keys(req.files || {})
        };
        logger.info('POST /event create request', meta);

        const {
            judul_kegiatan,
            slug: providedSlug,
            deskripsi_kegiatan,
            lokasi_kegiatan,
            kapasitas_peserta,
            harga,
            waktu_mulai,
            waktu_berakhir,
            kategori_id,
            kategori_slug
        } = req.body;

        let category = null;
        if (kategori_id) {
            category = await categoryRepo().findOne({ where: { id: parseInt(kategori_id, 10) } });
            if (!category) {
                logger.warn('Kategori tidak ditemukan saat membuat event', { kategori_id });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        } else if (kategori_slug) {
            category = await categoryRepo().findOne({ where: { slug: kategori_slug } });
            if (!category) {
                logger.warn('Kategori slug tidak ditemukan saat membuat event', { kategori_slug });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        }

        if (judul_kegiatan && waktu_mulai) {
            const title = judul_kegiatan.trim();
            const startDate = new Date(waktu_mulai);
            const existing = await eventRepo()
                .createQueryBuilder('e')
                .where('LOWER(e.judul_kegiatan) = LOWER(:title)', { title })
                .andWhere('DATE(e.waktu_mulai) = DATE(:start)', { start: startDate })
                .getOne();

            if (existing) {
                logger.warn('Duplicate event title at same date detected', { title, start: startDate });
                return res.status(409).json({ message: 'Event dengan judul yang sama pada tanggal tersebut sudah ada' });
            }
        }

        let eventSlug = providedSlug ? slugify(providedSlug, { lower: true, strict: true }) :
            slugify(judul_kegiatan || '', { lower: true, strict: true });

        // make sure it's unique (append counter if neccessary)
        let counter = 0;
        let exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        while (exists) {
            counter += 1;
            eventSlug = `${eventSlug}-${counter}`;
            exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        }

        const uploadBase = path.join(__dirname, '..', '..', 'uploads');

        const flyerFile = req.files?.flyer_kegiatan?.[0] || null;
        const sertifikatFile = req.files?.sertifikat_kegiatan?.[0] || null;

        let flyer = null;
        let sertifikat = null;

        try {
            if (flyerFile) {
                const res = await renameUploadedFileToSlug(flyerFile, path.join(uploadBase, 'flyer'), `${eventSlug}-flyer`);
                flyer = res.filename;
            }
            if (sertifikatFile) {
                const res = await renameUploadedFileToSlug(sertifikatFile, path.join(uploadBase, 'certificates'), `${eventSlug}-certificate`);
                sertifikat = res.filename;
            }
        } catch (err) {
            const filePathsToCleanup = [
                flyerFile?.path,
                sertifikatFile?.path
            ].filter(Boolean);
            cleanupFiles(filePathsToCleanup);
            logger.error('File rename to slug failed', { error: err.message, stack: err.stack });
            return res.status(500).json({ message: 'Failed to process uploaded files' });
        }

        const flyer_final = flyer || null;
        const eventData = {
            judul_kegiatan,
            slug: eventSlug,
            deskripsi_kegiatan,
            lokasi_kegiatan,
            flyer_kegiatan: flyer_final,
            sertifikat_kegiatan: sertifikat,
            kapasitas_peserta: kapasitas_peserta ? parseInt(kapasitas_peserta, 10) : 0,
            harga: harga ? parseFloat(harga) : 0.0,
            waktu_mulai: new Date(waktu_mulai),
            waktu_berakhir: new Date(waktu_berakhir),
            category: category ? { id: category.id } : null
        };

        // use short transactions to make it atomic (files have been saved by multer)
        const saved = await AppDataSource.manager.transaction(async (manager) => {
            const repo = manager.getRepository('Event');
            const created = repo.create(eventData);
            return await repo.save(created);
        });

        logger.info('Event created', { id: saved.id, slug: saved.slug });
        return res.status(201).json({
            message: 'Event created',
            data: {
                id: saved.id,
                judul_kegiatan: saved.judul_kegiatan,
                slug: saved.slug,
                waktu_mulai: saved.waktu_mulai,
                waktu_berakhir: saved.waktu_berakhir
            }
        });
    } catch (error) {
        const toCleanup = [];
        toCleanup.push(req.files?.flyer_kegiatan?.[0]?.path);
        toCleanup.push(req.files?.sertifikat_kegiatan?.[0]?.path);

        if (typeof flyer !== 'undefined' && flyer) toCleanup.push(path.join(__dirname, '..', '..', 'uploads', 'flyer', flyer));
        if (typeof sertifikat !== 'undefined' && sertifikat) toCleanup.push(path.join(__dirname, '..', '..', 'uploads', 'certificates', sertifikat));

        cleanupFiles(toCleanup.filter(Boolean));

        if (error.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
            logger.warn('Duplicate entry blocked by DB constraint', {
                code: error.code,
                errno: error.errno,
                message: error,
                stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
            });
            return res.status(409).json({
                message: 'Event dengan judul yang sama sudah ada'
            });
        }

        logger.error('createEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        const meta = {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            eventId,
            files: Object.keys(req.files || {})
        };
        logger.info('PUT /event/:id update request', meta);

        const existingEvent = await eventRepo().findOne({ where: { id: eventId } });
        if (!existingEvent) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        const {
            judul_kegiatan,
            slug: providedSlug,
            deskripsi_kegiatan,
            lokasi_kegiatan,
            kapasitas_peserta,
            harga,
            waktu_mulai,
            waktu_berakhir,
            kategori_id,
            kategori_slug
        } = req.body;

        let category = null;
        if (kategori_id) {
            category = await categoryRepo().findOne({ where: { id: parseInt(kategori_id, 10) } });
            if (!category) {
                logger.warn('Kategori tidak ditemukan saat update event', { kategori_id });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        } else if (kategori_slug) {
            category = await categoryRepo().findOne({ where: { slug: kategori_slug } });
            if (!category) {
                logger.warn('Kategori slug tidak ditemukan saat update event', { kategori_slug });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        }

        // Check for duplicate title at same date (excluding current event)
        if (judul_kegiatan && waktu_mulai) {
            const title = judul_kegiatan.trim();
            const startDate = new Date(waktu_mulai);
            const existing = await eventRepo()
                .createQueryBuilder('e')
                .where('LOWER(e.judul_kegiatan) = LOWER(:title)', { title })
                .andWhere('DATE(e.waktu_mulai) = DATE(:start)', { start: startDate })
                .andWhere('e.id != :eventId', { eventId })
                .getOne();

            if (existing) {
                logger.warn('Duplicate event title at same date detected', { title, start: startDate });
                return res.status(409).json({ message: 'Event dengan judul yang sama pada tanggal tersebut sudah ada' });
            }
        }

        let eventSlug = providedSlug ? slugify(providedSlug, { lower: true, strict: true }) :
            (judul_kegiatan ? slugify(judul_kegiatan, { lower: true, strict: true }) : existingEvent.slug);

        // Make sure slug is unique (append counter if necessary)
        let counter = 0;
        let exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        while (exists && exists.id !== eventId) {
            counter += 1;
            eventSlug = `${eventSlug}-${counter}`;
            exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        }

        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const flyerFile = req.files?.flyer_kegiatan?.[0] || null;
        const sertifikatFile = req.files?.sertifikat_kegiatan?.[0] || null;

        let flyer = existingEvent.flyer_kegiatan;
        let sertifikat = existingEvent.sertifikat_kegiatan;

        try {
            if (flyerFile) {
                // Delete old flyer if exists
                if (existingEvent.flyer_kegiatan) {
                    const oldFlyerPath = path.join(uploadBase, 'flyer', existingEvent.flyer_kegiatan);
                    cleanupFiles([oldFlyerPath]);
                }
                const res = await renameUploadedFileToSlug(flyerFile, path.join(uploadBase, 'flyer'), `${eventSlug}-flyer`);
                flyer = res.filename;
            }
            if (sertifikatFile) {
                // Delete old certificate if exists
                if (existingEvent.sertifikat_kegiatan) {
                    const oldCertPath = path.join(uploadBase, 'certificates', existingEvent.sertifikat_kegiatan);
                    cleanupFiles([oldCertPath]);
                }
                const res = await renameUploadedFileToSlug(sertifikatFile, path.join(uploadBase, 'certificates'), `${eventSlug}-certificate`);
                sertifikat = res.filename;
            }
        } catch (err) {
            const filePathsToCleanup = [
                flyerFile?.path,
                sertifikatFile?.path
            ].filter(Boolean);
            cleanupFiles(filePathsToCleanup);
            logger.error('File rename to slug failed', { error: err.message, stack: err.stack });
            return res.status(500).json({ message: 'Failed to process uploaded files' });
        }

        const updateData = {
            ...(judul_kegiatan && { judul_kegiatan }),
            ...(eventSlug && { slug: eventSlug }),
            ...(deskripsi_kegiatan && { deskripsi_kegiatan }),
            ...(lokasi_kegiatan && { lokasi_kegiatan }),
            ...(flyer !== undefined && { flyer_kegiatan: flyer }),
            ...(sertifikat !== undefined && { sertifikat_kegiatan: sertifikat }),
            ...(kapasitas_peserta !== undefined && { kapasitas_peserta: parseInt(kapasitas_peserta, 10) }),
            ...(harga !== undefined && { harga: parseFloat(harga) }),
            ...(waktu_mulai && { waktu_mulai: new Date(waktu_mulai) }),
            ...(waktu_berakhir && { waktu_berakhir: new Date(waktu_berakhir) }),
            ...(category && { category: { id: category.id } })
        };

        const updated = await AppDataSource.manager.transaction(async (manager) => {
            const repo = manager.getRepository('Event');
            await repo.update(eventId, updateData);
            return await repo.findOne({ 
                where: { id: eventId },
                relations: ['category']
            });
        });

        logger.info('Event updated', { id: updated.id, slug: updated.slug });
        return res.status(200).json({
            message: 'Event updated',
            data: {
                id: updated.id,
                judul_kegiatan: updated.judul_kegiatan,
                slug: updated.slug,
                waktu_mulai: updated.waktu_mulai,
                waktu_berakhir: updated.waktu_berakhir
            }
        });
    } catch (error) {
        const toCleanup = [];
        toCleanup.push(req.files?.flyer_kegiatan?.[0]?.path);
        toCleanup.push(req.files?.sertifikat_kegiatan?.[0]?.path);
        cleanupFiles(toCleanup.filter(Boolean));

        logger.error('updateEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        logger.info('DELETE /event/:id delete request', { eventId, ip: req.ip });

        const event = await eventRepo().findOne({ where: { id: eventId } });
        if (!event) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        // Check if event has any attendance records
        const attendanceCount = await attendanceRepo().count({ where: { event: { id: eventId } } });
        if (attendanceCount > 0) {
            return res.status(409).json({ 
                message: `Event tidak dapat dihapus karena sudah memiliki ${attendanceCount} peserta terdaftar` 
            });
        }

        // Delete associated files
        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const filesToDelete = [];
        
        if (event.flyer_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'flyer', event.flyer_kegiatan));
        }
        if (event.sertifikat_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'certificates', event.sertifikat_kegiatan));
        }
        
        cleanupFiles(filesToDelete);

        // Delete event
        await eventRepo().delete(eventId);

        logger.info('Event deleted', { id: eventId, slug: event.slug });
        return res.status(200).json({
            message: 'Event berhasil dihapus',
            data: {
                id: eventId
            }
        });
    } catch (error) {
        logger.error('deleteEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.registerEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        const eventId = parseInt(req.params.id, 10);

        logger.info(`POST /event/${eventId}/register by user=${userId}`);

        const ev = await eventRepo().findOne({ where: { id: eventId } });
        if (!ev) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if event has started - registration should be closed
        const eventStartTime = new Date(ev.waktu_mulai);
        const currentTime = new Date();
        if (currentTime >= eventStartTime) {
            logger.warn(`Registration attempted after event start: eventId=${eventId}, userId=${userId}`);
            return res.status(403).json({ 
                message: 'Pendaftaran sudah ditutup. Event sudah dimulai.' 
            });
        }

        const isPaidEvent = Number(ev.harga) > 0;

        const currentCount = await attendanceRepo().createQueryBuilder('d')
            .where('d.event = :id', { id: eventId })
            .getCount();

        if (ev.kapasitas_peserta > 0 && currentCount >= ev.kapasitas_peserta) {
            return res.status(409).json({ message: 'Kapasitas event sudah penuh' });
        }

        // For paid events, check if there's already a payment (pending or paid)
        if (isPaidEvent) {
            // Check if user already has attendance with payment
            const existingAttendance = await attendanceRepo()
                .createQueryBuilder('d')
                .leftJoinAndSelect('d.payment', 'payment')
                .where('d.event = :eventId', { eventId })
                .andWhere('d.user = :userId', { userId })
                .getOne();

            if (existingAttendance) {
                // If attendance exists, check payment status
                if (existingAttendance.payment) {
                    if (existingAttendance.payment.status === 'paid') {
                        return res.status(409).json({ 
                            message: 'Anda sudah terdaftar dan sudah membayar untuk event ini' 
                        });
                    }
                    if (existingAttendance.payment.status === 'pending') {
                        // Return existing payment info
                        return res.status(200).json({ 
                            message: 'Pembayaran sudah dibuat, silakan selesaikan pembayaran.',
                            data: {
                                eventId: eventId,
                                attendanceId: existingAttendance.id,
                                requiresPayment: true,
                                amount: ev.harga
                            }
                        });
                    }
                }
                // If attendance exists but no payment, something went wrong - return error
                return res.status(409).json({ 
                    message: 'Anda sudah terdaftar untuk event ini. Silakan hubungi administrator.' 
                });
            }

            // For paid events, don't create attendance yet - just return event info for payment
            // Attendance will be created in paymentController.createPayment
            logger.info(`User ${userId} initiating payment for paid event ${eventId}`);
            return res.status(200).json({ 
                message: 'Silakan lakukan pembayaran untuk melanjutkan pendaftaran.',
                data: {
                    eventId: eventId,
                    requiresPayment: true,
                    amount: ev.harga
                }
            });
        }

        // For free events, check if already registered
        const existing = await attendanceRepo().createQueryBuilder('d')
            .where('d.event = :eventId', { eventId })
            .andWhere('d.user = :userId', { userId })
            .getOne();

        if (existing) {
            return res.status(409).json({ message: 'Anda sudah terdaftar untuk event ini' });
        }

        // Generate 10-digit alphanumeric token
        const token = generateAlphanumeric(10);
        const tokenHash = await hashToken(token);

        const attendanceData = {
            user: { id: userId },
            event: { id: eventId },
            otp: tokenHash,
            status_absen: 'tidak-hadir'
        };

        // Get user email before saving attendance
        const userEmail = req.user.email;
        if (!userEmail) {
            logger.error('User email not found in request', { userId });
            return res.status(400).json({ message: 'Email pengguna tidak ditemukan' });
        }

        // Save attendance for free events
        const saved = await AppDataSource.manager.transaction(async (manager) => {
            const repo = manager.getRepository('Attendance');
            const created = repo.create(attendanceData);
            return await repo.save(created);
        });

        // For free events, send email with token immediately
        try {
            const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES || '15', 10);
            logger.info(`Sending event token email to ${userEmail} for event ${ev.judul_kegiatan}`);
            await sendEventTokenEmail(userEmail, token, ev.judul_kegiatan, expiresMinutes);
            logger.info(`Event token email sent successfully to ${userEmail}`);
        } catch (mailErr) {
            // Rollback attendance if email fails
            logger.error('Failed to send event token email', { 
                err: mailErr, 
                errorMessage: mailErr.message,
                stack: mailErr.stack,
                userEmail,
                eventId,
                attendanceId: saved.id
            });
            
            try {
                await AppDataSource.getRepository('Attendance').delete({ id: saved.id });
                logger.info(`Rolled back attendance record ${saved.id} due to email failure`);
            } catch (deleteErr) {
                logger.error('Failed to rollback attendance after email failure', { 
                    deleteErr: deleteErr.message,
                    attendanceId: saved.id 
                });
            }
            
            return res.status(500).json({ 
                message: 'Gagal mengirim email token. Silakan coba lagi atau hubungi administrator.' 
            });
        }

        logger.info(`User ${userId} registered to event ${eventId}, attendanceId=${saved.id}`);
        return res.status(201).json({ message: 'Berhasil mendaftar. Kode token dikirim ke email Anda.' });
    } catch (error) {
        logger.error(`registerEvent error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        const meta = {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            eventId,
            files: Object.keys(req.files || {})
        };
        logger.info('PUT /event/:id update request', meta);

        const existingEvent = await eventRepo().findOne({ where: { id: eventId } });
        if (!existingEvent) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        const {
            judul_kegiatan,
            slug: providedSlug,
            deskripsi_kegiatan,
            lokasi_kegiatan,
            kapasitas_peserta,
            harga,
            waktu_mulai,
            waktu_berakhir,
            kategori_id,
            kategori_slug
        } = req.body;

        let category = null;
        if (kategori_id) {
            category = await categoryRepo().findOne({ where: { id: parseInt(kategori_id, 10) } });
            if (!category) {
                logger.warn('Kategori tidak ditemukan saat update event', { kategori_id });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        } else if (kategori_slug) {
            category = await categoryRepo().findOne({ where: { slug: kategori_slug } });
            if (!category) {
                logger.warn('Kategori slug tidak ditemukan saat update event', { kategori_slug });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        }

        // Check for duplicate title at same date (excluding current event)
        if (judul_kegiatan && waktu_mulai) {
            const title = judul_kegiatan.trim();
            const startDate = new Date(waktu_mulai);
            const existing = await eventRepo()
                .createQueryBuilder('e')
                .where('LOWER(e.judul_kegiatan) = LOWER(:title)', { title })
                .andWhere('DATE(e.waktu_mulai) = DATE(:start)', { start: startDate })
                .andWhere('e.id != :eventId', { eventId })
                .getOne();

            if (existing) {
                logger.warn('Duplicate event title at same date detected', { title, start: startDate });
                return res.status(409).json({ message: 'Event dengan judul yang sama pada tanggal tersebut sudah ada' });
            }
        }

        let eventSlug = providedSlug ? slugify(providedSlug, { lower: true, strict: true }) :
            (judul_kegiatan ? slugify(judul_kegiatan, { lower: true, strict: true }) : existingEvent.slug);

        // Make sure slug is unique (append counter if necessary)
        let counter = 0;
        let exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        while (exists && exists.id !== eventId) {
            counter += 1;
            eventSlug = `${eventSlug}-${counter}`;
            exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        }

        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const flyerFile = req.files?.flyer_kegiatan?.[0] || null;
        const sertifikatFile = req.files?.sertifikat_kegiatan?.[0] || null;

        let flyer = existingEvent.flyer_kegiatan;
        let sertifikat = existingEvent.sertifikat_kegiatan;

        try {
            if (flyerFile) {
                // Delete old flyer if exists
                if (existingEvent.flyer_kegiatan) {
                    const oldFlyerPath = path.join(uploadBase, 'flyer', existingEvent.flyer_kegiatan);
                    cleanupFiles([oldFlyerPath]);
                }
                const res = await renameUploadedFileToSlug(flyerFile, path.join(uploadBase, 'flyer'), `${eventSlug}-flyer`);
                flyer = res.filename;
            }
            if (sertifikatFile) {
                // Delete old certificate if exists
                if (existingEvent.sertifikat_kegiatan) {
                    const oldCertPath = path.join(uploadBase, 'certificates', existingEvent.sertifikat_kegiatan);
                    cleanupFiles([oldCertPath]);
                }
                const res = await renameUploadedFileToSlug(sertifikatFile, path.join(uploadBase, 'certificates'), `${eventSlug}-certificate`);
                sertifikat = res.filename;
            }
        } catch (err) {
            const filePathsToCleanup = [
                flyerFile?.path,
                sertifikatFile?.path
            ].filter(Boolean);
            cleanupFiles(filePathsToCleanup);
            logger.error('File rename to slug failed', { error: err.message, stack: err.stack });
            return res.status(500).json({ message: 'Failed to process uploaded files' });
        }

        const updateData = {
            ...(judul_kegiatan && { judul_kegiatan }),
            ...(eventSlug && { slug: eventSlug }),
            ...(deskripsi_kegiatan && { deskripsi_kegiatan }),
            ...(lokasi_kegiatan && { lokasi_kegiatan }),
            ...(flyer !== undefined && { flyer_kegiatan: flyer }),
            ...(sertifikat !== undefined && { sertifikat_kegiatan: sertifikat }),
            ...(kapasitas_peserta !== undefined && { kapasitas_peserta: parseInt(kapasitas_peserta, 10) }),
            ...(harga !== undefined && { harga: parseFloat(harga) }),
            ...(waktu_mulai && { waktu_mulai: new Date(waktu_mulai) }),
            ...(waktu_berakhir && { waktu_berakhir: new Date(waktu_berakhir) }),
            ...(category && { category: { id: category.id } })
        };

        const updated = await AppDataSource.manager.transaction(async (manager) => {
            const repo = manager.getRepository('Event');
            await repo.update(eventId, updateData);
            return await repo.findOne({ 
                where: { id: eventId },
                relations: ['category']
            });
        });

        logger.info('Event updated', { id: updated.id, slug: updated.slug });
        return res.status(200).json({
            message: 'Event updated',
            data: {
                id: updated.id,
                judul_kegiatan: updated.judul_kegiatan,
                slug: updated.slug,
                waktu_mulai: updated.waktu_mulai,
                waktu_berakhir: updated.waktu_berakhir
            }
        });
    } catch (error) {
        const toCleanup = [];
        toCleanup.push(req.files?.flyer_kegiatan?.[0]?.path);
        toCleanup.push(req.files?.sertifikat_kegiatan?.[0]?.path);
        cleanupFiles(toCleanup.filter(Boolean));

        logger.error('updateEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        logger.info('DELETE /event/:id delete request', { eventId, ip: req.ip });

        const event = await eventRepo().findOne({ where: { id: eventId } });
        if (!event) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        // Check if event has any attendance records
        const attendanceCount = await attendanceRepo().count({ where: { event: { id: eventId } } });
        if (attendanceCount > 0) {
            return res.status(409).json({ 
                message: `Event tidak dapat dihapus karena sudah memiliki ${attendanceCount} peserta terdaftar` 
            });
        }

        // Delete associated files
        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const filesToDelete = [];
        
        if (event.flyer_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'flyer', event.flyer_kegiatan));
        }
        if (event.sertifikat_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'certificates', event.sertifikat_kegiatan));
        }
        
        cleanupFiles(filesToDelete);

        // Delete event
        await eventRepo().delete(eventId);

        logger.info('Event deleted', { id: eventId, slug: event.slug });
        return res.status(200).json({
            message: 'Event berhasil dihapus',
            data: {
                id: eventId
            }
        });
    } catch (error) {
        logger.error('deleteEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.checkInEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        const eventId = parseInt(req.params.id, 10);
        const { token } = req.body;

        logger.info(`POST /event/${eventId}/checkin by user=${userId}`);

        if (!token) return res.status(400).json({ message: 'Token diperlukan' });

        const attendance = await attendanceRepo().createQueryBuilder('d')
            .where('d.event = :eventId', { eventId })
            .andWhere('d.user = :userId', { userId })
            .getOne();

        if (!attendance) return res.status(404).json({ message: 'Pendaftaran tidak ditemukan untuk user ini' });

        // Get event to check start time
        const event = await eventRepo().findOne({ where: { id: eventId } });
        if (!event) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        // Check if event has started
        const eventStartTime = new Date(event.waktu_mulai);
        const currentTime = new Date();
        if (currentTime < eventStartTime) {
            const timeUntilStart = Math.ceil((eventStartTime - currentTime) / 1000 / 60); // minutes
            logger.warn(`Check-in attempted before event start: eventId=${eventId}, userId=${userId}, minutesUntilStart=${timeUntilStart}`);
            return res.status(400).json({ 
                message: `Event belum dimulai. Check-in dapat dilakukan mulai ${eventStartTime.toLocaleString('id-ID', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Jakarta'
                })} WIB.` 
            });
        }

        if (attendance.status_absen === 'hadir') {
            return res.status(400).json({ message: 'Anda sudah melakukan absensi' });
        }

        const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES || '5', 10);
        const createdAt = new Date(attendance.created_at);
        const expiryDate = new Date(createdAt.getTime() + expiresMinutes * 60 * 1000);
        if (new Date() > expiryDate) {
            return res.status(400).json({ message: 'Token telah kadaluarsa' });
        }

        const valid = await compareToken(token, attendance.otp);
        if (!valid) {
            logger.warn(`Invalid check-in token for event ${eventId} by user ${userId}`);
            return res.status(400).json({ message: 'Token tidak valid. Pastikan token yang Anda masukkan benar.' });
        }

        await AppDataSource.manager.transaction(async manager => {
            const repo = manager.getRepository('Attendance');
            await repo.update({ id: attendance.id }, {
                status_absen: 'hadir',
                waktu_absen: new Date(),
                otp_used: 1
            });
        });

        logger.info(`User ${userId} checked in to event ${eventId}`);
        return res.json({ message: 'Absensi berhasil. Terima kasih.' });
    } catch (error) {
        logger.error(`checkInEvent error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        const meta = {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            eventId,
            files: Object.keys(req.files || {})
        };
        logger.info('PUT /event/:id update request', meta);

        const existingEvent = await eventRepo().findOne({ where: { id: eventId } });
        if (!existingEvent) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        const {
            judul_kegiatan,
            slug: providedSlug,
            deskripsi_kegiatan,
            lokasi_kegiatan,
            kapasitas_peserta,
            harga,
            waktu_mulai,
            waktu_berakhir,
            kategori_id,
            kategori_slug
        } = req.body;

        let category = null;
        if (kategori_id) {
            category = await categoryRepo().findOne({ where: { id: parseInt(kategori_id, 10) } });
            if (!category) {
                logger.warn('Kategori tidak ditemukan saat update event', { kategori_id });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        } else if (kategori_slug) {
            category = await categoryRepo().findOne({ where: { slug: kategori_slug } });
            if (!category) {
                logger.warn('Kategori slug tidak ditemukan saat update event', { kategori_slug });
                return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
        }

        // Check for duplicate title at same date (excluding current event)
        if (judul_kegiatan && waktu_mulai) {
            const title = judul_kegiatan.trim();
            const startDate = new Date(waktu_mulai);
            const existing = await eventRepo()
                .createQueryBuilder('e')
                .where('LOWER(e.judul_kegiatan) = LOWER(:title)', { title })
                .andWhere('DATE(e.waktu_mulai) = DATE(:start)', { start: startDate })
                .andWhere('e.id != :eventId', { eventId })
                .getOne();

            if (existing) {
                logger.warn('Duplicate event title at same date detected', { title, start: startDate });
                return res.status(409).json({ message: 'Event dengan judul yang sama pada tanggal tersebut sudah ada' });
            }
        }

        let eventSlug = providedSlug ? slugify(providedSlug, { lower: true, strict: true }) :
            (judul_kegiatan ? slugify(judul_kegiatan, { lower: true, strict: true }) : existingEvent.slug);

        // Make sure slug is unique (append counter if necessary)
        let counter = 0;
        let exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        while (exists && exists.id !== eventId) {
            counter += 1;
            eventSlug = `${eventSlug}-${counter}`;
            exists = await eventRepo().findOne({ where: { slug: eventSlug } });
        }

        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const flyerFile = req.files?.flyer_kegiatan?.[0] || null;
        const sertifikatFile = req.files?.sertifikat_kegiatan?.[0] || null;

        let flyer = existingEvent.flyer_kegiatan;
        let sertifikat = existingEvent.sertifikat_kegiatan;

        try {
            if (flyerFile) {
                // Delete old flyer if exists
                if (existingEvent.flyer_kegiatan) {
                    const oldFlyerPath = path.join(uploadBase, 'flyer', existingEvent.flyer_kegiatan);
                    cleanupFiles([oldFlyerPath]);
                }
                const res = await renameUploadedFileToSlug(flyerFile, path.join(uploadBase, 'flyer'), `${eventSlug}-flyer`);
                flyer = res.filename;
            }
            if (sertifikatFile) {
                // Delete old certificate if exists
                if (existingEvent.sertifikat_kegiatan) {
                    const oldCertPath = path.join(uploadBase, 'certificates', existingEvent.sertifikat_kegiatan);
                    cleanupFiles([oldCertPath]);
                }
                const res = await renameUploadedFileToSlug(sertifikatFile, path.join(uploadBase, 'certificates'), `${eventSlug}-certificate`);
                sertifikat = res.filename;
            }
        } catch (err) {
            const filePathsToCleanup = [
                flyerFile?.path,
                sertifikatFile?.path
            ].filter(Boolean);
            cleanupFiles(filePathsToCleanup);
            logger.error('File rename to slug failed', { error: err.message, stack: err.stack });
            return res.status(500).json({ message: 'Failed to process uploaded files' });
        }

        const updateData = {
            ...(judul_kegiatan && { judul_kegiatan }),
            ...(eventSlug && { slug: eventSlug }),
            ...(deskripsi_kegiatan && { deskripsi_kegiatan }),
            ...(lokasi_kegiatan && { lokasi_kegiatan }),
            ...(flyer !== undefined && { flyer_kegiatan: flyer }),
            ...(sertifikat !== undefined && { sertifikat_kegiatan: sertifikat }),
            ...(kapasitas_peserta !== undefined && { kapasitas_peserta: parseInt(kapasitas_peserta, 10) }),
            ...(harga !== undefined && { harga: parseFloat(harga) }),
            ...(waktu_mulai && { waktu_mulai: new Date(waktu_mulai) }),
            ...(waktu_berakhir && { waktu_berakhir: new Date(waktu_berakhir) }),
            ...(category && { category: { id: category.id } })
        };

        const updated = await AppDataSource.manager.transaction(async (manager) => {
            const repo = manager.getRepository('Event');
            await repo.update(eventId, updateData);
            return await repo.findOne({ 
                where: { id: eventId },
                relations: ['category']
            });
        });

        logger.info('Event updated', { id: updated.id, slug: updated.slug });
        return res.status(200).json({
            message: 'Event updated',
            data: {
                id: updated.id,
                judul_kegiatan: updated.judul_kegiatan,
                slug: updated.slug,
                waktu_mulai: updated.waktu_mulai,
                waktu_berakhir: updated.waktu_berakhir
            }
        });
    } catch (error) {
        const toCleanup = [];
        toCleanup.push(req.files?.flyer_kegiatan?.[0]?.path);
        toCleanup.push(req.files?.sertifikat_kegiatan?.[0]?.path);
        cleanupFiles(toCleanup.filter(Boolean));

        logger.error('updateEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        logger.info('DELETE /event/:id delete request', { eventId, ip: req.ip });

        const event = await eventRepo().findOne({ where: { id: eventId } });
        if (!event) {
            return res.status(404).json({ message: 'Event tidak ditemukan' });
        }

        // Check if event has any attendance records
        const attendanceCount = await attendanceRepo().count({ where: { event: { id: eventId } } });
        if (attendanceCount > 0) {
            return res.status(409).json({ 
                message: `Event tidak dapat dihapus karena sudah memiliki ${attendanceCount} peserta terdaftar` 
            });
        }

        // Delete associated files
        const uploadBase = path.join(__dirname, '..', '..', 'uploads');
        const filesToDelete = [];
        
        if (event.flyer_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'flyer', event.flyer_kegiatan));
        }
        if (event.sertifikat_kegiatan) {
            filesToDelete.push(path.join(uploadBase, 'certificates', event.sertifikat_kegiatan));
        }
        
        cleanupFiles(filesToDelete);

        // Delete event
        await eventRepo().delete(eventId);

        logger.info('Event deleted', { id: eventId, slug: event.slug });
        return res.status(200).json({
            message: 'Event berhasil dihapus',
            data: {
                id: eventId
            }
        });
    } catch (error) {
        logger.error('deleteEvent unexpected error', {
            code: error.code,
            errno: error.errno,
            message: error,
            stack: error.stack
        });

        return res.status(500).json({ message: 'Internal server error' });
    }
};
