const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const testEmail = `test.endpoint.${Date.now()}@example.com`;

// Fonction helper pour les requêtes
const makeRequest = async (method, url, data = null, headers = {}) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
};

const testEndpoints = async () => {
    console.log('🧪 Test des endpoints d\'authentification...\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Email de test: ${testEmail}\n`);

    let authToken = null;

    try {
        // Test 1: Health check
        console.log('1️⃣ Test health check...');
        const healthResult = await makeRequest('GET', '/../health');
        if (healthResult.success) {
            console.log('✅ Health check OK');
            console.log(`   Status: ${healthResult.data.status}`);
        } else {
            console.log('❌ Health check échoué:', healthResult.error);
        }

        // Test 2: Inscription
        console.log('\n2️⃣ Test inscription...');
        const registerResult = await makeRequest('POST', '/auth/register', {
            name: 'Test Endpoint User',
            email: testEmail,
            password: 'TestPassword123!',
            role: 'membre'
        });

        if (registerResult.success) {
            console.log('✅ Inscription réussie');
            console.log(`   User ID: ${registerResult.data.user.id}`);
            console.log(`   Message: ${registerResult.data.message}`);
        } else {
            console.log('❌ Inscription échouée:', registerResult.error);
            return;
        }

        // Test 3: Tentative de connexion sans vérification email
        console.log('\n3️⃣ Test connexion sans vérification email...');
        const loginWithoutVerificationResult = await makeRequest('POST', '/auth/login', {
            email: testEmail,
            password: 'TestPassword123!'
        });

        if (!loginWithoutVerificationResult.success && loginWithoutVerificationResult.status === 401) {
            console.log('✅ Connexion correctement refusée (email non vérifié)');
            console.log(`   Message: ${loginWithoutVerificationResult.error.detail}`);
        } else {
            console.log('❌ La connexion aurait dû échouer');
        }

        // Test 4: Vérification email manuelle (simulation)
        console.log('\n4️⃣ Simulation vérification email...');
        console.log('⚠️  En réalité, vous devriez cliquer sur le lien dans l\'email');
        console.log('   Pour ce test, nous allons marquer l\'email comme vérifié via la base de données');

        // Test 5: Connexion après vérification
        console.log('\n5️⃣ Test connexion (simulée après vérification)...');
        // Note: Dans un vrai test, il faudrait vérifier l'email d'abord
        console.log('   💡 Cette étape nécessite la vérification email réelle');

        // Test 6: Validation des erreurs
        console.log('\n6️⃣ Test validation des erreurs...');

        // Email invalide
        const invalidEmailResult = await makeRequest('POST', '/auth/register', {
            name: 'Test',
            email: 'email-invalide',
            password: 'TestPassword123!'
        });

        if (!invalidEmailResult.success && invalidEmailResult.status === 400) {
            console.log('✅ Validation email invalide fonctionne');
            console.log(`   Erreur: ${invalidEmailResult.error.errors?.[0]?.message}`);
        }

        // Mot de passe trop faible
        const weakPasswordResult = await makeRequest('POST', '/auth/register', {
            name: 'Test',
            email: 'test2@example.com',
            password: '123'
        });

        if (!weakPasswordResult.success && weakPasswordResult.status === 400) {
            console.log('✅ Validation mot de passe faible fonctionne');
            console.log(`   Erreur: ${weakPasswordResult.error.errors?.[0]?.message}`);
        }

        // Test 7: Double inscription
        console.log('\n7️⃣ Test double inscription...');
        const duplicateResult = await makeRequest('POST', '/auth/register', {
            name: 'Test Duplicate',
            email: testEmail,
            password: 'TestPassword123!'
        });

        if (!duplicateResult.success && duplicateResult.status === 409) {
            console.log('✅ Double inscription correctement refusée');
            console.log(`   Message: ${duplicateResult.error.detail}`);
        }

        // Test 8: Route protégée sans authentification
        console.log('\n8️⃣ Test route protégée sans token...');
        const protectedResult = await makeRequest('GET', '/auth/me');

        if (!protectedResult.success && protectedResult.status === 401) {
            console.log('✅ Route protégée correctement sécurisée');
            console.log(`   Message: ${protectedResult.error.detail}`);
        }

        console.log('\n🎉 Tests des endpoints terminés !');
        console.log('\n💡 Remarques:');
        console.log('   - Pour tester complètement, configurez le service email');
        console.log('   - Vérifiez manuellement les emails envoyés');
        console.log('   - Testez les liens de vérification');

    } catch (error) {
        console.error('\n❌ Erreur dans les tests endpoints:', error.message);
    }
};

// Vérifier que le serveur est démarré
const checkServer = async () => {
    console.log('🔍 Vérification du serveur...');
    const result = await makeRequest('GET', '/../health');
    if (result.success) {
        console.log('✅ Serveur démarré et accessible\n');
        await testEndpoints();
    } else {
        console.log('❌ Serveur non accessible. Démarrez-le avec "npm run dev"\n');
    }
};

checkServer();