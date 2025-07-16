const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = null;
let testPOIId = null;

// Fonction helper pour les requêtes authentifiées
const makeAuthRequest = async (method, url, data = null, token = authToken) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
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

const testPOIEndpoints = async () => {
    console.log('🧪 Test des endpoints POI...\n');

    try {
        // 1. Créer un utilisateur et se connecter
        console.log('1️⃣ Authentification...');
        const timestamp = Date.now();

        const registerResult = await makeAuthRequest('POST', '/auth/register', {
            name: 'Test POI User',
            email: `testpoi${timestamp}@example.com`,
            password: 'TestPassword123!',
            role: 'collecteur'
        });

        if (!registerResult.success) {
            console.log('❌ Erreur inscription:', registerResult.error);
            return;
        }

        // Simuler la vérification email (dans un vrai test, il faudrait vérifier l'email)
        console.log('⚠️  Note: En production, vérifiez l\'email avant de continuer');

        // 2. Test recherche publique (sans auth)
        console.log('\n2️⃣ Test recherche publique...');
        const searchResult = await makeAuthRequest('GET', '/poi?limit=5', null, null);

        if (searchResult.success) {
            console.log('✅ Recherche publique réussie');
            console.log(`   Résultats: ${searchResult.data.data.length}`);
            console.log(`   Pagination: page ${searchResult.data.pagination.page}/${searchResult.data.pagination.totalPages}`);
        } else {
            console.log('❌ Erreur recherche publique:', searchResult.error);
        }

        // 3. Test recherche par proximité
        console.log('\n3️⃣ Test recherche proximité...');
        const nearbyResult = await makeAuthRequest('GET', '/poi/nearby?latitude=3.8480&longitude=11.5021&radius=10', null, null);

        if (nearbyResult.success) {
            console.log('✅ Recherche proximité réussie');
            console.log(`   POI trouvés: ${nearbyResult.data.data.length}`);
            console.log(`   Centre: ${nearbyResult.data.center.latitude}, ${nearbyResult.data.center.longitude}`);
            console.log(`   Rayon: ${nearbyResult.data.radius}km`);
        } else {
            console.log('❌ Erreur recherche proximité:', nearbyResult.error);
        }

        // 4. Test création POI sans authentification (doit échouer)
        console.log('\n4️⃣ Test création POI sans auth...');
        const unauthCreateResult = await makeAuthRequest('POST', '/poi', {
            name: 'Test POI',
            description: 'Description test'
        }, null);

        if (!unauthCreateResult.success && unauthCreateResult.status === 401) {
            console.log('✅ Création sans auth correctement refusée');
        } else {
            console.log('❌ La création sans auth aurait dû échouer');
        }

        // 5. Pour les tests suivants, nous aurions besoin d'un token valide
        console.log('\n5️⃣ Tests avec authentification...');
        console.log('⚠️  Les tests suivants nécessitent un token JWT valide');
        console.log('   1. Connectez-vous manuellement et récupérez le token');
        console.log('   2. Ou modifiez ce script pour gérer la vérification email');

        // Exemple de structure pour les tests authentifiés
        if (authToken) {
            // Test création POI
            const createPOIResult = await makeAuthRequest('POST', '/poi', {
                name: 'Restaurant Test Endpoint',
                description: 'Un excellent restaurant pour tester les endpoints',
                adress: '123 Rue Test, Yaoundé',
                latitude: 3.8480,
                longitude: 11.5021,
                quartier_id: 1, // À adapter selon vos données
                category_id: 1, // À adapter selon vos données
                is_restaurant: 1
            });

            if (createPOIResult.success) {
                testPOIId = createPOIResult.data.data.id;
                console.log('✅ POI créé avec succès:', testPOIId);
            }

            // Test récupération POI
            if (testPOIId) {
                const getPOIResult = await makeAuthRequest('GET', `/poi/${testPOIId}`);
                if (getPOIResult.success) {
                    console.log('✅ POI récupéré avec succès');
                }

                // Test mise à jour POI
                const updatePOIResult = await makeAuthRequest('PUT', `/poi/${testPOIId}`, {
                    description: 'Description mise à jour via endpoint'
                });

                if (updatePOIResult.success) {
                    console.log('✅ POI mis à jour avec succès');
                }
            }
        }

        // 6. Test validation des erreurs
        console.log('\n6️⃣ Test validation des erreurs...');

        // Coordonnées invalides
        const invalidCoordsResult = await makeAuthRequest('GET', '/poi/nearby?latitude=200&longitude=500', null, null);
        if (!invalidCoordsResult.success && invalidCoordsResult.status === 400) {
            console.log('✅ Validation coordonnées invalides fonctionne');
        }

        // POI inexistant
        const nonExistentPOIResult = await makeAuthRequest('GET', '/poi/999999', null, null);
        if (!nonExistentPOIResult.success && nonExistentPOIResult.status === 404) {
            console.log('✅ Gestion POI inexistant fonctionne');
        }

        // Paramètres de recherche invalides
        const invalidSearchResult = await makeAuthRequest('GET', '/poi?page=0&limit=200', null, null);
        if (!invalidSearchResult.success && invalidSearchResult.status === 400) {
            console.log('✅ Validation paramètres recherche fonctionne');
        }

        console.log('\n🎉 Tests des endpoints POI terminés !');
        console.log('\n💡 Remarques:');
        console.log('   - Pour tester complètement, authentifiez-vous avec un token valide');
        console.log('   - Testez l\'upload d\'images avec un client comme Postman');
        console.log('   - Vérifiez les permissions avec différents rôles d\'utilisateurs');

    } catch (error) {
        console.error('\n❌ Erreur dans les tests endpoints:', error.message);
    }
};

// Vérifier que le serveur est démarré
const checkServer = async () => {
    console.log('🔍 Vérification du serveur...');
    const result = await makeAuthRequest('GET', '/../health', null, null);
    if (result.success) {
        console.log('✅ Serveur démarré et accessible\n');
        await testPOIEndpoints();
    } else {
        console.log('❌ Serveur non accessible. Démarrez-le avec "npm run dev"\n');
    }
};

checkServer();