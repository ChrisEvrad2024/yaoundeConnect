// debug_line_by_line.js - Créez ce fichier pour identifier la ligne exacte
console.log('🔍 Debug ligne par ligne du fichier auth.js...\n');

const express = require('express');

try {
    console.log('Ligne 1-5: Imports...');
    const AuthController = require('./src/controllers/authController');
    console.log('✅ AuthController importé');
    
    const authMiddleware = require('./src/middlewares/authMiddleware');
    console.log('✅ authMiddleware importé, type:', typeof authMiddleware);
    
    const validationMiddleware = require('./src/middlewares/validationMiddleware');
    console.log('✅ validationMiddleware importé, type:', typeof validationMiddleware);
    
    const authValidator = require('./src/validators/authValidator');
    console.log('✅ authValidator importé, type:', typeof authValidator);

    console.log('\nLigne 7: Création du router...');
    const router = express.Router();
    console.log('✅ Router créé');

    console.log('\nLigne 11-15: Route /register...');
    router.post('/register',
        validationMiddleware(authValidator.register),
        AuthController.register
    );
    console.log('✅ Route /register OK');

    console.log('\nLigne 17-21: Route /login...');
    router.post('/login',
        validationMiddleware(authValidator.login),
        AuthController.login
    );
    console.log('✅ Route /login OK');

    console.log('\nLigne 23-27: Route /verify-email...');
    router.get('/verify-email',
        validationMiddleware(authValidator.verifyEmail, 'query'),
        AuthController.verifyEmail
    );
    console.log('✅ Route /verify-email OK');

    console.log('\nLigne 29-33: Route /resend-verification...');
    router.post('/resend-verification',
        validationMiddleware(authValidator.resendVerification),
        AuthController.resendVerification
    );
    console.log('✅ Route /resend-verification OK');

    console.log('\nLigne 37-40: Route /me (LIGNE PROBLÉMATIQUE)...');
    console.log('authMiddleware avant utilisation:', typeof authMiddleware);
    console.log('AuthController.getProfile avant utilisation:', typeof AuthController.getProfile);
    
    router.get('/me',
        authMiddleware,
        AuthController.getProfile
    );
    console.log('✅ Route /me OK');

    console.log('\nLigne 42-46: Route /logout...');
    router.post('/logout',
        authMiddleware,
        AuthController.logout
    );
    console.log('✅ Route /logout OK');

    console.log('\n🎉 Toutes les lignes passent individuellement !');

} catch (error) {
    console.log('\n❌ Erreur détectée:', error.message);
    console.log('Stack:', error.stack);
}