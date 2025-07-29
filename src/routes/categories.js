// src/routes/categories.js
const express = require('express');
const CategoryController = require('../controllers/categoryController');
const validationMiddleware = require('../middlewares/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

// Validation pour les paramètres de requête
const categoryQueryValidator = Joi.object({
  parent_id: Joi.number().integer().positive(),
  langue: Joi.string().valid('fr', 'en').default('fr'),
  limit: Joi.number().integer().min(1).max(1000).default(100)
});

const categoryParamsValidator = Joi.object({
  id: Joi.number().integer().positive().required()
});

// Routes publiques
router.get(
  '/',
  validationMiddleware(categoryQueryValidator, 'query'),
  CategoryController.getAllCategories
);

router.get(
  '/:id',
  validationMiddleware(categoryParamsValidator, 'params'),
  CategoryController.getCategoryById
);

module.exports = router;
