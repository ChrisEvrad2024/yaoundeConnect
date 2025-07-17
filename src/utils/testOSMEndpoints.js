const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const makeRequest = async (method, url, data = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: { 'Content-Type': 'application/json' }
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

const testOSMEndpoints = async () => {
    console.log('🧪 Test des endpoints OpenStreetMap...\n');

    try {
        // Test géocodage
        console.log('1️⃣ Test géocodage...');
        const geocodeResult = await makeRequest(
            'GET',
            '/osm/geocode?address=Avenue Kennedy&city=Yaoundé&country=Cameroun'
        );

        if (geocodeResult.success) {
            console.log('✅ Géocodage réussi');
            console.log(`   Résultats: ${geocodeResult.data.data.results?.length || 0}`);
            if (geocodeResult.data.data.best_match) {
                console.log(`   Meilleure correspondance: ${geocodeResult.data.data.best_match.formatted_address}`);
            }
        } else {
            console.log('❌ Erreur géocodage:', geocodeResult.error);
        }

        // Test géocodage inverse
        console.log('\n2️⃣ Test géocodage inverse...');
        const reverseResult = await makeRequest(
            'GET',
            '/osm/reverse?latitude=3.8480&longitude=11.5021'
        );

        if (reverseResult.success) {
            console.log('✅ Géocodage inverse réussi');
            if (reverseResult.data.data.formatted_address) {
                console.log(`   Adresse: ${reverseResult.data.data.formatted_address}`);
            }
        } else {
            console.log('❌ Erreur géocodage inverse:', reverseResult.error);
        }

        // Test validation
        console.log('\n3️⃣ Test validation d\'adresse...');
        const validateResult = await makeRequest(
            'POST',
            '/osm/validate',
            {
                address: 'Avenue de l\'Indépendance',
                latitude: 3.8480,
                longitude: 11.5021
            }
        );

        if (validateResult.success) {
            console.log('✅ Validation réussie');
            console.log(`   Adresse valide: ${validateResult.data.data.valid}`);
            if (validateResult.data.data.distance_km !== undefined) {
                console.log(`   Distance: ${validateResult.data.data.distance_km}km`);
            }
        } else {
            console.log('❌ Erreur validation:', validateResult.error);
        }

        // Test POI OSM à proximité
        console.log('\n4️⃣ Test POI OSM à proximité...');
        const nearbyResult = await makeRequest(
            'GET',
            '/osm/nearby?latitude=3.8480&longitude=11.5021&radius=2&category=restaurant'
        );

        if (nearbyResult.success) {
            console.log('✅ Recherche POI OSM réussie');
            console.log(`   POI trouvés: ${nearbyResult.data.data.pois?.length || 0}`);
        } else {
            console.log('❌ Erreur recherche POI OSM:', nearbyResult.error);
        }

        // Test gestion d'erreurs
        console.log('\n5️⃣ Test gestion d\'erreurs...');

        // Coordonnées invalides
        const invalidCoordsResult = await makeRequest(
            'GET',
            '/osm/reverse?latitude=200&longitude=500'
        );

        if (!invalidCoordsResult.success && invalidCoordsResult.status === 400) {
            console.log('✅ Validation coordonnées invalides fonctionne');
        }

        // Adresse manquante
        const missingAddressResult = await makeRequest(
            'GET',
            '/osm/geocode'
        );

        if (!missingAddressResult.success && missingAddressResult.status === 400) {
            console.log('✅ Validation adresse manquante fonctionne');
        }

        console.log('\n🎉 Tests endpoints OSM terminés !');

    } catch (error) {
        console.error('\n❌ Erreur tests endpoints OSM:', error.message);
    }
};

const checkServer = async () => {
    console.log('🔍 Vérification serveur pour tests OSM...');
    const result = await makeRequest('GET', '/../health');
    if (result.success) {
        console.log('✅ Serveur accessible\n');
        await testOSMEndpoints();
    } else {
        console.log('❌ Serveur non accessible. Démarrez avec "npm run dev"\n');
    }
};

checkServer();