const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'GlobalCertificateTemplate',
    tableName: 'global_certificate_templates',
    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true
        },
        name: {
            type: 'varchar',
            length: 255,
            nullable: false
        },
        description: {
            type: 'text',
            nullable: true
        },
        background_image: {
            type: 'mediumtext',
            nullable: true
        },
        background_size: {
            type: 'varchar',
            length: 50,
            default: 'cover',
            nullable: false
        },
        elements: {
            type: 'json',
            nullable: false
        },
        is_default: {
            type: 'tinyint',
            default: 0,
            nullable: false
        },
        is_active: {
            type: 'tinyint',
            default: 1,
            nullable: false
        },
        created_by: {
            type: 'int',
            nullable: false
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
        creator: {
            target: 'Admin',
            type: 'many-to-one',
            joinColumn: { name: 'created_by' },
            inverseSide: 'globalCertificateTemplates'
        }
    },
    indices: [
        {
            name: 'idx_is_default',
            columns: ['is_default']
        },
        {
            name: 'idx_is_active',
            columns: ['is_active']
        }
    ]
});

