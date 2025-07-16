require('dotenv').config();

const jwtConfig = {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: '30d',

    // Options pour la signature
    signOptions: {
        algorithm: 'HS256'
    },

    // Options pour la vérification
    verifyOptions: {
        algorithms: ['HS256']
    }
};

// Validation de la configuration
if (process.env.NODE_ENV === 'production' && jwtConfig.secret === 'your-super-secret-jwt-key-change-in-production') {
    throw new Error('❌ JWT_SECRET doit être défini en production !');
}

module.exports = jwtConfig;