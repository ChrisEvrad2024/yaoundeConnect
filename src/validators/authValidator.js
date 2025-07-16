const Joi = require('joi');

const authValidator = {

    // Validation inscription
    register: Joi.object({
        name: Joi.string()
            .min(2)
            .max(255)
            .trim()
            .required()
            .messages({
                'string.empty': 'Le nom est requis',
                'string.min': 'Le nom doit contenir au moins 2 caractères',
                'string.max': 'Le nom ne peut pas dépasser 255 caractères'
            }),

        email: Joi.string()
            .email()
            .trim()
            .lowercase()
            .required()
            .messages({
                'string.empty': 'L\'email est requis',
                'string.email': 'L\'email doit être valide'
            }),

        password: Joi.string()
            .min(8)
            .max(128)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
            .required()
            .messages({
                'string.empty': 'Le mot de passe est requis',
                'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
                'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'
            }),

        role: Joi.string()
            .valid('membre', 'collecteur', 'moderateur', 'admin', 'superadmin')
            .default('membre')
            .messages({
                'any.only': 'Le rôle doit être valide'
            })
    }),

    // Validation connexion
    login: Joi.object({
        email: Joi.string()
            .email()
            .trim()
            .lowercase()
            .required()
            .messages({
                'string.empty': 'L\'email est requis',
                'string.email': 'L\'email doit être valide'
            }),

        password: Joi.string()
            .required()
            .messages({
                'string.empty': 'Le mot de passe est requis'
            })
    }),

    // Validation vérification email
    verifyEmail: Joi.object({
        token: Joi.string()
            .length(64)
            .pattern(/^[a-f0-9]+$/)
            .required()
            .messages({
                'string.empty': 'Le token est requis',
                'string.length': 'Token invalide',
                'string.pattern.base': 'Token invalide'
            })
    }),

    // Validation resend verification
    resendVerification: Joi.object({
        email: Joi.string()
            .email()
            .trim()
            .lowercase()
            .required()
            .messages({
                'string.empty': 'L\'email est requis',
                'string.email': 'L\'email doit être valide'
            })
    })
};

module.exports = authValidator;