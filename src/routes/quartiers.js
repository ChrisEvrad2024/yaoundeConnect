// src/routes/quartiers.js
const express = require('express');
const QuartierController = require('../controllers/quartierController');
const validationMiddleware = require('../middlewares/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

// Validation pour les paramètres de requête
const quartierQueryValidator = Joi.object({
  town_id: Joi.number().integer().positive(),
  arrondissement_id: Joi.number().integer().positive(),
  limit: Joi.number().integer().min(1).max(1000).default(100)
});

const quartierParamsValidator = Joi.object({
  id: Joi.number().integer().positive().required()
});

// Routes publiques (pas d'authentification requise)
router.get(
  '/',
  validationMiddleware(quartierQueryValidator, 'query'),
  QuartierController.getAllQuartiers
);

router.get(
  '/:id',
  validationMiddleware(quartierParamsValidator, 'params'),
  QuartierController.getQuartierById
);

module.exports = router;
