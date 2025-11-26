const { AppDataSource } = require('../config/database');
const { Xendit } = require('xendit-node');
const logger = require('../utils/logger');

// Initialize Xendit client
const xenditClient = new Xendit({
    secretKey: process.env.XENDIT_SECRET_KEY || '',
});

// Initialize Invoice API from Xendit client
// In xendit-node v7, Invoice is a property, not a function
const invoiceApi = xenditClient.Invoice;

const paymentRepo = () => AppDataSource.getRepository('Payment');
const attendanceRepo = () => AppDataSource.getRepository('Attendance');
const eventRepo = () => AppDataSource.getRepository('Event');

/**
 * Helper function to create attendance for paid payment
 * This is called when payment status changes to 'paid'
 */
async function createAttendanceForPaidPayment(payment) {
    try {
        // Reload payment with relations to ensure we have all data
        const fullPayment = await paymentRepo()
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.attendance', 'attendance')
            .where('payment.id = :paymentId', { paymentId: payment.id })
            .getOne();
        
        if (!fullPayment) {
            logger.warn(`Payment ${payment.id} not found when creating attendance`);
            return;
        }
        
        let attendance = fullPayment.attendance;
        
        if (!attendance && fullPayment.event_id && fullPayment.user_id) {
            logger.info(`Creating attendance for paid event ${fullPayment.event_id} and user ${fullPayment.user_id}`);
            
            const existingAttendance = await attendanceRepo()
                .createQueryBuilder('d')
                .where('d.event = :eventId', { eventId: fullPayment.event_id })
                .andWhere('d.user = :userId', { userId: fullPayment.user_id })
                .getOne();
            
            if (existingAttendance) {
                attendance = existingAttendance;
                fullPayment.attendance = attendance;
                await paymentRepo().save(fullPayment);
                logger.info(`Linked existing attendance ${attendance.id} to payment ${fullPayment.id}`);
            } else {
                const { generateAlphanumeric, hashToken } = require('../utils/tokenUtils');
                const token = generateAlphanumeric(10);
                const tokenHash = await hashToken(token);

                const attendanceData = {
                    user: { id: fullPayment.user_id },
                    event: { id: fullPayment.event_id },
                    otp: tokenHash,
                    status_absen: 'tidak-hadir'
                };

                attendance = attendanceRepo().create(attendanceData);
                attendance = await attendanceRepo().save(attendance);
                
                fullPayment.attendance = attendance;
                await paymentRepo().save(fullPayment);
                
                logger.info(`Created attendance ${attendance.id} for paid event ${fullPayment.event_id} after payment confirmation`);
            }
        }
        
        if (attendance) {
            const fullAttendance = await attendanceRepo()
                .createQueryBuilder('attendance')
                .leftJoinAndSelect('attendance.user', 'user')
                .leftJoinAndSelect('attendance.event', 'event')
                .where('attendance.id = :attendanceId', { attendanceId: attendance.id })
                .getOne();

            if (fullAttendance) {
                const { generateAlphanumeric, hashToken } = require('../utils/tokenUtils');
                const { sendEventTokenEmail } = require('../services/emailService');
                
                const token = generateAlphanumeric(10);
                const tokenHash = await hashToken(token);
                
                fullAttendance.otp = tokenHash;
                await attendanceRepo().save(fullAttendance);
                
                try {
                    const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES || '15', 10);
                    await sendEventTokenEmail(
                        fullAttendance.user.email,
                        token,
                        fullAttendance.event.judul_kegiatan,
                        expiresMinutes
                    );
                    logger.info(`Event token email sent after payment: attendanceId=${fullAttendance.id}`);
                } catch (emailError) {
                    logger.error(`Failed to send token email after payment: ${emailError.message}`);
                }
            }
        }
    } catch (error) {
        logger.error(`Error creating attendance for paid payment: ${error.message}`, {
            paymentId: payment.id,
            stack: error.stack
        });
    }
}

/**
 * Create payment invoice for event registration
 * Supports both eventId (for paid events - creates attendance after payment) and attendanceId (for existing attendance)
 */
exports.createPayment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { attendanceId, eventId } = req.body;

        logger.info(`POST /payment/create by user=${userId}, attendanceId=${attendanceId}, eventId=${eventId}`);

        let attendance = null;
        let event = null;

        if (eventId && !attendanceId) {
            // Get event
            event = await eventRepo().findOne({ where: { id: eventId } });
            
            if (!event) {
                return res.status(404).json({ message: 'Event tidak ditemukan' });
            }

            const amount = parseFloat(event.harga);
            if (amount <= 0) {
                return res.status(400).json({ message: 'Event ini gratis, tidak perlu pembayaran' });
            }

            // Check if user already registered
            const existing = await attendanceRepo()
                .createQueryBuilder('d')
                .where('d.event = :eventId', { eventId })
                .andWhere('d.user = :userId', { userId })
                .getOne();

            if (existing) {
                // If attendance exists, check if payment exists
                const existingPayment = await paymentRepo()
                    .createQueryBuilder('payment')
                    .where('payment.attendance = :attendanceId', { attendanceId: existing.id })
                    .getOne();

                if (existingPayment) {
                    if (existingPayment.status === 'paid') {
                        return res.status(200).json({
                            message: 'Pembayaran sudah dilakukan',
                            data: {
                                paymentId: existingPayment.id,
                                status: existingPayment.status,
                                invoiceUrl: existingPayment.invoice_url,
                                qrCodeUrl: existingPayment.qr_code_url
                            }
                        });
                    }
                    if (existingPayment.status === 'pending') {
                        return res.status(200).json({
                            message: 'Pembayaran sudah dibuat',
                            data: {
                                paymentId: existingPayment.id,
                                status: existingPayment.status,
                                invoiceUrl: existingPayment.invoice_url,
                                qrCodeUrl: existingPayment.qr_code_url,
                                expiresAt: existingPayment.expires_at
                            }
                        });
                    }
                }
                // Use existing attendance
                attendance = existing;
            }
        } else if (attendanceId) {
            // Get attendance with event (existing flow)
            attendance = await attendanceRepo()
                .createQueryBuilder('attendance')
                .leftJoinAndSelect('attendance.event', 'event')
                .leftJoinAndSelect('attendance.user', 'user')
                .where('attendance.id = :attendanceId', { attendanceId })
                .andWhere('attendance.user = :userId', { userId })
                .getOne();

            if (!attendance) {
                return res.status(404).json({ message: 'Pendaftaran tidak ditemukan' });
            }
            event = attendance.event;
        } else {
            return res.status(400).json({ message: 'Event ID atau Attendance ID diperlukan' });
        }

        let existingPayment = null;
        
        if (attendance) {
            existingPayment = await paymentRepo()
                .createQueryBuilder('payment')
                .where('payment.attendance = :attendanceId', { attendanceId: attendance.id })
                .orderBy('payment.created_at', 'DESC')
                .getOne();
        } else if (eventId) {
            existingPayment = await paymentRepo()
                .createQueryBuilder('payment')
                .where('payment.event_id = :eventId', { eventId })
                .andWhere('payment.user_id = :userId', { userId })
                .andWhere('payment.status IN (:...statuses)', { statuses: ['pending', 'paid'] })
                .orderBy('payment.created_at', 'DESC')
                .getOne();
            
            if (!existingPayment) {
                const existingAttendance = await attendanceRepo()
                    .createQueryBuilder('d')
                    .leftJoin('d.payment', 'payment')
                    .addSelect([
                        'payment.id',
                        'payment.status',
                        'payment.amount',
                        'payment.paid_at'
                    ])
                    .where('d.event = :eventId', { eventId })
                    .andWhere('d.user = :userId', { userId })
                    .orderBy('d.created_at', 'DESC')
                    .getOne();
                
                if (existingAttendance && existingAttendance.payment) {
                    existingPayment = existingAttendance.payment;
                    attendance = existingAttendance;
                }
            }
        }

        if (existingPayment) {
            if (existingPayment.status === 'paid') {
                return res.status(200).json({
                    message: 'Pembayaran sudah dilakukan',
                    data: {
                        paymentId: existingPayment.id,
                        status: existingPayment.status,
                        invoiceUrl: existingPayment.invoice_url,
                        qrCodeUrl: existingPayment.qr_code_url,
                        amount: existingPayment.amount,
                        expiresAt: existingPayment.expires_at
                    }
                });
            }
            if (existingPayment.status === 'pending') {
                return res.status(200).json({
                    message: 'Pembayaran sudah dibuat',
                    data: {
                        paymentId: existingPayment.id,
                        status: existingPayment.status,
                        invoiceUrl: existingPayment.invoice_url,
                        qrCodeUrl: existingPayment.qr_code_url,
                        amount: existingPayment.amount,
                        expiresAt: existingPayment.expires_at
                    }
                });
            }
        }

        if (!attendance && eventId) {
            const finalPaymentCheck = await paymentRepo()
                .createQueryBuilder('payment')
                .where('payment.event_id = :eventId', { eventId })
                .andWhere('payment.user_id = :userId', { userId })
                .andWhere('payment.status = :status', { status: 'pending' })
                .orderBy('payment.created_at', 'DESC')
                .getOne();
            
            if (finalPaymentCheck) {
                logger.info(`Found existing pending payment ${finalPaymentCheck.id} for event ${eventId} and user ${userId}, returning it`);
                return res.status(200).json({
                    message: 'Pembayaran sudah dibuat',
                    data: {
                        paymentId: finalPaymentCheck.id,
                        status: finalPaymentCheck.status,
                        invoiceUrl: finalPaymentCheck.invoice_url,
                        qrCodeUrl: finalPaymentCheck.qr_code_url,
                        amount: finalPaymentCheck.amount,
                        expiresAt: finalPaymentCheck.expires_at
                    }
                });
            }
        } else if (attendance) {
            const finalPaymentCheck = await paymentRepo()
                .createQueryBuilder('payment')
                .where('payment.attendance = :attendanceId', { attendanceId: attendance.id })
                .andWhere('payment.status = :status', { status: 'pending' })
                .orderBy('payment.created_at', 'DESC')
                .getOne();
            
            if (finalPaymentCheck) {
                logger.info(`Found existing pending payment ${finalPaymentCheck.id} for attendance ${attendance.id}, returning it`);
                return res.status(200).json({
                    message: 'Pembayaran sudah dibuat',
                    data: {
                        paymentId: finalPaymentCheck.id,
                        status: finalPaymentCheck.status,
                        invoiceUrl: finalPaymentCheck.invoice_url,
                        qrCodeUrl: finalPaymentCheck.qr_code_url,
                        amount: finalPaymentCheck.amount,
                        expiresAt: finalPaymentCheck.expires_at
                    }
                });
            }
        }

        const amount = parseFloat(event.harga);

        if (amount <= 0) {
            return res.status(400).json({ message: 'Event ini gratis, tidak perlu pembayaran' });
        }

        // Get user info
        const user = attendance ? attendance.user : req.user;
        const userEmail = user.email || req.user.email;
        const userName = userEmail.split('@')[0];

        // Create Xendit invoice
        const externalId = attendance 
            ? `EVENT-${attendance.id}-${Date.now()}` 
            : `EVENT-${eventId}-${userId}-${Date.now()}`;

        const invoiceData = {
            externalId: externalId,
            amount: amount,
            description: `Pembayaran untuk event: ${event.judul_kegiatan}`,
            invoiceDuration: 3600, // 1 hour in seconds
            customer: {
                givenNames: userName,
                email: userEmail
            },
            customerNotificationPreference: {
                invoiceCreated: ['email'],
                invoiceReminder: ['email'],
                invoiceExpired: ['email'],
                invoicePaid: ['email']
            },
            successRedirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?payment_id={payment_id}`,
            failureRedirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?payment_id={payment_id}`,
            currency: 'IDR',
            paymentMethods: ['QRIS'] // Only QRIS for now
        };

        let xenditInvoice;
        try {
            // In xendit-node v7, createInvoice requires { data: invoiceData } format
            xenditInvoice = await invoiceApi.createInvoice({ data: invoiceData });
            logger.info(`Xendit invoice created: ${xenditInvoice.id}`);
            if (xenditInvoice.invoiceUrl) {
                logger.info(`Found invoiceUrl: ${xenditInvoice.invoiceUrl}`);
            }
        } catch (xenditError) {
            logger.error(`Xendit invoice creation failed: ${xenditError.message}`, {
                stack: xenditError.stack
            });
            return res.status(500).json({ 
                message: 'Gagal membuat invoice pembayaran. Silakan coba lagi.' 
            });
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        if (!attendance && eventId) {
            const existingPaymentWithoutAttendance = await paymentRepo()
                .createQueryBuilder('payment')
                .leftJoinAndSelect('payment.attendance', 'attendance')
                .where('attendance.id IS NULL')
                .andWhere('payment.xendit_invoice_id = :invoiceId', { invoiceId: xenditInvoice.id })
                .getOne();

            if (existingPaymentWithoutAttendance) {
                logger.info(`Found existing payment ${existingPaymentWithoutAttendance.id} without attendance for event ${eventId}`);
                return res.status(200).json({
                    message: 'Pembayaran sudah dibuat',
                    data: {
                        paymentId: existingPaymentWithoutAttendance.id,
                        status: existingPaymentWithoutAttendance.status,
                        invoiceUrl: existingPaymentWithoutAttendance.invoice_url,
                        qrCodeUrl: existingPaymentWithoutAttendance.qr_code_url,
                        amount: existingPaymentWithoutAttendance.amount,
                        expiresAt: existingPaymentWithoutAttendance.expires_at
                    }
                });
            }
            
            logger.info(`Creating payment for paid event ${eventId} without attendance - attendance will be created after payment confirmation`);
        }

        // Get invoice URL - QR code is now handled directly in the invoice iframe
        const invoiceUrl = xenditInvoice.invoiceUrl || xenditInvoice.invoice_url || null;
        
        const paymentData = {
            xendit_invoice_id: xenditInvoice.id,
            amount: amount,
            status: 'pending',
            payment_method: 'QRIS',
            qr_code_url: null, // QR code is now displayed directly in invoice iframe
            invoice_url: invoiceUrl,
            expires_at: expiresAt
        };
        
        if (attendance) {
            paymentData.attendance = { id: attendance.id };
        } else {
            // Explicitly set attendance to null when creating payment without attendance
            // This ensures attendance_id is set to NULL in the database
            paymentData.attendance = null;
            if (eventId) {
                paymentData.event_id = eventId;
                paymentData.user_id = userId;
                logger.info(`Storing eventId=${eventId} and userId=${userId} in payment for later attendance creation`);
            }
        }

        const savedPayment = await AppDataSource.manager.transaction(async (manager) => {
            const repo = manager.getRepository('Payment');
            const created = repo.create(paymentData);
            const saved = await repo.save(created);
            
            if (!saved.xendit_invoice_id || saved.xendit_invoice_id !== xenditInvoice.id) {
                logger.error(`xendit_invoice_id mismatch: expected=${xenditInvoice.id}, saved=${saved.xendit_invoice_id}`);
                saved.xendit_invoice_id = xenditInvoice.id;
                await repo.save(saved);
            }
            
            return saved;
        });

        logger.info(`Payment created: paymentId=${savedPayment.id}, invoiceId=${xenditInvoice.id}, xendit_invoice_id=${savedPayment.xendit_invoice_id}`);

        return res.status(201).json({
            message: 'Invoice pembayaran berhasil dibuat',
            data: {
                paymentId: savedPayment.id,
                status: savedPayment.status,
                invoiceUrl: savedPayment.invoice_url,
                qrCodeUrl: savedPayment.qr_code_url,
                amount: savedPayment.amount,
                expiresAt: savedPayment.expires_at
            }
        });
    } catch (error) {
        logger.error(`createPayment error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get payment status
 */
exports.getPaymentStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { paymentId } = req.params;

        logger.info(`GET /payment/${paymentId}/status by user=${userId}`);

        let payment = await paymentRepo()
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.attendance', 'attendance')
            .leftJoinAndSelect('attendance.user', 'user')
            .where('payment.id = :paymentId', { paymentId })
            .andWhere('(user.id = :userId OR payment.user_id = :userId)', { userId })
            .getOne();

        if (!payment) {
            payment = await paymentRepo()
                .createQueryBuilder('payment')
                .leftJoinAndSelect('payment.attendance', 'attendance')
                .where('payment.id = :paymentId', { paymentId })
                .andWhere('payment.user_id = :userId', { userId })
                .getOne();
        }

        if (!payment) {
            return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });
        }

        // Reload payment to ensure we have all fields including xendit_invoice_id
        if (!payment.xendit_invoice_id) {
            const reloadedPayment = await paymentRepo()
                .createQueryBuilder('payment')
                .select(['payment.id', 'payment.xendit_invoice_id', 'payment.status', 'payment.amount', 'payment.invoice_url', 'payment.qr_code_url', 'payment.paid_at', 'payment.expires_at'])
                .where('payment.id = :paymentId', { paymentId })
                .getRawOne();
            
            if (reloadedPayment && reloadedPayment.payment_xendit_invoice_id) {
                payment.xendit_invoice_id = reloadedPayment.payment_xendit_invoice_id;
                logger.info(`Reloaded payment ${paymentId} with xendit_invoice_id: ${payment.xendit_invoice_id}`);
            } else {
                logger.warn(`Payment ${paymentId} has no xendit_invoice_id in database`);
            }
        }

        // Reload full payment object to ensure xendit_invoice_id is available
        if (!payment.xendit_invoice_id) {
            const fullPayment = await paymentRepo().findOne({ where: { id: paymentId } });
            if (fullPayment && fullPayment.xendit_invoice_id) {
                payment.xendit_invoice_id = fullPayment.xendit_invoice_id;
                logger.info(`Reloaded full payment ${paymentId} with xendit_invoice_id: ${payment.xendit_invoice_id}`);
            }
        }

        if (payment.status === 'pending' && payment.xendit_invoice_id) {
            try {
                // Validate xendit_invoice_id
                const invoiceId = payment.xendit_invoice_id?.trim();
                if (!invoiceId || invoiceId === '' || invoiceId === 'null' || invoiceId === 'undefined') {
                    logger.warn(`Payment ${paymentId} has invalid xendit_invoice_id: "${invoiceId}", skipping Xendit check`);
                } else {
                    logger.info(`Checking Xendit invoice status for payment ${paymentId}, invoiceId: ${invoiceId}, type: ${typeof invoiceId}`);
                    // Ensure invoiceId is a valid non-empty string
                    const cleanInvoiceId = String(invoiceId).trim();
                    if (!cleanInvoiceId || cleanInvoiceId.length === 0) {
                        throw new Error(`Invalid invoiceId after cleaning: "${cleanInvoiceId}"`);
                    }
                    
                    // Xendit Node SDK v7 getInvoiceById format
                    // Error message indicates: "requestParameters.invoiceId" - so invoiceId should be at top level
                    // Format: { invoiceId: string } (NOT wrapped in 'data')
                    const requestParams = { invoiceId: cleanInvoiceId };
                    logger.debug(`Calling getInvoiceById with params:`, JSON.stringify(requestParams));
                    const xenditInvoice = await invoiceApi.getInvoiceById(requestParams);

                    // Update payment status from Xendit
                    let newStatus = payment.status;
                    if (xenditInvoice.status === 'PAID') {
                        newStatus = 'paid';
                    } else if (xenditInvoice.status === 'EXPIRED') {
                        newStatus = 'expired';
                    } else if (xenditInvoice.status === 'FAILED') {
                        newStatus = 'failed';
                    }

                    // Update invoice URL if available and different
                    if (xenditInvoice.invoiceUrl && xenditInvoice.invoiceUrl !== payment.invoice_url) {
                        payment.invoice_url = xenditInvoice.invoiceUrl;
                    }

                    if (newStatus !== payment.status) {
                        payment.status = newStatus;
                        if (newStatus === 'paid') {
                            payment.paid_at = new Date();
                        }
                        await paymentRepo().save(payment);
                        
                        // Create attendance if payment is paid and attendance doesn't exist
                        if (newStatus === 'paid') {
                            await createAttendanceForPaidPayment(payment);
                        }
                    } else if (xenditInvoice.invoiceUrl && xenditInvoice.invoiceUrl !== payment.invoice_url) {
                        await paymentRepo().save(payment);
                    }
                }
            } catch (xenditError) {
                logger.error(`Xendit status check failed: ${xenditError.message}`, {
                    paymentId: payment.id,
                    invoiceId: payment.xendit_invoice_id,
                    invoiceIdType: typeof payment.xendit_invoice_id,
                    invoiceIdValue: payment.xendit_invoice_id,
                    error: xenditError.message,
                    stack: xenditError.stack
                });
                // Continue with existing status - don't fail the request
            }
        } else if (payment.status === 'pending' && !payment.xendit_invoice_id) {
            logger.warn(`Payment ${paymentId} is pending but has no xendit_invoice_id`);
        }
        
        // If payment is already paid but attendance doesn't exist, create it
        if (payment.status === 'paid' && !payment.attendance && payment.event_id && payment.user_id) {
            logger.info(`Payment ${paymentId} is paid but has no attendance, creating attendance now`);
            await createAttendanceForPaidPayment(payment);
        }
        
        // Reload payment to get updated attendance if it was just created
        payment = await paymentRepo()
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.attendance', 'attendance')
            .where('payment.id = :paymentId', { paymentId })
            .getOne();

        return res.status(200).json({
            message: 'Status pembayaran berhasil diambil',
            data: {
                paymentId: payment.id,
                status: payment.status,
                amount: payment.amount,
                invoiceUrl: payment.invoice_url,
                qrCodeUrl: payment.qr_code_url,
                paidAt: payment.paid_at,
                expiresAt: payment.expires_at
            }
        });
    } catch (error) {
        logger.error(`getPaymentStatus error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get payment by event ID for current user
 */
exports.getPaymentByEventId = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { eventId } = req.params;

        logger.info(`GET /payment/events/${eventId} by user=${userId}`);

        if (!eventId) {
            return res.status(400).json({ message: 'Event ID diperlukan' });
        }

        // Find payment by event_id and user_id
        let payment = await paymentRepo()
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.attendance', 'attendance')
            .where('payment.event_id = :eventId', { eventId: parseInt(eventId) })
            .andWhere('payment.user_id = :userId', { userId })
            .orderBy('payment.created_at', 'DESC')
            .getOne();

        // If no payment found by event_id, try to find via attendance
        if (!payment) {
            const attendance = await attendanceRepo()
                .createQueryBuilder('attendance')
                .leftJoinAndSelect('attendance.payment', 'payment')
                .where('attendance.event = :eventId', { eventId: parseInt(eventId) })
                .andWhere('attendance.user = :userId', { userId })
                .orderBy('attendance.created_at', 'DESC')
                .getOne();

            if (attendance && attendance.payment) {
                payment = attendance.payment;
            }
        }

        if (!payment) {
            return res.status(404).json({ message: 'Pembayaran tidak ditemukan untuk event ini' });
        }

        return res.status(200).json({
            message: 'Pembayaran berhasil diambil',
            data: {
                paymentId: payment.id,
                status: payment.status,
                amount: payment.amount,
                invoiceUrl: payment.invoice_url,
                qrCodeUrl: payment.qr_code_url,
                paidAt: payment.paid_at,
                expiresAt: payment.expires_at
            }
        });
    } catch (error) {
        logger.error(`getPaymentByEventId error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get all pending payments for current user
 */
exports.getPendingPayments = async (req, res) => {
    try {
        const userId = req.user?.id;

        logger.info(`GET /payment/pending by user=${userId}`);

        // Get all pending payments for this user
        const payments = await paymentRepo()
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.event', 'event')
            .leftJoinAndSelect('event.category', 'category')
            .where('payment.user_id = :userId', { userId })
            .andWhere('payment.status IN (:...statuses)', { statuses: ['pending', 'expired', 'failed'] })
            .orderBy('payment.created_at', 'DESC')
            .getMany();

        // Format response with event details
        const formattedPayments = payments.map(payment => ({
            paymentId: payment.id,
            status: payment.status,
            amount: payment.amount,
            invoiceUrl: payment.invoice_url,
            qrCodeUrl: payment.qr_code_url,
            expiresAt: payment.expires_at,
            createdAt: payment.created_at,
            paidAt: payment.paid_at,
            event: payment.event ? {
                id: payment.event.id,
                judul_kegiatan: payment.event.judul_kegiatan,
                slug: payment.event.slug,
                lokasi_kegiatan: payment.event.lokasi_kegiatan,
                waktu_mulai: payment.event.waktu_mulai,
                waktu_berakhir: payment.event.waktu_berakhir,
                kategori: payment.event.category ? {
                    id: payment.event.category.id,
                    nama_kategori: payment.event.category.nama_kategori,
                    slug: payment.event.category.slug
                } : null
            } : null
        }));

        return res.status(200).json({
            message: 'Pembayaran pending berhasil diambil',
            data: formattedPayments
        });
    } catch (error) {
        logger.error(`getPendingPayments error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get all payments (including paid) for current user
 */
exports.getAllPayments = async (req, res) => {
    try {
        const userId = req.user?.id;

        logger.info(`GET /payment/all by user=${userId}`);

        // Get all payments for this user (including paid)
        const payments = await paymentRepo()
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.event', 'event')
            .leftJoinAndSelect('event.category', 'category')
            .where('payment.user_id = :userId', { userId })
            .orderBy('payment.created_at', 'DESC')
            .getMany();

        // Format response with event details
        const formattedPayments = payments.map(payment => ({
            paymentId: payment.id,
            status: payment.status,
            amount: payment.amount,
            invoiceUrl: payment.invoice_url,
            qrCodeUrl: payment.qr_code_url,
            expiresAt: payment.expires_at,
            createdAt: payment.created_at,
            paidAt: payment.paid_at,
            event: payment.event ? {
                id: payment.event.id,
                judul_kegiatan: payment.event.judul_kegiatan,
                slug: payment.event.slug,
                lokasi_kegiatan: payment.event.lokasi_kegiatan,
                waktu_mulai: payment.event.waktu_mulai,
                waktu_berakhir: payment.event.waktu_berakhir,
                kategori: payment.event.category ? {
                    id: payment.event.category.id,
                    nama_kategori: payment.event.category.nama_kategori,
                    slug: payment.event.category.slug
                } : null
            } : null
        }));

        return res.status(200).json({
            message: 'Semua pembayaran berhasil diambil',
            data: formattedPayments
        });
    } catch (error) {
        logger.error(`getAllPayments error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Webhook handler for Xendit payment notifications
 */
exports.handleWebhook = async (req, res) => {
    try {
        const webhookToken = req.headers['x-callback-token'];
        const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

        // Verify webhook token
        if (webhookToken !== expectedToken) {
            logger.warn('Invalid webhook token received');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const event = req.body;
        logger.info(`Xendit webhook received: ${event.event}, invoiceId=${event.data?.id}`);

        if (event.event === 'invoice.paid' || event.event === 'invoice.expired' || event.event === 'invoice.failed') {
            const invoiceId = event.data.id;
            const invoiceStatus = event.data.status;

            // Find payment by Xendit invoice ID
            const payment = await paymentRepo()
                .createQueryBuilder('payment')
                .leftJoinAndSelect('payment.attendance', 'attendance')
                .leftJoinAndSelect('payment.event', 'event')
                .leftJoinAndSelect('payment.user', 'user')
                .where('payment.xendit_invoice_id = :invoiceId', { invoiceId })
                .getOne();

            if (!payment) {
                logger.warn(`Payment not found for invoice: ${invoiceId}`);
                return res.status(404).json({ message: 'Payment not found' });
            }

            // Update payment status
            let newStatus = payment.status;
            if (invoiceStatus === 'PAID') {
                newStatus = 'paid';
                payment.paid_at = new Date();
            } else if (invoiceStatus === 'EXPIRED') {
                newStatus = 'expired';
            } else if (invoiceStatus === 'FAILED') {
                newStatus = 'failed';
            }

            payment.status = newStatus;
            await paymentRepo().save(payment);

            logger.info(`Payment status updated: paymentId=${payment.id}, status=${newStatus}`);

            if (newStatus === 'paid') {
                // Create attendance if payment is paid and attendance doesn't exist
                await createAttendanceForPaidPayment(payment);
            }
        }

        return res.status(200).json({ message: 'Webhook processed' });
    } catch (error) {
        logger.error(`handleWebhook error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: 'Internal server error' });
    }
};

