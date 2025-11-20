const certificateService = require('../services/certificateService');
const logger = require('../utils/logger');

// Get all global certificate templates
const getGlobalCertificateTemplates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      isDefault,
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      isDefault: isDefault !== undefined ? isDefault === 'true' : undefined,
    };

    const result = await certificateService.getGlobalCertificateTemplates(filters);

    res.status(200).json({
      success: true,
      message: 'Global certificate templates retrieved successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Get global certificate templates controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve global certificate templates',
    });
  }
};

// Get default global certificate template
const getDefaultGlobalCertificateTemplate = async (req, res) => {
  try {
    const template = await certificateService.getDefaultGlobalCertificateTemplate();

    res.status(200).json({
      success: true,
      message: 'Default global certificate template retrieved successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Get default global certificate template controller error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Default certificate template not found',
    });
  }
};

// Get global certificate template by ID
const getGlobalCertificateTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await certificateService.getGlobalCertificateTemplateById(templateId);

    res.status(200).json({
      success: true,
      message: 'Global certificate template retrieved successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Get global certificate template by ID controller error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Certificate template not found',
    });
  }
};

// Create global certificate template
const createGlobalCertificateTemplate = async (req, res) => {
  try {
    const templateData = req.body;
    const creatorId = req.user?.id;

    // Validate required fields
    if (!templateData.name) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required',
      });
    }

    if (!templateData.elements || !Array.isArray(templateData.elements)) {
      return res.status(400).json({
        success: false,
        message: 'Template elements array is required',
      });
    }

    const template = await certificateService.createGlobalCertificateTemplate(
      templateData,
      creatorId
    );

    res.status(201).json({
      success: true,
      message: 'Global certificate template created successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Create global certificate template controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create global certificate template',
    });
  }
};

// Update global certificate template
const updateGlobalCertificateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const templateData = req.body;
    const updaterId = req.user?.id;

    const template = await certificateService.updateGlobalCertificateTemplate(
      templateId,
      templateData,
      updaterId
    );

    res.status(200).json({
      success: true,
      message: 'Global certificate template updated successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Update global certificate template controller error:', error);
    if (error.message === 'Certificate template not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update global certificate template',
      });
    }
  }
};

// Delete global certificate template
const deleteGlobalCertificateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const deleterId = req.user?.id;

    await certificateService.deleteGlobalCertificateTemplate(templateId, deleterId);

    res.status(200).json({
      success: true,
      message: 'Global certificate template deleted successfully',
    });
  } catch (error) {
    logger.error('Delete global certificate template controller error:', error);
    if (error.message === 'Certificate template not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    } else if (error.message === 'Cannot delete default certificate template') {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete global certificate template',
      });
    }
  }
};

// Set template as default
const setDefaultGlobalCertificateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const updaterId = req.user?.id;

    const template = await certificateService.setDefaultGlobalCertificateTemplate(
      templateId,
      updaterId
    );

    res.status(200).json({
      success: true,
      message: 'Global certificate template set as default successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Set default global certificate template controller error:', error);
    if (error.message === 'Certificate template not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    } else if (error.message === 'Cannot set inactive template as default') {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to set default global certificate template',
      });
    }
  }
};

// Get template usage statistics
const getTemplateUsageStats = async (req, res) => {
  try {
    const { templateId } = req.params;

    const stats = await certificateService.getTemplateUsageStats(templateId);

    res.status(200).json({
      success: true,
      message: 'Template usage statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    logger.error('Get template usage stats controller error:', error);
    if (error.message === 'Certificate template not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve template usage statistics',
      });
    }
  }
};

// Generate certificate for attendance
const generateCertificate = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const userId = req.user.id; // From auth middleware

    const result = await certificateService.generateCertificatePdf(attendanceId, userId);

    res.json({
      success: true,
      data: {
        url: result.url,
        filename: result.filename
      }
    });
  } catch (error) {
    logger.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate certificate'
    });
  }
};

// Download certificate
const downloadCertificate = async (req, res) => {
  try {
    logger.info(`Download certificate called: attendanceId=${req.params.attendanceId}, userId=${req.user?.id}`);
    const { attendanceId } = req.params;
    const userId = req.user.id;

    const result = await certificateService.generateCertificatePdf(attendanceId, userId);

    res.download(result.filepath, result.filename, (err) => {
      if (err) {
        logger.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Failed to download certificate'
          });
        }
      }
    });
  } catch (error) {
    logger.error('Download certificate error:', error);
    // Check if response already sent
    if (res.headersSent) {
      return;
    }
    
    // Provide more specific error messages
    let statusCode = 500;
    let message = error.message || 'Failed to download certificate';
    
    if (error.message === 'No certificate template found') {
      statusCode = 404;
      message = 'Template sertifikat tidak ditemukan. Silakan hubungi administrator untuk membuat template default.';
    } else if (error.message === 'Attendance not found') {
      statusCode = 404;
      message = 'Data kehadiran tidak ditemukan.';
    } else if (error.message === 'User has not attended this event') {
      statusCode = 403;
      message = 'Anda belum menghadiri event ini.';
    }
    
    res.status(statusCode).json({
      success: false,
      message: message
    });
  }
};

module.exports = {
  getGlobalCertificateTemplates,
  getDefaultGlobalCertificateTemplate,
  getGlobalCertificateTemplateById,
  createGlobalCertificateTemplate,
  updateGlobalCertificateTemplate,
  deleteGlobalCertificateTemplate,
  setDefaultGlobalCertificateTemplate,
  getTemplateUsageStats,
  generateCertificate,
  downloadCertificate,
};

