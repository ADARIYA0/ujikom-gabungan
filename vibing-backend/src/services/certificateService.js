const { AppDataSource } = require('../config/database');
const logger = require('../utils/logger');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

const certificateTemplateRepo = () => AppDataSource.getRepository('GlobalCertificateTemplate');
const adminRepo = () => AppDataSource.getRepository('Admin');
const attendanceRepo = () => AppDataSource.getRepository('Attendance');
const userRepo = () => AppDataSource.getRepository('User');
const eventRepo = () => AppDataSource.getRepository('Event');

// ========== Template Management Functions ==========

// Get all global certificate templates
const getGlobalCertificateTemplates = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      isDefault,
    } = filters;

    const skip = (page - 1) * limit;

    const queryBuilder = certificateTemplateRepo()
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.creator', 'creator')
      .orderBy('template.created_at', 'DESC');

    if (isActive !== undefined) {
      queryBuilder.andWhere('template.is_active = :isActive', { isActive: isActive ? 1 : 0 });
    }
    if (isDefault !== undefined) {
      queryBuilder.andWhere('template.is_default = :isDefault', { isDefault: isDefault ? 1 : 0 });
    }

    const [templates, total] = await Promise.all([
      queryBuilder
        .skip(skip)
        .take(parseInt(limit))
        .getMany(),
      queryBuilder.getCount(),
    ]);

    // Format response to include creator info
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      backgroundImage: template.background_image,
      backgroundSize: template.background_size,
      elements: template.elements,
      isDefault: template.is_default === 1,
      isActive: template.is_active === 1,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      creator: template.creator ? {
        id: template.creator.id,
        email: template.creator.email
      } : null
    }));

    return {
      templates: formattedTemplates,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error('Get global certificate templates error:', error);
    throw error;
  }
};

// Get default global certificate template
const getDefaultGlobalCertificateTemplate = async () => {
  try {
    const template = await certificateTemplateRepo()
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.creator', 'creator')
      .where('template.is_default = :isDefault', { isDefault: 1 })
      .andWhere('template.is_active = :isActive', { isActive: 1 })
      .getOne();

    if (!template) {
      throw new Error('No default certificate template found');
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      backgroundImage: template.background_image,
      backgroundSize: template.background_size,
      elements: template.elements,
      isDefault: template.is_default === 1,
      isActive: template.is_active === 1,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      creator: template.creator ? {
        id: template.creator.id,
        email: template.creator.email
      } : null
    };
  } catch (error) {
    logger.error('Get default global certificate template error:', error);
    throw error;
  }
};

// Get global certificate template by ID
const getGlobalCertificateTemplateById = async (templateId) => {
  try {
    const template = await certificateTemplateRepo()
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.creator', 'creator')
      .where('template.id = :templateId', { templateId: parseInt(templateId) })
      .getOne();

    if (!template) {
      throw new Error('Certificate template not found');
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      backgroundImage: template.background_image,
      backgroundSize: template.background_size,
      elements: template.elements,
      isDefault: template.is_default === 1,
      isActive: template.is_active === 1,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      creator: template.creator ? {
        id: template.creator.id,
        email: template.creator.email
      } : null
    };
  } catch (error) {
    logger.error('Get global certificate template by ID error:', error);
    throw error;
  }
};

// Create global certificate template
const createGlobalCertificateTemplate = async (templateData, creatorId) => {
  try {
    const {
      name,
      description,
      backgroundImage,
      backgroundSize = 'cover',
      elements,
    } = templateData;

    // Validate required fields
    if (!name || !elements || !Array.isArray(elements)) {
      throw new Error('Name and elements array are required');
    }

    // If this is being set as default, unset other defaults
    if (templateData.isDefault) {
      await certificateTemplateRepo()
        .createQueryBuilder()
        .update('GlobalCertificateTemplate')
        .set({ is_default: 0 })
        .where('is_default = :isDefault', { isDefault: 1 })
        .execute();
    }

    const template = certificateTemplateRepo().create({
      name,
      description: description || null,
      background_image: backgroundImage || null,
      background_size: backgroundSize,
      elements: JSON.stringify(elements),
      is_default: templateData.isDefault ? 1 : 0,
      is_active: templateData.isActive !== undefined ? (templateData.isActive ? 1 : 0) : 1,
      created_by: creatorId,
    });

    const saved = await certificateTemplateRepo().save(template);

    // Reload with creator relation
    const templateWithCreator = await certificateTemplateRepo()
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.creator', 'creator')
      .where('template.id = :id', { id: saved.id })
      .getOne();

    logger.info(`Global certificate template created: ${saved.id} by user: ${creatorId}`);

    return {
      id: templateWithCreator.id,
      name: templateWithCreator.name,
      description: templateWithCreator.description,
      backgroundImage: templateWithCreator.background_image,
      backgroundSize: templateWithCreator.background_size,
      elements: typeof templateWithCreator.elements === 'string' 
        ? JSON.parse(templateWithCreator.elements) 
        : templateWithCreator.elements,
      isDefault: templateWithCreator.is_default === 1,
      isActive: templateWithCreator.is_active === 1,
      createdAt: templateWithCreator.created_at,
      updatedAt: templateWithCreator.updated_at,
      creator: templateWithCreator.creator ? {
        id: templateWithCreator.creator.id,
        email: templateWithCreator.creator.email
      } : null
    };
  } catch (error) {
    logger.error('Create global certificate template error:', error);
    throw error;
  }
};

// Update global certificate template
const updateGlobalCertificateTemplate = async (templateId, templateData, updaterId) => {
  try {
    const existingTemplate = await certificateTemplateRepo()
      .createQueryBuilder('template')
      .where('template.id = :id', { id: parseInt(templateId) })
      .getOne();

    if (!existingTemplate) {
      throw new Error('Certificate template not found');
    }

    // If this is being set as default, unset other defaults
    if (templateData.isDefault) {
      await certificateTemplateRepo()
        .createQueryBuilder()
        .update('GlobalCertificateTemplate')
        .set({ is_default: 0 })
        .where('is_default = :isDefault', { isDefault: 1 })
        .andWhere('id != :id', { id: parseInt(templateId) })
        .execute();
    }

    const updateData = {};
    if (templateData.name !== undefined) updateData.name = templateData.name;
    if (templateData.description !== undefined) updateData.description = templateData.description;
    if (templateData.backgroundImage !== undefined) updateData.background_image = templateData.backgroundImage;
    if (templateData.backgroundSize !== undefined) updateData.background_size = templateData.backgroundSize;
    if (templateData.elements !== undefined) updateData.elements = JSON.stringify(templateData.elements);
    if (templateData.isDefault !== undefined) updateData.is_default = templateData.isDefault ? 1 : 0;
    if (templateData.isActive !== undefined) updateData.is_active = templateData.isActive ? 1 : 0;

    await certificateTemplateRepo()
      .createQueryBuilder()
      .update('GlobalCertificateTemplate')
      .set(updateData)
      .where('id = :id', { id: parseInt(templateId) })
      .execute();

    // Reload with creator relation
    const updatedTemplate = await certificateTemplateRepo()
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.creator', 'creator')
      .where('template.id = :id', { id: parseInt(templateId) })
      .getOne();

    logger.info(`Global certificate template updated: ${templateId} by user: ${updaterId}`);

    return {
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      description: updatedTemplate.description,
      backgroundImage: updatedTemplate.background_image,
      backgroundSize: updatedTemplate.background_size,
      elements: typeof updatedTemplate.elements === 'string' 
        ? JSON.parse(updatedTemplate.elements) 
        : updatedTemplate.elements,
      isDefault: updatedTemplate.is_default === 1,
      isActive: updatedTemplate.is_active === 1,
      createdAt: updatedTemplate.created_at,
      updatedAt: updatedTemplate.updated_at,
      creator: updatedTemplate.creator ? {
        id: updatedTemplate.creator.id,
        email: updatedTemplate.creator.email
      } : null
    };
  } catch (error) {
    logger.error('Update global certificate template error:', error);
    throw error;
  }
};

// Delete global certificate template
const deleteGlobalCertificateTemplate = async (templateId, deleterId) => {
  try {
    const existingTemplate = await certificateTemplateRepo()
      .createQueryBuilder('template')
      .where('template.id = :id', { id: parseInt(templateId) })
      .getOne();

    if (!existingTemplate) {
      throw new Error('Certificate template not found');
    }

    // Don't allow deletion of default template
    if (existingTemplate.is_default === 1) {
      throw new Error('Cannot delete default certificate template');
    }

    await certificateTemplateRepo()
      .createQueryBuilder()
      .delete()
      .from('GlobalCertificateTemplate')
      .where('id = :id', { id: parseInt(templateId) })
      .execute();

    logger.info(`Global certificate template deleted: ${templateId} by user: ${deleterId}`);

    return { success: true };
  } catch (error) {
    logger.error('Delete global certificate template error:', error);
    throw error;
  }
};

// Set template as default
const setDefaultGlobalCertificateTemplate = async (templateId, updaterId) => {
  try {
    const existingTemplate = await certificateTemplateRepo()
      .createQueryBuilder('template')
      .where('template.id = :id', { id: parseInt(templateId) })
      .getOne();

    if (!existingTemplate) {
      throw new Error('Certificate template not found');
    }

    if (existingTemplate.is_active === 0) {
      throw new Error('Cannot set inactive template as default');
    }

    // Unset other defaults
    await certificateTemplateRepo()
      .createQueryBuilder()
      .update('GlobalCertificateTemplate')
      .set({ is_default: 0 })
      .where('is_default = :isDefault', { isDefault: 1 })
      .andWhere('id != :id', { id: parseInt(templateId) })
      .execute();

    // Set this template as default
    await certificateTemplateRepo()
      .createQueryBuilder()
      .update('GlobalCertificateTemplate')
      .set({ is_default: 1 })
      .where('id = :id', { id: parseInt(templateId) })
      .execute();

    // Reload with creator relation
    const updatedTemplate = await certificateTemplateRepo()
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.creator', 'creator')
      .where('template.id = :id', { id: parseInt(templateId) })
      .getOne();

    logger.info(`Global certificate template set as default: ${templateId} by user: ${updaterId}`);

    return {
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      description: updatedTemplate.description,
      backgroundImage: updatedTemplate.background_image,
      backgroundSize: updatedTemplate.background_size,
      elements: typeof updatedTemplate.elements === 'string' 
        ? JSON.parse(updatedTemplate.elements) 
        : updatedTemplate.elements,
      isDefault: updatedTemplate.is_default === 1,
      isActive: updatedTemplate.is_active === 1,
      createdAt: updatedTemplate.created_at,
      updatedAt: updatedTemplate.updated_at,
      creator: updatedTemplate.creator ? {
        id: updatedTemplate.creator.id,
        email: updatedTemplate.creator.email
      } : null
    };
  } catch (error) {
    logger.error('Set default global certificate template error:', error);
    throw error;
  }
};

// Get template usage statistics
const getTemplateUsageStats = async (templateId) => {
  try {
    const template = await certificateTemplateRepo()
      .createQueryBuilder('template')
      .where('template.id = :id', { id: parseInt(templateId) })
      .getOne();

    if (!template) {
      throw new Error('Certificate template not found');
    }

    // Count events that might use certificates (events with sertifikat_kegiatan)
    const eventsUsingTemplate = await eventRepo()
      .createQueryBuilder('event')
      .where('event.sertifikat_kegiatan IS NOT NULL')
      .getCount();

    // Note: In this system, certificates are stored as files, not in a separate table
    // So we can't count actual certificates generated
    const totalCertificates = 0; // Would need to track this separately if needed

    return {
      templateId: template.id,
      templateName: template.name,
      eventsUsingTemplate,
      totalCertificates,
      isDefault: template.is_default === 1,
      isActive: template.is_active === 1,
    };
  } catch (error) {
    logger.error('Get template usage stats error:', error);
    throw error;
  }
};

// ========== Certificate Generation Functions ==========

// Generate certificate PDF
const generateCertificatePdf = async (attendanceId, userId) => {
  try {
    // Get attendance with user and event
    let attendance;
    try {
      attendance = await attendanceRepo()
        .createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.user', 'user')
        .leftJoinAndSelect('attendance.event', 'event')
        .where('attendance.id = :attendanceId', { attendanceId: parseInt(attendanceId) })
        .andWhere('attendance.user_id = :userId', { userId: parseInt(userId) })
        .getOne();
    } catch (err) {
      // Fallback: try with user relation
      logger.warn(`First query failed, trying with user relation: ${err.message}`);
      attendance = await attendanceRepo()
        .createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.user', 'user')
        .leftJoinAndSelect('attendance.event', 'event')
        .where('attendance.id = :attendanceId', { attendanceId: parseInt(attendanceId) })
        .andWhere('attendance.user = :userId', { userId: parseInt(userId) })
        .getOne();
    }

    if (!attendance) {
      throw new Error('Attendance not found');
    }

    // Check if user has attended
    if (attendance.status_absen !== 'hadir') {
      throw new Error('User has not attended this event');
    }

    // Get template from event if available, otherwise use default template
    let template = null;
    
    // Try to get event-specific template first
    if (attendance.event.certificate_template_id) {
      logger.info(`Looking for event-specific template: ${attendance.event.certificate_template_id}`);
      template = await certificateTemplateRepo()
        .createQueryBuilder('template')
        .where('template.id = :templateId', { templateId: attendance.event.certificate_template_id })
        .andWhere('template.is_active = :isActive', { isActive: 1 })
        .getOne();
      
      if (template) {
        logger.info(`Found event-specific template: ${template.id} - ${template.name}`);
      } else {
        logger.warn(`Event-specific template ${attendance.event.certificate_template_id} not found or inactive`);
      }
    }

    // Fallback to default template if event doesn't have specific template
    if (!template) {
      logger.info('Looking for default template...');
      template = await certificateTemplateRepo()
        .createQueryBuilder('template')
        .where('template.is_default = :isDefault', { isDefault: 1 })
        .andWhere('template.is_active = :isActive', { isActive: 1 })
        .getOne();
      
      if (template) {
        logger.info(`Found default template: ${template.id} - ${template.name}`);
      } else {
        logger.warn('No default template found');
      }
    }

    // If still no template, try to get any active template as last resort
    if (!template) {
      logger.warn('No default template found, trying to get any active template...');
      template = await certificateTemplateRepo()
        .createQueryBuilder('template')
        .where('template.is_active = :isActive', { isActive: 1 })
        .orderBy('template.is_default', 'DESC')
        .addOrderBy('template.created_at', 'DESC')
        .limit(1)
        .getOne();
      
      if (template) {
        logger.info(`Found active template (fallback): ${template.id} - ${template.name}`);
      } else {
        logger.error('No active certificate template found in database');
      }
    }

    if (!template) {
      throw new Error('No certificate template found. Please create a certificate template in the admin panel.');
    }

    // Get user's nama_asli (real name) - prioritize nama_asli, fallback to email username
    const user = attendance.user;
    // Use nama_asli if available, otherwise use email username (part before @)
    const participantName = (user.nama_asli && user.nama_asli.trim()) ? user.nama_asli.trim() : (user.email ? user.email.split('@')[0] : 'Peserta');
    const eventTitle = attendance.event.judul_kegiatan;

    // Parse elements if string
    let elements = template.elements;
    if (typeof elements === 'string') {
      elements = JSON.parse(elements);
    }

    // Replace dynamic text in elements
    const processedElements = elements.map(element => {
      if (element.type === 'text' && element.isDynamic) {
        let text = element.text || '';
        if (element.dynamicType === 'user_name') {
          // Replace all occurrences of [Nama Peserta] with actual participant name
          text = text.replace(/\[Nama Peserta\]/g, participantName);
          // Also replace common variations
          text = text.replace(/\[NAMA PESERTA\]/g, participantName);
          text = text.replace(/\[nama peserta\]/g, participantName);
        } else if (element.dynamicType === 'event_name') {
          // Replace all occurrences of [Nama Event] with actual event title
          text = text.replace(/\[Nama Event\]/g, eventTitle);
          text = text.replace(/\[NAMA EVENT\]/g, eventTitle);
          text = text.replace(/\[nama event\]/g, eventTitle);
        }
        return { ...element, text };
      }
      return element;
    });

    // Generate HTML
    const html = generateCertificateHTML(template.background_image, template.background_size, processedElements);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set viewport to match certificate dimensions
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2 // Higher DPI for better quality
    });
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    // Generate PDF with exact dimensions to avoid white space
    const pdf = await page.pdf({
      width: '1200px',
      height: '800px',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });
    await browser.close();

    // Save PDF
    const uploadsDir = path.join(__dirname, '../../uploads/certificates');
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `certificate_${attendanceId}_${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    await fs.writeFile(filepath, pdf);

    return {
      success: true,
      filepath,
      filename,
      url: `/uploads/certificates/${filename}`
    };
  } catch (error) {
    logger.error('Generate certificate error:', error);
    throw error;
  }
};

// Generate HTML from template
const generateCertificateHTML = (backgroundImage, backgroundSize, elements) => {
  // Map font family names to Google Fonts names
  // Note: Font names from frontend should match exactly
  const fontFamilyMap = {
    'Ephesis': 'Ephesis',
    'Ephesis (Elegan)': 'Ephesis',
    'Great Vibes': 'Great Vibes',
    'Great Vibes (Elegan)': 'Great Vibes',
    'Dancing Script': 'Dancing Script',
    'Dancing Script (Elegan)': 'Dancing Script',
    'Allura': 'Allura',
    'Arial': 'Arial, sans-serif',
    'Inter': 'Inter, sans-serif',
    'Times New Roman': 'Times New Roman, serif',
    'Courier New': 'Courier New, monospace',
    'Georgia': 'Georgia, serif',
    'Verdana': 'Verdana, sans-serif',
    'Helvetica': 'Helvetica, sans-serif',
  };

  // Check if elements are from old 800x600 canvas (backward compatibility)
  // If max coordinates suggest old canvas size, scale them
  const maxX = elements.length > 0 ? Math.max(...elements.map(el => el.position?.x || 0)) : 0;
  const maxY = elements.length > 0 ? Math.max(...elements.map(el => el.position?.y || 0)) : 0;
  const isOldCanvas = maxX <= 850 && maxY <= 650; // Old canvas was 800x600
  
  // Scale factors: 1200/800 = 1.5, 800/600 = 1.333...
  const scaleX = isOldCanvas ? 1.5 : 1;
  const scaleY = isOldCanvas ? (800 / 600) : 1;

  const elementsHTML = elements.map(element => {
    if (element.type === 'text') {
      // Get font family, with fallback
      const fontFamily = fontFamilyMap[element.fontFamily] || element.fontFamily || 'Arial, sans-serif';
      
      // Scale position and dimensions if from old canvas
      const x = (element.position?.x || 0) * scaleX;
      const y = (element.position?.y || 0) * scaleY;
      const width = element.width ? element.width * scaleX : null;
      const height = element.height ? element.height * scaleY : null;
      const fontSize = (element.fontSize || 16) * (isOldCanvas ? Math.min(scaleX, scaleY) : 1);
      
      // Handle width and height properly
      const widthStyle = width ? `${width}px` : 'auto';
      const heightStyle = height ? `${height}px` : 'auto';
      
      // Ensure all style properties are preserved
      const style = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${widthStyle};
        height: ${heightStyle};
        font-size: ${fontSize}px;
        font-family: ${fontFamily.includes('Ephesis') || fontFamily.includes('Great Vibes') || fontFamily.includes('Dancing Script') || fontFamily.includes('Allura')
          ? `'${fontFamily}', cursive` 
          : fontFamily.includes('Inter')
          ? `'${fontFamily}', sans-serif`
          : fontFamily};
        color: ${element.color || '#000000'};
        font-weight: ${element.fontWeight || 'normal'};
        text-align: ${element.textAlign || 'left'};
        white-space: ${element.width ? 'normal' : 'nowrap'};
        overflow: hidden;
        word-wrap: break-word;
        box-sizing: border-box;
      `.trim().replace(/\s+/g, ' ');
      
      return `<div style="${style}">${element.text || ''}</div>`;
    } else if (element.type === 'signature') {
      // Scale position and dimensions if from old canvas
      const x = (element.position?.x || 0) * scaleX;
      const y = (element.position?.y || 0) * scaleY;
      const width = (element.width || 200) * scaleX;
      const height = (element.height || 100) * scaleY;
      
      return `
        <div style="
          position: absolute;
          left: ${x}px;
          top: ${y}px;
          width: ${width}px;
          height: ${height}px;
        ">
          <img src="${element.signatureData}" style="width: 100%; height: 100%; object-fit: contain;" />
          ${element.label ? `<div style="font-size: 12px; text-align: center; margin-top: 4px;">${element.label}</div>` : ''}
        </div>
      `;
    }
    return '';
  }).join('');

  // Determine body dimensions based on background size
  // Use A4 landscape dimensions (1200x800) but allow background to fill properly
  const bodyWidth = 1200;
  const bodyHeight = 800;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Ephesis&family=Great+Vibes&family=Dancing+Script&family=Allura&family=Inter:wght@400;500;600;700&display=swap');
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html {
          width: ${bodyWidth}px;
          height: ${bodyHeight}px;
          margin: 0;
          padding: 0;
        }
        body {
          width: ${bodyWidth}px;
          height: ${bodyHeight}px;
          margin: 0;
          padding: 0;
          position: relative;
          overflow: hidden;
          background-image: url('${backgroundImage}');
          background-size: ${backgroundSize || 'cover'};
          background-position: center center;
          background-repeat: no-repeat;
          background-color: #ffffff;
          display: block;
        }
      </style>
    </head>
    <body>
      ${elementsHTML}
    </body>
    </html>
  `;
};

module.exports = {
  // Template management
  getGlobalCertificateTemplates,
  getDefaultGlobalCertificateTemplate,
  getGlobalCertificateTemplateById,
  createGlobalCertificateTemplate,
  updateGlobalCertificateTemplate,
  deleteGlobalCertificateTemplate,
  setDefaultGlobalCertificateTemplate,
  getTemplateUsageStats,
  // Certificate generation
  generateCertificatePdf,
};

