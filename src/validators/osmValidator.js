const Joi = require('joi');

const osmValidator = {

    // Validation géocodage
    geocode: Joi.object({
        address: Joi.string()
            .min(5)
            .max(255)
            .trim()
            .required()
            .messages({
                'string.empty': 'L\'adresse est requise',
                'string.min': 'L\'adresse doit contenir au moins 5 caractères',
                'string.max': 'L\'adresse ne peut pas dépasser 255 caractères',
                'any.required': 'L\'adresse est obligatoire'
            }),

        city: Joi.string()
            .max(100)
            .trim()
            .default('Yaoundé')
            .messages({
                'string.max': 'Le nom de la ville ne peut pas dépasser 100 caractères'
            }),

        country: Joi.string()
            .max(100)
            .trim()
            .default('Cameroun')
            .messages({
                'string.max': 'Le nom du pays ne peut pas dépasser 100 caractères'
            })
    }),

    // Validation géocodage inverse
    reverse: Joi.object({
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
            })
    }),

    // Validation validation d'adresse
    validate: Joi.object({
        address: Joi.string()
            .min(5)
            .max(255)
            .trim()
            .required()
            .messages({
                'string.empty': 'L\'adresse est requise',
                'string.min': 'L\'adresse doit contenir au moins 5 caractères',
                'string.max': 'L\'adresse ne peut pas dépasser 255 caractères',
                'any.required': 'L\'adresse est obligatoire'
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
            })
    }),

    // Validation recherche POI à proximité
    nearby: Joi.object({
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

        radius: Joi.number()
            .min(0.1)
            .max(10)
            .default(1)
            .messages({
                'number.base': 'Le rayon doit être un nombre',
                'number.min': 'Le rayon doit être d\'au moins 0.1 km',
                'number.max': 'Le rayon ne peut pas dépasser 10 km'
            }),

        category: Joi.string()
            .valid('restaurant', 'transport', 'tourism', 'amenity')
            .messages({
                'any.only': 'La catégorie doit être restaurant, transport, tourism ou amenity'
            })
    })
};

module.exports = osmValidator;