// debug_routes.js - Créez ce fichier à la racine
console.log('🔍 Debug détaillé des routes...\n');

const express = require('express');

try {
    // Test 1: Imports de base
    console.log('1️⃣ Test des imports...');
    const AuthController = require('./src/controllers/authController');
    const authMiddleware = require('./src/middlewares/authMiddleware');
    const validationMiddleware = require('./src/middlewares/validationMiddleware');
    const authValidator = require('./src/validators/authValidator');
    
    console.log('✅ Tous les imports OK');

    // Test 2: Vérification des types
    console.log('\n2️⃣ Vérification des types...');
    console.log('AuthController.register:', typeof AuthController.register);
    console.log('AuthController.login:', typeof AuthController.login);
    console.log('authMiddleware:', typeof authMiddleware);
    console.log('validationMiddleware:', typeof validationMiddleware);
    
    // Test 3: Test des validators
    console.log('\n3️⃣ Test des validators...');
    console.log('authValidator.register:', typeof authValidator.register);
    console.log('authValidator.login:', typeof authValidator.login);
    
    // Test 4: Test validation middleware
    console.log('\n4️⃣ Test validation middleware...');
    const testValidationMiddleware = validationMiddleware(authValidator.register);
    console.log('validationMiddleware(authValidator.register):', typeof testValidationMiddleware);
    
    // Test 5: Création du router étape par étape
    console.log('\n5️⃣ Test création du router...');
    const router = express.Router();
    console.log('✅ Router créé');
    
    // Test 6: Ajout des routes une par une
    console.log('\n6️⃣ Test ajout des routes...');
    
    try {
        router.post('/register',
            validationMiddleware(authValidator.register),
            AuthController.register
        );
        console.log('✅ Route /register ajoutée');
    } catch (error) {
        console.log('❌ Erreur route /register:', error.message);
    }
    
    try {
        router.post('/login',
            validationMiddleware(authValidator.login),
            AuthController.login
        );
        console.log('✅ Route /login ajoutée');
    } catch (error) {
        console.log('❌ Erreur route /login:', error.message);
    }
    
    try {
        router.get('/verify-email',
            validationMiddleware(authValidator.verifyEmail, 'query'),
            AuthController.verifyEmail
        );
        console.log('✅ Route /verify-email ajoutée');
    } catch (error) {
        console.log('❌ Erreur route /verify-email:', error.message);
    }
    
    try {
        router.post('/resend-verification',
            validationMiddleware(authValidator.resendVerification),
            AuthController.resendVerification
        );
        console.log('✅ Route /resend-verification ajoutée');
    } catch (error) {
        console.log('❌ Erreur route /resend-verification:', error.message);
    }
    
    try {
        router.get('/me',
            authMiddleware,
            AuthController.getProfile
        );
        console.log('✅ Route /me ajoutée');
    } catch (error) {
        console.log('❌ Erreur route /me:', error.message);
    }
    
    try {
        router.post('/logout',
            authMiddleware,
            AuthController.logout
        );
        console.log('✅ Route /logout ajoutée');
    } catch (error) {
        console.log('❌ Erreur route /logout:', error.message);
    }
    
    console.log('\n🎉 Toutes les routes testées individuellement');
    console.log('📋 Routes disponibles:', router.stack.map(layer => `${layer.route.path} [${Object.keys(layer.route.methods).join(', ')}]`));

} catch (error) {
    console.log('❌ Erreur globale:', error.message);
    console.log('Stack:', error.stack);
}