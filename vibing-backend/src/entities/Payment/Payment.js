const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Payment',
    tableName: 'payments',
    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true
        },
        
        event_id: {
            type: 'int',
            nullable: true
        },
        user_id: {
            type: 'int',
            nullable: true
        },
        xendit_invoice_id: {
            type: 'varchar',
            length: 255,
            unique: true,
            nullable: true
        },
        xendit_payment_id: {
            type: 'varchar',
            length: 255,
            unique: true,
            nullable: true
        },
        amount: {
            type: 'decimal',
            precision: 10,
            scale: 2,
            nullable: false
        },
        status: {
            type: 'enum',
            enum: ['pending', 'paid', 'expired', 'failed', 'cancelled'],
            default: 'pending',
            nullable: false
        },
        payment_method: {
            type: 'varchar',
            length: 50,
            nullable: true
        },
        qr_code_url: {
            type: 'text',
            nullable: true
        },
        invoice_url: {
            type: 'text',
            nullable: true
        },
        paid_at: {
            type: 'datetime',
            nullable: true
        },
        expires_at: {
            type: 'datetime',
            nullable: true
        },
        created_at: {
            type: 'datetime',
            createDate: true,
            nullable: true
        },
        updated_at: {
            type: 'datetime',
            updateDate: true,
            nullable: true
        }
    },
    relations: {
        attendance: {
            target: 'Attendance',
            type: 'one-to-one',
            joinColumn: { name: 'attendance_id' },
            inverseSide: 'payment',
            nullable: true
        },
        event: {
            target: 'Event',
            type: 'many-to-one',
            joinColumn: { name: 'event_id' },
            nullable: true
        },
        user: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'user_id' },
            nullable: true
        }
    }
});

