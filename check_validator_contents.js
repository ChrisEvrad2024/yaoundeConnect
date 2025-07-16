// check_validator_contents.js - Vérifier si les validators ont le bon contenu
const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification du contenu des fichiers validators...\n');

// Fichiers à vérifier
const filesToCheck = [
    {
        path: 'src/validators/authValidator.js',
        shouldContain: ['Joi', 'register:', 'login:', 'verifyEmail:'],
        shouldNotContain: ['AuthService', 'authMiddleware =']
    },
    {
        path: 'src/validators/validationMiddleware.js',
        shouldContain: ['validationMiddleware', 'schema', 'validate'],
        shouldNotContain: ['Joi.object']
    },
    {
        path: 'src/validators/roleMiddleware.js',
        shouldContain: ['roleMiddleware', 'requiredRoles'],
        shouldNotContain: ['Joi.object']
    }
];

filesToCheck.forEach(fileInfo => {
    console.log(`📄 Vérification de ${fileInfo.path}:`);
    
    const fullPath = path.join(__dirname, fileInfo.path);
    
    if (!fs.existsSync(fullPath)) {
        console.log('   ❌ Fichier n\'existe pas !');
        return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Vérifier ce qui devrait être présent
    console.log('   Devrait contenir:');
    fileInfo.shouldContain.forEach(term => {
        if (content.includes(term)) {
            console.log(`     ✅ "${term}" trouvé`);
        } else {
            console.log(`     ❌ "${term}" NON trouvé`);
        }
    });
    
    // Vérifier ce qui ne devrait pas être présent
    if (fileInfo.shouldNotContain) {
        console.log('   Ne devrait PAS contenir:');
        fileInfo.shouldNotContain.forEach(term => {
            if (content.includes(term)) {
                console.log(`     ❌ "${term}" trouvé (ne devrait pas être là !)`);
            } else {
                console.log(`     ✅ "${term}" absent (c'est bien)`);
            }
        });
    }
    
    console.log('');
});

// Vérifier spécifiquement la structure d'export
console.log('🔍 Vérification des exports:\n');

try {
    // Nettoyer le cache
    Object.keys(require.cache).forEach(key => {
        if (key.includes('validators')) {
            delete require.cache[key];
        }
    });
    
    const authValidator = require('./src/validators/authValidator');
    console.log('authValidator:');
    console.log('  Type:', typeof authValidator);
    console.log('  Est une fonction?', typeof authValidator === 'function');
    console.log('  Est un objet?', typeof authValidator === 'object' && authValidator !== null);
    
    if (typeof authValidator === 'object') {
        console.log('  Propriétés:', Object.keys(authValidator));
        console.log('  register est:', typeof authValidator.register);
        console.log('  login est:', typeof authValidator.login);
    }
    
} catch (error) {
    console.log('❌ Erreur chargement authValidator:', error.message);
}

// Créer les fichiers manquants
console.log('\n📝 Création des fichiers validators manquants ou incorrects...\n');

// S'assurer que le dossier existe
const validatorsDir = path.join(__dirname, 'src', 'validators');
if (!fs.existsSync(validatorsDir)) {
    fs.mkdirSync(validatorsDir, { recursive: true });
    console.log('✅ Dossier src/validators créé');
}

// Contenu correct pour authValidator.js
const authValidatorContent = `const Joi = require('joi');

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
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.empty': 'L\\'email est requis',
                'string.email': 'Email invalide'
            }),

        password: Joi.string()
            .min(8)
            .max(100)
            .required()
            .messages({
                'string.empty': 'Le mot de passe est requis',
                'string.min': 'Le mot de passe doit contenir au moins 8 caractères'
            }),

        role: Joi.string()
            .valid('membre', 'collecteur', 'moderateur', 'admin', 'superadmin')
            .default('membre')
    }),

    // Validation connexion
    login: Joi.object({
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.empty': 'L\\'email est requis',
                'string.email': 'Email invalide'
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
            .required()
            .messages({
                'string.empty': 'Le token de vérification est requis'
            })
    }),

    // Validation renvoi vérification
    resendVerification: Joi.object({
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.empty': 'L\\'email est requis',
                'string.email': 'Email invalide'
            })
    })
};

module.exports = authValidator;`;

// Écrire le fichier correct
const authValidatorPath = path.join(validatorsDir, 'authValidator.js');
fs.writeFileSync(authValidatorPath, authValidatorContent);
console.log('✅ src/validators/authValidator.js créé/corrigé');

console.log('\n🎯 Fichiers validators corrigés. Redémarrez le serveur.');