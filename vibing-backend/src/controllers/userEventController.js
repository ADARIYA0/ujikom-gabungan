const { AppDataSource } = require('../config/database');
const logger = require('../utils/logger');

const attendanceRepo = () => AppDataSource.getRepository('Attendance');
const eventRepo = () => AppDataSource.getRepository('Event');

/**
 * Get all events registered by the current user that are NOT yet ended
 * Returns events with attendance status (hadir/tidak-hadir)
 * Only includes events where waktu_berakhir >= current time
 */
exports.getMyEvents = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        logger.info(`GET /user/events by user=${userId}`);

        const currentTime = new Date();
        logger.info(`Current time for filtering: ${currentTime.toISOString()}`);

        // Get all attendances for this user with event details
        // Only include events that haven't ended yet (waktu_berakhir >= currentTime)
        // Use parameterized query to ensure accurate time comparison
        // Use DATE() function to compare dates properly, accounting for timezone
        // Try using relation name 'user' first, fallback to user_id if needed
        let attendances;
        try {
            attendances = await attendanceRepo()
                .createQueryBuilder('attendance')
                .innerJoinAndSelect('attendance.event', 'event')
                .leftJoinAndSelect('event.category', 'category')
                .where('attendance.user = :userId', { userId })
                .andWhere('event.waktu_berakhir > :currentTime', { currentTime })
                .orderBy('event.waktu_mulai', 'ASC')
                .getMany();
        } catch (err) {
            // Fallback: try with user_id directly
            logger.warn(`First query failed, trying with user_id: ${err.message}`);
            attendances = await attendanceRepo()
                .createQueryBuilder('attendance')
                .innerJoinAndSelect('attendance.event', 'event')
                .leftJoinAndSelect('event.category', 'category')
                .where('attendance.user_id = :userId', { userId })
                .andWhere('event.waktu_berakhir > :currentTime', { currentTime })
                .orderBy('event.waktu_mulai', 'ASC')
                .getMany();
        }

        logger.info(`Found ${attendances.length} attendances before filtering for user ${userId}`);

        const events = attendances
            .filter(attendance => attendance.event !== null) // Filter out null events
            .map(attendance => {
                const ev = attendance.event;
                const now = new Date();
                const waktuBerakhir = new Date(ev.waktu_berakhir);
                const isPassed = waktuBerakhir < now;
                
                return {
                    id: ev.id,
                    judul_kegiatan: ev.judul_kegiatan,
                    slug: ev.slug,
                    deskripsi_kegiatan: ev.deskripsi_kegiatan,
                    lokasi_kegiatan: ev.lokasi_kegiatan,
                    flyer_kegiatan: ev.flyer_kegiatan,
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
                    attendance_status: attendance.status_absen,
                    waktu_absen: attendance.waktu_absen,
                    registered_at: attendance.created_at,
                    is_event_started: new Date(ev.waktu_mulai) <= now,
                    is_event_passed: isPassed
                };
            });

        // Additional filter to ensure no ended events slip through
        // This is a safety net in case the database query doesn't filter correctly
        // Use strict comparison: event must not have ended (waktu_berakhir > now, not >=)
        const activeEvents = events.filter(event => {
            const waktuBerakhir = new Date(event.waktu_berakhir);
            const now = new Date();
            const isActive = waktuBerakhir > now; // Use > instead of >= to ensure ended events go to history
            
            if (!isActive) {
                logger.warn(`Filtering out ended event ${event.id} (${event.judul_kegiatan}): waktu_berakhir=${waktuBerakhir.toISOString()}, now=${now.toISOString()}`);
            }
            
            return isActive;
        });

        if (activeEvents.length !== events.length) {
            logger.warn(`Filtered out ${events.length - activeEvents.length} ended events that should be in history. Total before filter: ${events.length}, after filter: ${activeEvents.length}`);
        }

        logger.info(`Retrieved ${activeEvents.length} active registered events for user ${userId}`);
        return res.json({ data: activeEvents });
    } catch (error) {
        logger.error(`getMyEvents error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get event history (completed events where user participated)
 * Returns events that have ended (waktu_berakhir < currentTime) and user has registered
 * Includes both events where user checked in (hadir) and didn't check in (tidak-hadir)
 */
exports.getEventHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        logger.info(`GET /user/events/history by user=${userId}`);

        const currentTime = new Date();
        logger.info(`Current time for filtering history: ${currentTime.toISOString()}`);

        // Get attendances where:
        // 1. User has registered (any attendance record)
        // 2. Event has ended (waktu_berakhir < currentTime)
        // Use parameterized query to ensure accurate time comparison
        // This includes both events where user checked in and didn't check in
        let attendances;
        try {
            attendances = await attendanceRepo()
                .createQueryBuilder('attendance')
                .leftJoinAndSelect('attendance.event', 'event')
                .leftJoinAndSelect('event.category', 'category')
                .where('attendance.user = :userId', { userId })
                .andWhere('event.waktu_berakhir <= :currentTime', { currentTime })
                .orderBy('event.waktu_berakhir', 'DESC')
                .getMany();
        } catch (err) {
            // Fallback: try with user_id directly
            logger.warn(`First query failed, trying with user_id: ${err.message}`);
            attendances = await attendanceRepo()
                .createQueryBuilder('attendance')
                .leftJoinAndSelect('attendance.event', 'event')
                .leftJoinAndSelect('event.category', 'category')
                .where('attendance.user_id = :userId', { userId })
                .andWhere('event.waktu_berakhir <= :currentTime', { currentTime })
                .orderBy('event.waktu_berakhir', 'DESC')
                .getMany();
        }

        logger.info(`Found ${attendances.length} attendances for completed events`);

        const events = attendances
            .filter(attendance => attendance.event !== null) // Filter out null events
            .map(attendance => {
                const ev = attendance.event;
                const now = new Date();
                const waktuBerakhir = new Date(ev.waktu_berakhir);
                const isPassed = waktuBerakhir < now;
                
                if (!isPassed) {
                    logger.warn(`Event ${ev.id} (${ev.judul_kegiatan}) hasn't ended but in history. waktu_berakhir: ${waktuBerakhir.toISOString()}, now: ${now.toISOString()}`);
                }
                
                return {
                    id: ev.id,
                    judul_kegiatan: ev.judul_kegiatan,
                    slug: ev.slug,
                    deskripsi_kegiatan: ev.deskripsi_kegiatan,
                    lokasi_kegiatan: ev.lokasi_kegiatan,
                    flyer_kegiatan: ev.flyer_kegiatan,
                    sertifikat_kegiatan: ev.sertifikat_kegiatan,
                    waktu_mulai: ev.waktu_mulai,
                    waktu_berakhir: ev.waktu_berakhir,
                    kategori: ev.category
                        ? {
                            id: ev.category.id,
                            nama_kategori: ev.category.nama_kategori,
                            slug: ev.category.slug
                        }
                        : null,
                    attendance_status: attendance.status_absen,
                    waktu_absen: attendance.waktu_absen,
                    registered_at: attendance.created_at,
                    completed_at: attendance.waktu_absen || ev.waktu_berakhir
                };
            });

        // Additional filter to ensure only ended events are included
        // This is a safety net in case the database query doesn't filter correctly
        // Use <= to include events that ended exactly at current time
        const completedEvents = events.filter(event => {
            const waktuBerakhir = new Date(event.waktu_berakhir);
            const now = new Date();
            const isCompleted = waktuBerakhir <= now; // Use <= to include events that just ended
            
            if (!isCompleted) {
                logger.warn(`Filtering out active event ${event.id} (${event.judul_kegiatan}) from history: waktu_berakhir=${waktuBerakhir.toISOString()}, now=${now.toISOString()}`);
            }
            
            return isCompleted;
        });

        if (completedEvents.length !== events.length) {
            logger.warn(`Filtered out ${events.length - completedEvents.length} active events that shouldn't be in history. Total before filter: ${events.length}, after filter: ${completedEvents.length}`);
        }

        logger.info(`Retrieved ${completedEvents.length} completed events for user ${userId}`);
        return res.json({ data: completedEvents });
    } catch (error) {
        logger.error(`getEventHistory error: ${error}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

