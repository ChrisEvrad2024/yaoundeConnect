const Joi = require('joi');

const ratingValidator = {

    // Validation notation
    rate: Joi.object({
        rating: Joi.number()
            .integer()
            .min(1)
            .max(5)
            .required()
            .messages({
                'number.base': 'La note doit être un nombre',
                'number.integer': 'La note doit être un entier',
                'number.min': 'La note doit être comprise entre 1 et 5',
                'number.max': 'La note doit être comprise entre 1 et 5',
                'any.required': 'La note est obligatoire'
            })
    }),

    // Validation top POI
    topPOIs: Joi.object({
        limit: Joi.number().integer().min(1).max(50).default(10),
        min_ratings: Joi.number().integer().min(1).default(5),
        category_id: Joi.number().integer().positive(),
        quartier_id: Joi.number().integer().positive()
    }),

    // Validation paramètres URL
    params: Joi.object({
        poiId: Joi.number().integer().positive().required()
    })
};

module.exports = ratingValidator;