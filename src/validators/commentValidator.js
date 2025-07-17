const Joi = require('joi');

const commentValidator = {

    // Validation création commentaire
    create: Joi.object({
        content: Joi.string()
            .min(5)
            .max(2000)
            .trim()
            .required()
            .messages({
                'string.empty': 'Le contenu du commentaire est requis',
                'string.min': 'Le commentaire doit contenir au moins 5 caractères',
                'string.max': 'Le commentaire ne peut pas dépasser 2000 caractères',
                'any.required': 'Le contenu est obligatoire'
            }),

        poi_id: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.base': 'L\'ID du POI doit être un nombre',
                'number.integer': 'L\'ID du POI doit être un entier',
                'number.positive': 'L\'ID du POI doit être positif',
                'any.required': 'L\'ID du POI est requis'
            }),

        parent_id: Joi.number()
            .integer()
            .positive()
            .allow(null)
            .messages({
                'number.base': 'L\'ID du commentaire parent doit être un nombre',
                'number.integer': 'L\'ID du commentaire parent doit être un entier',
                'number.positive': 'L\'ID du commentaire parent doit être positif'
            })
    }),

    // Validation mise à jour commentaire
    update: Joi.object({
        content: Joi.string()
            .min(5)
            .max(2000)
            .trim()
            .required()
            .messages({
                'string.empty': 'Le contenu du commentaire est requis',
                'string.min': 'Le commentaire doit contenir au moins 5 caractères',
                'string.max': 'Le commentaire ne peut pas dépasser 2000 caractères',
                'any.required': 'Le contenu est obligatoire'
            })
    }),

    // Validation signalement
    report: Joi.object({
        reason: Joi.string()
            .valid('spam', 'inappropriate', 'harassment', 'misinformation', 'other')
            .required()
            .messages({
                'any.only': 'La raison doit être spam, inappropriate, harassment, misinformation ou other',
                'any.required': 'La raison du signalement est obligatoire'
            }),

        description: Joi.string()
            .max(500)
            .trim()
            .allow('')
            .messages({
                'string.max': 'La description ne peut pas dépasser 500 caractères'
            })
    }),

    // Validation paramètres de liste
    list: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sort_by: Joi.string().valid('created_at', 'likes_count').default('created_at'),
        sort_order: Joi.string().valid('asc', 'desc').default('desc'),
        status: Joi.string().valid('pending', 'approved', 'rejected', 'flagged').default('approved'),
        include_replies: Joi.boolean().default(true)
    }),

    // Validation paramètres URL
    params: Joi.object({
        id: Joi.number().integer().positive().required(),
        poiId: Joi.number().integer().positive()
    })
};

module.exports = commentValidator;
