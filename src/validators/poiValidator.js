const Joi = require('joi');

const poiValidator = {

    // Validation création POI
    create: Joi.object({
        name: Joi.string()
            .min(2)
            .max(255)
            .trim()
            .required()
            .messages({
                'string.empty': 'Le nom du POI est requis',
                'string.min': 'Le nom doit contenir au moins 2 caractères',
                'string.max': 'Le nom ne peut pas dépasser 255 caractères'
            }),

        description: Joi.string()
            .min(10)
            .max(2000)
            .trim()
            .required()
            .messages({
                'string.empty': 'La description est requise',
                'string.min': 'La description doit contenir au moins 10 caractères',
                'string.max': 'La description ne peut pas dépasser 2000 caractères'
            }),

        adress: Joi.string()
            .min(5)
            .max(255)
            .trim()
            .required()
            .messages({
                'string.empty': 'L\'adresse est requise',
                'string.min': 'L\'adresse doit contenir au moins 5 caractères'
            }),

        latitude: Joi.number()
            .min(-90)
            .max(90)
            .required()
            .messages({
                'number.base': 'La latitude doit être un nombre',
                'number.min': 'La latitude doit être comprise entre -90 et 90',
                'number.max': 'La latitude doit être comprise entre -90 et 90',
                'any.required': 'La latitude est requise'
            }),

        longitude: Joi.number()
            .min(-180)
            .max(180)
            .required()
            .messages({
                'number.base': 'La longitude doit être un nombre',
                'number.min': 'La longitude doit être comprise entre -180 et 180',
                'number.max': 'La longitude doit être comprise entre -180 et 180',
                'any.required': 'La longitude est requise'
            }),

        quartier_id: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.base': 'L\'ID du quartier doit être un nombre',
                'number.integer': 'L\'ID du quartier doit être un entier',
                'number.positive': 'L\'ID du quartier doit être positif',
                'any.required': 'Le quartier est requis'
            }),

        category_id: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.base': 'L\'ID de la catégorie doit être un nombre',
                'number.integer': 'L\'ID de la catégorie doit être un entier',
                'number.positive': 'L\'ID de la catégorie doit être positif',
                'any.required': 'La catégorie est requise'
            }),

        // Flags optionnels
        is_restaurant: Joi.number().integer().min(0).max(1).default(0),
        is_transport: Joi.number().integer().min(0).max(1).default(0),
        is_stadium: Joi.number().integer().min(0).max(1).default(0),
        is_booking: Joi.number().integer().min(0).max(1).default(0),

        // Note : les images seront gérées séparément via multer
    }),

    // Validation mise à jour POI
    update: Joi.object({
        name: Joi.string().min(2).max(255).trim(),
        description: Joi.string().min(10).max(2000).trim(),
        adress: Joi.string().min(5).max(255).trim(),
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
        quartier_id: Joi.number().integer().positive(),
        category_id: Joi.number().integer().positive(),
        is_restaurant: Joi.number().integer().min(0).max(1),
        is_transport: Joi.number().integer().min(0).max(1),
        is_stadium: Joi.number().integer().min(0).max(1),
        is_booking: Joi.number().integer().min(0).max(1)
    }).min(1), // Au moins un champ doit être fourni

    // Validation filtres de recherche
    search: Joi.object({
        q: Joi.string().max(255).trim(), // Recherche textuelle
        quartier_id: Joi.number().integer().positive(),
        category_id: Joi.number().integer().positive(),
        is_restaurant: Joi.number().integer().min(0).max(1),
        is_transport: Joi.number().integer().min(0).max(1),
        is_stadium: Joi.number().integer().min(0).max(1),
        is_booking: Joi.number().integer().min(0).max(1),
        is_verified: Joi.number().integer().min(0).max(1),
        status: Joi.string().valid('pending', 'approved', 'rejected'),

        // Pagination
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),

        // Tri
        sort_by: Joi.string().valid('name', 'created_at', 'rating', 'rating_count').default('created_at'),
        sort_order: Joi.string().valid('asc', 'desc').default('desc')
    }),

    // Validation recherche par proximité
    nearby: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        radius: Joi.number().min(0.1).max(50).default(5), // Rayon en km
        limit: Joi.number().integer().min(1).max(100).default(20)
    }),

    // Validation paramètres URL
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    searchAdvanced: Joi.object({
        q: Joi.string().max(255).trim(), // Recherche textuelle
        quartier_id: Joi.number().integer().positive(),
        category_id: Joi.number().integer().positive(),
        is_restaurant: Joi.number().integer().min(0).max(1),
        is_transport: Joi.number().integer().min(0).max(1),
        is_stadium: Joi.number().integer().min(0).max(1),
        is_booking: Joi.number().integer().min(0).max(1),
        is_verified: Joi.number().integer().min(0).max(1),
        status: Joi.string().valid('pending', 'approved', 'rejected'),

        // Pagination cursor-based
        cursor: Joi.number().integer().positive(),
        useCursor: Joi.boolean().default(false),

        // Pagination classique (fallback)
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),

        // Tri
        sort_by: Joi.string().valid('id', 'name', 'created_at', 'rating', 'rating_count').default('created_at'),
        sort_order: Joi.string().valid('asc', 'desc').default('desc')
    }),

};

module.exports = poiValidator;