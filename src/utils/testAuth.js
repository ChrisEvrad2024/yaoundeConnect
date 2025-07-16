const { sequelize } = require('../config/database');
const models = require('../models');
const AuthService = require('../services/authService');

const testAuthentication = async () => {
    console.log('🧪 Test du système d\'authentification...\n');

    let testUser = null;
    const testEmail = `test.auth.${Date.now()}@example.com`;

    try {
        // Test 1: Inscription
        console.log('1️⃣ Test inscription...');
        const registrationResult = await AuthService.registerUser({
            name: 'Test Auth User',
            email: testEmail,
            password: 'TestPassword123!',
            role: 'membre'
        });

        testUser = registrationResult.user;
        console.log('✅ Inscription réussie');
        console.log(`   User ID: ${testUser.id}`);
        console.log(`   Email verified: ${testUser.is_email_verified}`);
        console.log(`   Verification token: ${registrationResult.emailVerificationToken.substring(0, 10)}...`);

        // Test 2: Tentative de connexion avec email non vérifié
        console.log('\n2️⃣ Test connexion avec email non vérifié...');
        try {
            await AuthService.loginUser(testEmail, 'TestPassword123!');
            console.log('❌ Erreur: La connexion aurait dû échouer');
        } catch (error) {
            console.log('✅ Connexion correctement refusée:', error.message);
        }

        // Test 3: Vérification email
        console.log('\n3️⃣ Test vérification email...');
        const verifiedUser = await AuthService.verifyEmail(registrationResult.emailVerificationToken);
        console.log('✅ Email vérifié avec succès');
        console.log(`   Email verified: ${verifiedUser.is_email_verified}`);

        // Test 4: Connexion après vérification
        console.log('\n4️⃣ Test connexion après vérification...');
        const loginResult = await AuthService.loginUser(testEmail, 'TestPassword123!');
        console.log('✅ Connexion réussie');
        console.log(`   Token généré: ${loginResult.token.substring(0, 20)}...`);
        console.log(`   User: ${loginResult.user.name} (${loginResult.user.role})`);

        // Test 5: Vérification du token
        console.log('\n5️⃣ Test vérification token...');
        const decodedToken = AuthService.verifyToken(loginResult.token);
        console.log('✅ Token valide');
        console.log(`   User ID: ${decodedToken.id}`);
        console.log(`   Email: ${decodedToken.email}`);
        console.log(`   Role: ${decodedToken.role}`);

        // Test 6: Hash et vérification mot de passe
        console.log('\n6️⃣ Test sécurité mot de passe...');
        const hashedPassword = await AuthService.hashPassword('TestPassword123!');
        const isValidPassword = await AuthService.verifyPassword('TestPassword123!', hashedPassword);
        const isInvalidPassword = await AuthService.verifyPassword('WrongPassword', hashedPassword);
        console.log('✅ Hash mot de passe fonctionne');
        console.log(`   Bon mot de passe: ${isValidPassword}`);
        console.log(`   Mauvais mot de passe: ${isInvalidPassword}`);

        // Test 7: Tentative de double inscription
        console.log('\n7️⃣ Test double inscription...');
        try {
            await AuthService.registerUser({
                name: 'Test Duplicate',
                email: testEmail,
                password: 'TestPassword123!',
                role: 'membre'
            });
            console.log('❌ Erreur: La double inscription aurait dû échouer');
        } catch (error) {
            console.log('✅ Double inscription correctement refusée:', error.message);
        }

        console.log('\n🎉 Tous les tests d\'authentification passés !');

    } catch (error) {
        console.error('\n❌ Erreur dans les tests:', error);
    } finally {
        // Nettoyage
        if (testUser) {
            try {
                await models.User.destroy({ where: { id: testUser.id } });
                console.log('\n🧹 Utilisateur de test supprimé');
            } catch (cleanupError) {
                console.error('Erreur nettoyage:', cleanupError.message);
            }
        }
    }
};

testAuthentication();