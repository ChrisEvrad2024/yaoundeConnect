// src/validators/userManagementValidator.js
const Joi = require('joi');

const userManagementValidator = {
  // Validation pour la création d'utilisateur
  createUser: Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
      'string.empty': 'Le nom est requis',
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères',
      'any.required': 'Le nom est requis'
    }),

    email: Joi.string().email().lowercase().trim().required().messages({
      'string.email': "L'email doit être une adresse email valide",
      'string.empty': "L'email est requis",
      'any.required': "L'email est requis"
    }),

    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
      .required()
      .messages({
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
        'string.pattern.base':
          'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial (!@#$%^&*)',
        'string.empty': 'Le mot de passe est requis',
        'any.required': 'Le mot de passe est requis'
      }),

    role: Joi.string().valid('admin', 'moderateur', 'collecteur', 'membre').required().messages({
      'any.only': "Le rôle doit être l'un des suivants: admin, moderateur, collecteur, membre",
      'any.required': 'Le rôle est requis'
    })
  }),

  // Validation pour la mise à jour d'utilisateur
  updateUser: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional().messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères'
    }),

    email: Joi.string().email().lowercase().trim().optional().messages({
      'string.email': "L'email doit être une adresse email valide"
    }),

    role: Joi.string().valid('admin', 'moderateur', 'collecteur', 'membre').optional().messages({
      'any.only': "Le rôle doit être l'un des suivants: admin, moderateur, collecteur, membre"
    }),

    is_email_verified: Joi.boolean().optional().messages({
      'boolean.base': 'is_email_verified doit être un booléen'
    })
  })
    .min(1)
    .messages({
      'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
    }),

  // Validation pour la réinitialisation de mot de passe
  resetPassword: Joi.object({
    new_password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
      .required()
      .messages({
        'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
        'string.pattern.base':
          'Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial (!@#$%^&*)',
        'string.empty': 'Le nouveau mot de passe est requis',
        'any.required': 'Le nouveau mot de passe est requis'
      })
  }),

  // Validation des paramètres d'URL
  params: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': "L'ID doit être un nombre",
      'number.integer': "L'ID doit être un nombre entier",
      'number.positive': "L'ID doit être positif",
      'any.required': "L'ID est requis"
    })
  }),

  // Validation des filtres de recherche
  searchFilters: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'La page doit être un nombre',
      'number.integer': 'La page doit être un nombre entier',
      'number.min': 'La page doit être supérieure à 0'
    }),

    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      'number.base': 'La limite doit être un nombre',
      'number.integer': 'La limite doit être un nombre entier',
      'number.min': 'La limite doit être supérieure à 0',
      'number.max': 'La limite ne peut pas dépasser 100'
    }),

    search: Joi.string().trim().min(1).max(100).optional().messages({
      'string.min': 'La recherche doit contenir au moins 1 caractère',
      'string.max': 'La recherche ne peut pas dépasser 100 caractères'
    }),

    role: Joi.string().valid('admin', 'moderateur', 'collecteur', 'membre').optional().messages({
      'any.only': "Le rôle doit être l'un des suivants: admin, moderateur, collecteur, membre"
    }),

    is_email_verified: Joi.boolean().optional().messages({
      'boolean.base': 'is_email_verified doit être un booléen'
    }),

    sort_by: Joi.string()
      .valid('created_at', 'updated_at', 'name', 'email', 'role')
      .default('created_at')
      .messages({
        'any.only': "sort_by doit être l'un des suivants: created_at, updated_at, name, email, role"
      }),

    sort_order: Joi.string().valid('asc', 'desc').default('desc').messages({
      'any.only': 'sort_order doit être "asc" ou "desc"'
    })
  }),

  // Validation pour les requêtes avec des rôles spécifiques
  roleFilter: Joi.object({
    roles: Joi.array()
      .items(Joi.string().valid('admin', 'moderateur', 'collecteur', 'membre'))
      .min(1)
      .optional()
      .messages({
        'array.min': 'Au moins un rôle doit être spécifié',
        'any.only': "Chaque rôle doit être l'un des suivants: admin, moderateur, collecteur, membre"
      })
  })
};

module.exports = userManagementValidator;
