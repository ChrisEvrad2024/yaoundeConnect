const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const makeAuthRequest = async (method, url, data = null, token = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        if (data) config.data = data;

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

const testSprint3Endpoints = async () => {
    console.log('🧪 Test des endpoints Sprint 3...\n');

    try {
        console.log('⚠️  Pour des tests complets, utilisez un token JWT valide');
        const TEST_TOKEN = 'YOUR_JWT_TOKEN'; // À remplacer

        // Test endpoints publics commentaires
        console.log('1️⃣ Test endpoints publics commentaires...');
        
        // Supposons qu'il y a un POI avec ID=1
        const commentsResult = await makeAuthRequest(
            'GET',
            '/poi/1/comments?page=1&limit=5',
            null,
            null
        );

        if (commentsResult.success) {
            console.log('✅ Liste commentaires publique réussie');
            console.log(`   Commentaires: ${commentsResult.data.data?.length || 0}`);
        } else {
            console.log('ℹ️ Aucun POI trouvé (normal si DB vide)');
        }

        // Test endpoints publics ratings
        console.log('\n2️⃣ Test endpoints publics ratings...');
        
        const topRatingsResult = await makeAuthRequest(
            'GET',
            '/ratings/top?limit=5',
            null,
            null
        );

        if (topRatingsResult.success) {
            console.log('✅ Top ratings récupéré');
            console.log(`   POI dans le top: ${topRatingsResult.data.data?.length || 0}`);
        } else {
            console.log('ℹ️ Aucun POI noté trouvé');
        }

        // Test validation erreurs
        console.log('\n3️⃣ Test validation des erreurs...');

        // Note invalide
        const invalidRatingResult = await makeAuthRequest(
            'POST',
            '/ratings/poi/1/rate',
            { rating: 6 },
            TEST_TOKEN
        );

        if (!invalidRatingResult.success && invalidRatingResult.status === 400) {
            console.log('✅ Validation note invalide fonctionne');
        } else {
            console.log('ℹ️ Test note invalide (nécessite un token valide)');
        }

        // Commentaire trop court
        const shortCommentResult = await makeAuthRequest(
            'POST',
            '/comments',
            { content: 'OK', poi_id: 1 },
            TEST_TOKEN
        );

        if (!shortCommentResult.success && shortCommentResult.status === 400) {
            console.log('✅ Validation commentaire court fonctionne');
        } else {
            console.log('ℹ️ Test commentaire court (nécessite un token valide)');
        }

        console.log('\n💡 Tests d\'endpoints avec authentification:');
        console.log('1. Obtenez un token JWT en vous connectant');
        console.log('2. Remplacez YOUR_JWT_TOKEN dans le code');
        console.log('3. Créez des POI pour tester complètement');
        console.log('4. Testez les flux complets comment → like → report');

    } catch (error) {
        console.error('\n❌ Erreur tests endpoints:', error.message);
    }
};

testSprint3Endpoints();
