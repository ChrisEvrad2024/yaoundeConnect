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

const testApprovalEndpoints = async () => {
    console.log('🧪 Test des endpoints d\'approbation...\n');

    try {
        // Note: Ces tests nécessitent un token JWT valide de modérateur
        console.log('⚠️  Ces tests nécessitent un token JWT valide');
        console.log('1. Créez un utilisateur modérateur');
        console.log('2. Connectez-vous et récupérez le token');
        console.log('3. Remplacez YOUR_MODERATOR_TOKEN ci-dessous\n');

        const MODERATOR_TOKEN = 'YOUR_MODERATOR_TOKEN'; // À remplacer

        // Test liste POI en attente
        console.log('1️⃣ Test liste POI en attente...');
        const pendingResult = await makeAuthRequest(
            'GET',
            '/moderation/pending?page=1&limit=5',
            null,
            MODERATOR_TOKEN
        );

        if (pendingResult.success) {
            console.log('✅ Liste POI en attente récupérée');
            console.log(`   Total: ${pendingResult.data.pagination.total}`);
            console.log(`   POI: ${pendingResult.data.data.length}`);
        } else {
            console.log('❌ Erreur liste pending:', pendingResult.error);
        }

        // Test approbation (nécessite un POI ID existant)
        console.log('\n2️⃣ Test approbation POI...');
        console.log('⚠️  Remplacez POI_ID par un ID réel');
        
        // const approvalResult = await makeAuthRequest(
        //     'POST',
        //     '/moderation/poi/POI_ID/approve',
        //     { comments: 'Test approbation via endpoint' },
        //     MODERATOR_TOKEN
        // );

        // Test rejet
        console.log('\n3️⃣ Test rejet POI...');
        // const rejectionResult = await makeAuthRequest(
        //     'POST',
        //     '/moderation/poi/POI_ID/reject',
        //     { reason: 'Test de rejet via endpoint - informations insuffisantes' },
        //     MODERATOR_TOKEN
        // );

        // Test statistiques
        console.log('\n4️⃣ Test statistiques...');
        const statsResult = await makeAuthRequest(
            'GET',
            '/moderation/stats?period=week',
            null,
            MODERATOR_TOKEN
        );

        if (statsResult.success) {
            console.log('✅ Statistiques récupérées');
            console.log(`   Approbations: ${statsResult.data.data.approvals}`);
            console.log(`   Rejets: ${statsResult.data.data.rejections}`);
        } else {
            console.log('❌ Erreur stats:', statsResult.error);
        }

        // Test historique
        console.log('\n5️⃣ Test historique...');
        console.log('⚠️  Remplacez POI_ID par un ID réel');
        
        // const historyResult = await makeAuthRequest(
        //     'GET',
        //     '/moderation/history/POI_ID',
        //     null,
        //     MODERATOR_TOKEN
        // );

        console.log('\n💡 Pour des tests complets:');
        console.log('1. Configurez un token de modérateur valide');
        console.log('2. Créez des POI en attente via l\'interface');
        console.log('3. Testez l\'approbation/rejet complet');

    } catch (error) {
        console.error('\n❌ Erreur tests endpoints:', error.message);
    }
};

testApprovalEndpoints();