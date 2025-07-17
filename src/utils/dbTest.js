const { sequelize } = require('../config/database');
const models = require('../models');

const testDatabase = async () => {
    let createdEntities = [];

    try {
        // Test connexion
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données OK');

        // Générer un timestamp pour des données uniques
        const timestamp = Date.now();

        // 1. Nettoyer les données de test précédentes (optionnel)
        await models.User.destroy({ where: { email: 'test@example.com' } });
        console.log('🧹 Nettoyage préventif effectué');

        // 2. Test création d'un utilisateur avec email unique
        const testUser = await models.User.create({
            name: `Test User ${timestamp}`,
            email: `test${timestamp}@example.com`,
            password: 'hashedpassword123'
        });
        createdEntities.push({ model: 'User', id: testUser.id });
        console.log('✅ Création utilisateur OK');

        // 3. Vérifier les données existantes nécessaires
        let existingCategory = await models.Category.findOne();
        let existingQuartier = await models.Quartier.findOne();

        // 4. Créer une catégorie de test si nécessaire
        let testCategory;
        if (existingCategory && existingCategory.translate_id) {
            console.log('✅ Utilisation catégorie existante:', existingCategory.name);
            testCategory = existingCategory;
        } else {
            testCategory = await models.Category.create({
                name: `Test Category ${timestamp}`,
                slug: `test-category-${timestamp}`
            });

            // Définir translate_id après création
            await testCategory.update({ translate_id: testCategory.id });
            createdEntities.push({ model: 'Category', id: testCategory.id });
            console.log('✅ Création catégorie OK');
        }

        // 5. Vérifier qu'il y a un quartier disponible
        if (!existingQuartier) {
            console.log('⚠️  Aucun quartier trouvé. Créons-en un...');

            // Vérifier s'il y a une ville
            let existingTown = await models.Town.findOne();
            if (!existingTown) {
                console.log('⚠️  Aucune ville trouvée. Créons-en une...');

                // Vérifier s'il y a un pays
                let existingCountry = await models.Country.findOne();
                if (!existingCountry) {
                    const testCountry = await models.Country.create({
                        code: 237,
                        name: 'Cameroun Test',
                        continent_name: 'Afrique',
                        flag: 'Cameroon.png'
                    });
                    await testCountry.update({ translate_id: testCountry.id });
                    createdEntities.push({ model: 'Country', id: testCountry.id });
                    existingCountry = testCountry;
                }

                const testTown = await models.Town.create({
                    name: `Yaoundé Test ${timestamp}`,
                    description: 'Ville de test',
                    longitude: 11.5021,
                    latitude: 3.8480,
                    country_id: existingCountry.id
                });
                await testTown.update({ translate_id: testTown.id });
                createdEntities.push({ model: 'Town', id: testTown.id });
                existingTown = testTown;
            }

            const testQuartier = await models.Quartier.create({
                name: `Quartier Test ${timestamp}`,
                description: 'Quartier de test',
                longitude: 11.5021,
                latitude: 3.8480,
                town_id: existingTown.translate_id || existingTown.id
            });
            await testQuartier.update({ translate_id: testQuartier.id });
            createdEntities.push({ model: 'Quartier', id: testQuartier.id });
            existingQuartier = testQuartier;
            console.log('✅ Création données géographiques OK');
        }

        // 6. Test création d'un POI
        const testPOI = await models.PointInterest.create({
            name: `Test POI ${timestamp}`,
            adress: 'Adresse test',
            description: "Un point d'intérêt de test",
            latitude: 3.848,
            longitude: 11.5021,
            quartier_id: existingQuartier.translate_id || existingQuartier.id,
            category_id: testCategory.translate_id || testCategory.id,
            user_id: testUser.id,
            created_by: testUser.id
        });
        createdEntities.push({ model: 'PointInterest', id: testPOI.id });
        console.log('✅ Création POI OK');

        // 7. Test création d'un favori
        const testFavorite = await models.Favorite.create({
            user_id: testUser.id,
            poi_id: testPOI.id
        });
        createdEntities.push({ model: 'Favorite', id: testFavorite.id });
        console.log('✅ Création favori OK');

        // 8. Test des associations
        const userWithFavorites = await models.User.findByPk(testUser.id, {
            include: ['favoritePOIs']
        });
        console.log('✅ Association User -> Favoris OK:', userWithFavorites.favoritePOIs.length);

        // 9. Test lecture avec associations complètes
        const poiWithDetails = await models.PointInterest.findByPk(testPOI.id, {
            include: [
                { model: models.Category },
                { model: models.Quartier },
                { model: models.User, as: 'creator' }
            ]
        });
        console.log('✅ Lecture POI avec associations OK');

        console.log('🎉 Tous les tests passés !');

    } catch (error) {
        console.error('❌ Erreur test:', error.message);

        // Afficher des détails utiles selon le type d'erreur
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            console.log('\n💡 Erreur de clé étrangère:');
            console.log(`   Table: ${error.table}`);
            console.log(`   Champs: ${error.fields.join(', ')}`);
            console.log(`   Valeur: ${error.value}`);
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('\n🔍 Détails complets:');
            console.log(error);
        }
    } finally {
        // Nettoyage automatique des données créées
        console.log('\n🧹 Nettoyage des données de test...');

        for (const entity of createdEntities.reverse()) {
            try {
                await models[entity.model].destroy({ where: { id: entity.id } });
                console.log(`   ✅ ${entity.model} ${entity.id} supprimé`);
            } catch (cleanupError) {
                console.log(`   ⚠️  Erreur nettoyage ${entity.model}: ${cleanupError.message}`);
            }
        }

        console.log('✅ Nettoyage terminé');
    }
};

testDatabase();