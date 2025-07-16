const { sequelize } = require('../config/database');
const models = require('../models');
const POIService = require('../services/poiService');
const GeoService = require('../services/geoService');

const testPOI = async () => {
    console.log('🧪 Test du système POI...\n');

    let testEntities = [];
    const timestamp = Date.now();

    try {
        // 1. Créer les données de test nécessaires
        console.log('1️⃣ Préparation des données de test...');

        // Utilisateur test
        const testUser = await models.User.create({
            name: `Test POI User ${timestamp}`,
            email: `testpoi${timestamp}@example.com`,
            password: 'hashedpassword123',
            role: 'collecteur',
            is_email_verified: true
        });
        testEntities.push({ model: 'User', id: testUser.id });

        // Pays test
        const testCountry = await models.Country.create({
            code: 237,
            name: 'Cameroun Test',
            continent_name: 'Afrique',
            flag: 'cm.png'
        });
        await testCountry.update({ translate_id: testCountry.id });
        testEntities.push({ model: 'Country', id: testCountry.id });

        // Ville test
        const testTown = await models.Town.create({
            name: `Yaoundé Test ${timestamp}`,
            description: 'Ville de test',
            longitude: 11.5021,
            latitude: 3.8480,
            country_id: testCountry.id
        });
        await testTown.update({ translate_id: testTown.id });
        testEntities.push({ model: 'Town', id: testTown.id });

        // Quartier test
        const testQuartier = await models.Quartier.create({
            name: `Quartier Test ${timestamp}`,
            description: 'Quartier de test',
            longitude: 11.5021,
            latitude: 3.8480,
            town_id: testTown.id
        });
        await testQuartier.update({ translate_id: testQuartier.id });
        testEntities.push({ model: 'Quartier', id: testQuartier.id });

        // Catégorie test
        const testCategory = await models.Category.create({
            name: `Restaurant Test ${timestamp}`,
            slug: `restaurant-test-${timestamp}`
        });
        await testCategory.update({ translate_id: testCategory.id });
        testEntities.push({ model: 'Category', id: testCategory.id });

        console.log('✅ Données de test créées');

        // 2. Test création POI
        console.log('\n2️⃣ Test création POI...');
        const poiData = {
            name: 'Restaurant Test',
            description: 'Un excellent restaurant de cuisine camerounaise situé au coeur de Yaoundé',
            adress: '123 Rue de la Paix, Centre-ville',
            latitude: 3.8480,
            longitude: 11.5021,
            quartier_id: testQuartier.translate_id,
            category_id: testCategory.translate_id,
            is_restaurant: 1,
            is_booking: 1
        };

        const createdPOI = await POIService.createPOI(poiData, testUser.id);
        testEntities.push({ model: 'PointInterest', id: createdPOI.id });

        console.log('✅ POI créé avec succès');
        console.log(`   ID: ${createdPOI.id}`);
        console.log(`   Nom: ${createdPOI.name}`);
        console.log(`   Statut: ${createdPOI.status}`);
        console.log(`   Coordonnées: ${createdPOI.latitude}, ${createdPOI.longitude}`);

        // 3. Test récupération POI par ID
        console.log('\n3️⃣ Test récupération POI...');
        const retrievedPOI = await POIService.getPOIById(createdPOI.id, true);
        console.log('✅ POI récupéré avec succès');
        console.log(`   Catégorie: ${retrievedPOI.Category.name}`);
        console.log(`   Quartier: ${retrievedPOI.Quartier.name}`);
        console.log(`   Créateur: ${retrievedPOI.creator.name}`);

        // 4. Test mise à jour POI
        console.log('\n4️⃣ Test mise à jour POI...');
        const updateData = {
            description: 'Description mise à jour - Restaurant spécialisé en cuisine locale',
            is_verify: 1
        };

        const updatedPOI = await POIService.updatePOI(
            createdPOI.id,
            updateData,
            testUser.id,
            testUser.role
        );

        console.log('✅ POI mis à jour avec succès');
        console.log(`   Nouvelle description: ${updatedPOI.description.substring(0, 50)}...`);
        console.log(`   Vérifié: ${updatedPOI.is_verify}`);

        // 5. Test recherche POI
        console.log('\n5️⃣ Test recherche POI...');
        const searchResults = await POIService.searchPOI({
            q: 'Restaurant',
            category_id: testCategory.translate_id,
            page: 1,
            limit: 10
        });

        console.log('✅ Recherche effectuée avec succès');
        console.log(`   Résultats trouvés: ${searchResults.data.length}`);
        console.log(`   Total: ${searchResults.pagination.total}`);

        // 6. Test recherche par proximité
        console.log('\n6️⃣ Test recherche par proximité...');

        // Créer quelques POI supplémentaires pour le test
        const poi2Data = {
            name: 'Café Proximité',
            description: 'Un café sympa près du centre',
            adress: '456 Avenue de la République',
            latitude: 3.8490, // Légèrement différent
            longitude: 11.5030,
            quartier_id: testQuartier.translate_id,
            category_id: testCategory.translate_id,
            is_restaurant: 1
        };

        const poi2 = await POIService.createPOI(poi2Data, testUser.id);
        testEntities.push({ model: 'PointInterest', id: poi2.id });

        const poi3Data = {
            name: 'Restaurant Loin',
            description: 'Restaurant plus éloigné',
            adress: '789 Quartier Éloigné',
            latitude: 3.9000, // Plus loin
            longitude: 11.6000,
            quartier_id: testQuartier.translate_id,
            category_id: testCategory.translate_id,
            is_restaurant: 1
        };

        const poi3 = await POIService.createPOI(poi3Data, testUser.id);
        testEntities.push({ model: 'PointInterest', id: poi3.id });

        // Recherche par proximité
        const nearbyResults = await POIService.findNearbyPOI(
            3.8480, // Centre de Yaoundé
            11.5021,
            2, // Rayon de 2km
            10
        );

        console.log('✅ Recherche proximité effectuée');
        console.log(`   POI dans un rayon de 2km: ${nearbyResults.length}`);
        nearbyResults.forEach(poi => {
            console.log(`   - ${poi.name}: ${poi.distance}km`);
        });

        // 7. Test services de géolocalisation
        console.log('\n7️⃣ Test services géolocalisation...');

        // Test calcul de distance
        const distance = GeoService.calculateDistance(
            3.8480, 11.5021, // Yaoundé centre
            3.8490, 11.5030  // Point légèrement décalé
        );
        console.log(`✅ Distance calculée: ${distance.toFixed(2)}km`);

        // Test validation coordonnées
        const validCoords = GeoService.validateCoordinates(3.8480, 11.5021);
        const invalidCoords = GeoService.validateCoordinates(200, 500);
        console.log(`✅ Validation coordonnées valides: ${validCoords.valid}`);
        console.log(`✅ Validation coordonnées invalides: ${invalidCoords.valid}`);

        // Test vérification zone Yaoundé
        const inYaounde = GeoService.isInYaounde(3.8480, 11.5021);
        const outYaounde = GeoService.isInYaounde(48.8566, 2.3522); // Paris
        console.log(`✅ Point dans Yaoundé: ${inYaounde}`);
        console.log(`✅ Point hors Yaoundé: ${outYaounde}`);

        // 8. Test gestion des favoris
        console.log('\n8️⃣ Test gestion des favoris...');

        // Ajouter en favori
        const favorite = await models.Favorite.create({
            user_id: testUser.id,
            poi_id: createdPOI.id
        });
        testEntities.push({ model: 'Favorite', id: favorite.id });

        // Vérifier si en favori
        const isFavorite = await POIService.checkIfFavorite(createdPOI.id, testUser.id);
        console.log(`✅ POI en favori: ${isFavorite}`);

        // 9. Test statistiques POI
        console.log('\n9️⃣ Test statistiques POI...');
        const stats = await POIService.getPoiStats(createdPOI.id);
        console.log('✅ Statistiques récupérées:');
        console.log(`   Rating: ${stats.rating}/5 (${stats.rating_count} votes)`);
        console.log(`   Favoris: ${stats.favorites_count}`);
        console.log(`   Vérifié: ${stats.is_verified ? 'Oui' : 'Non'}`);

        // 10. Test permissions
        console.log('\n🔒 Test permissions...');

        // Créer un autre utilisateur
        const otherUser = await models.User.create({
            name: `Other User ${timestamp}`,
            email: `other${timestamp}@example.com`,
            password: 'hashedpassword123',
            role: 'membre',
            is_email_verified: true
        });
        testEntities.push({ model: 'User', id: otherUser.id });

        // Tenter de modifier le POI avec un autre utilisateur (doit échouer)
        try {
            await POIService.updatePOI(
                createdPOI.id,
                { name: 'Tentative modification' },
                otherUser.id,
                otherUser.role
            );
            console.log('❌ Erreur: La modification aurait dû échouer');
        } catch (error) {
            console.log('✅ Permission correctement refusée:', error.message);
        }

        // Modifier avec un modérateur (doit réussir)
        const moderator = await models.User.create({
            name: `Moderator ${timestamp}`,
            email: `moderator${timestamp}@example.com`,
            password: 'hashedpassword123',
            role: 'moderateur',
            is_email_verified: true
        });
        testEntities.push({ model: 'User', id: moderator.id });

        const modifiedByModerator = await POIService.updatePOI(
            createdPOI.id,
            { name: 'Modifié par modérateur' },
            moderator.id,
            moderator.role
        );

        console.log('✅ Modification par modérateur réussie');
        console.log(`   Nouveau nom: ${modifiedByModerator.name}`);

        console.log('\n🎉 Tous les tests POI passés avec succès !');

    } catch (error) {
        console.error('\n❌ Erreur dans les tests POI:', error);
        console.error('Stack:', error.stack);
    } finally {
        // Nettoyage
        console.log('\n🧹 Nettoyage des données de test...');

        for (const entity of testEntities.reverse()) {
            try {
                await models[entity.model].destroy({ where: { id: entity.id } });
                console.log(`   ✅ ${entity.model} ${entity.id} supprimé`);
            } catch (cleanupError) {
                console.log(`   ⚠️  Erreur nettoyage ${entity.model} ${entity.id}:`, cleanupError.message);
            }
        }

        console.log('✅ Nettoyage terminé');
    }
};

testPOI();