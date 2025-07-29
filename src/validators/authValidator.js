// src/validators/authValidator.js - VERSION CORRIGÉE
const Joi = require('joi');

const authValidator = {
  register: Joi.object({
    name: Joi.string().min(2).max(255).trim().required().messages({
      'string.empty': 'Le nom est requis',
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 255 caractères'
    }),

    email: Joi.string().email().lowercase().trim().required().messages({
      'string.empty': "L'email est requis",
      'string.email': 'Email invalide'
    }),

    password: Joi.string().min(8).max(100).required().messages({
      'string.empty': 'Le mot de passe est requis',
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères'
    }),

    role: Joi.string().valid('membre', 'collecteur').default('membre').messages({
      'any.only': 'Seuls les rôles "membre" et "collecteur" sont autorisés à l\'inscription'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      'string.empty': "L'email est requis",
      'string.email': 'Email invalide'
    }),

    password: Joi.string().required().messages({
      'string.empty': 'Le mot de passe est requis'
    })
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required().messages({
      'string.empty': 'Le token de vérification est requis'
    })
  }),

  resendVerification: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      'string.empty': "L'email est requis",
      'string.email': 'Email invalide'
    })
  })
};

module.exports = authValidator;
