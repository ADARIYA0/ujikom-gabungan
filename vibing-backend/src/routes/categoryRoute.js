const express = require('express');
const categoriesController = require('../controllers/categoryController');

const router = express.Router();

router.get('/', categoriesController.getAllCategories);

module.exports = router;
