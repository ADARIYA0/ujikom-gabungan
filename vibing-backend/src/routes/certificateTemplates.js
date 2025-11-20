const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

// All routes require authentication and admin role
router.use(verifyToken);
router.use(authorizeRoles('admin'));

// GET /api/global-certificate-templates - Get all global certificate templates
router.get('/', certificateController.getGlobalCertificateTemplates);

// GET /api/global-certificate-templates/default - Get default global certificate template
router.get('/default', certificateController.getDefaultGlobalCertificateTemplate);

// GET /api/global-certificate-templates/:templateId - Get global certificate template by ID
router.get('/:templateId', certificateController.getGlobalCertificateTemplateById);

// POST /api/global-certificate-templates - Create global certificate template
router.post('/', certificateController.createGlobalCertificateTemplate);

// PUT /api/global-certificate-templates/:templateId - Update global certificate template
router.put('/:templateId', certificateController.updateGlobalCertificateTemplate);

// DELETE /api/global-certificate-templates/:templateId - Delete global certificate template
router.delete('/:templateId', certificateController.deleteGlobalCertificateTemplate);

// PATCH /api/global-certificate-templates/:templateId/set-default - Set template as default
router.patch('/:templateId/set-default', certificateController.setDefaultGlobalCertificateTemplate);

// GET /api/global-certificate-templates/:templateId/stats - Get template usage statistics
router.get('/:templateId/stats', certificateController.getTemplateUsageStats);

module.exports = router;

