// debug_imports.js - Créez ce fichier à la racine
console.log('🔍 Debug des imports...\n');

try {
    console.log('1. AuthController...');
    const AuthController = require('./src/controllers/authController');
    console.log('✅ AuthController:', typeof AuthController);
    console.log('   - register:', typeof AuthController.register);
    console.log('   - login:', typeof AuthController.login);
} catch (error) {
    console.log('❌ AuthController error:', error.message);
}

try {
    console.log('\n2. authMiddleware...');
    const authMiddleware = require('./src/middlewares/authMiddleware');
    console.log('✅ authMiddleware:', typeof authMiddleware);
} catch (error) {
    console.log('❌ authMiddleware error:', error.message);
}

try {
    console.log('\n3. validationMiddleware...');
    const validationMiddleware = require('./src/middlewares/validationMiddleware');
    console.log('✅ validationMiddleware:', typeof validationMiddleware);
} catch (error) {
    console.log('❌ validationMiddleware error:', error.message);
}

try {
    console.log('\n4. authValidator...');
    const authValidator = require('./src/validators/authValidator');
    console.log('✅ authValidator:', typeof authValidator);
    console.log('   - register:', typeof authValidator.register);
    console.log('   - login:', typeof authValidator.login);
} catch (error) {
    console.log('❌ authValidator error:', error.message);
}

try {
    console.log('\n5. Models...');
    const models = require('./src/models');
    console.log('✅ Models loaded:', Object.keys(models));
} catch (error) {
    console.log('❌ Models error:', error.message);
}

console.log('\n🎯 Si tous les imports sont OK, le problème vient d\'ailleurs.');