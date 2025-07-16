const Joi = require('joi');

const approvalValidator = {

    // Validation approbation
    approve: Joi.object({
        comments: Joi.string()
            .max(500)
            .trim()
            .allow('')
            .messages({
                'string.max': 'Les commentaires ne peuvent pas dépasser 500 caractères'
            })
    }),

    // Validation rejet
    reject: Joi.object({
        reason: Joi.string()
            .min(10)
            .max(500)
            .trim()
            .required()
            .messages({
                'string.empty': 'La raison du rejet est requise',
                'string.min': 'La raison doit contenir au moins 10 caractères',
                'string.max': 'La raison ne peut pas dépasser 500 caractères',
                'any.required': 'La raison du rejet est obligatoire'
            })
    }),

    // Validation réapprobation
    reapprove: Joi.object({
        comments: Joi.string()
            .max(500)
            .trim()
            .allow('')
            .messages({
                'string.max': 'Les commentaires ne peuvent pas dépasser 500 caractères'
            })
    }),

    // Validation filtres POI en attente
    pendingFilters: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sort_by: Joi.string().valid('created_at', 'name', 'quartier_id', 'category_id').default('created_at'),
        sort_order: Joi.string().valid('asc', 'desc').default('asc'),
        quartier_id: Joi.number().integer().positive(),
        category_id: Joi.number().integer().positive(),
        created_by: Joi.number().integer().positive()
    }),

    // Validation statistiques
    statsQuery: Joi.object({
        period: Joi.string().valid('day', 'week', 'month').default('week'),
        moderator_id: Joi.number().integer().positive()
    }),

    // Validation paramètres URL
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

module.exports = approvalValidator;