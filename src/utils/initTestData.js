const { sequelize } = require('../config/database');
const models = require('../models');

const initTestData = async () => {
    console.log('🔧 Initialisation des données de test...');

    try {
        // Vérifier la connexion
        await sequelize.authenticate();

        // 1. Créer pays de test si nécessaire
        let country = await models.Country.findOne({ where: { code: 237 } });
        if (!country) {
            country = await models.Country.create({
                code: 237,
                name: 'Cameroun',
                continent_name: 'Afrique',
                flag: 'cm.png'
            });
            await country.update({ translate_id: country.id });
            console.log('✅ Pays Cameroun créé');
        }

        // 2. Créer ville de test
        let town = await models.Town.findOne({ where: { name: 'Yaoundé' } });
        if (!town) {
            town = await models.Town.create({
                name: 'Yaoundé',
                description: 'Capitale du Cameroun',
                longitude: 11.5021,
                latitude: 3.8480,
                country_id: country.id
            });
            await town.update({ translate_id: town.id });
            console.log('✅ Ville Yaoundé créée');
        }

        // 3. Créer arrondissement de test
        let arrondissement = await models.Arrondissement.findOne({ where: { name: 'Centre' } });
        if (!arrondissement) {
            arrondissement = await models.Arrondissement.create({
                name: 'Centre'
            });
            console.log('✅ Arrondissement Centre créé');
        }

        // 4. Créer quartier de test
        let quartier = await models.Quartier.findOne({ where: { name: 'Centre-ville' } });
        if (!quartier) {
            quartier = await models.Quartier.create({
                name: 'Centre-ville',
                description: 'Quartier central de Yaoundé',
                longitude: 11.5021,
                latitude: 3.8480,
                town_id: town.id,
                arrondissement_id: arrondissement.id
            });
            await quartier.update({ translate_id: quartier.id });
            console.log('✅ Quartier Centre-ville créé avec ID:', quartier.id);
        }

        // 5. Créer catégories de test
        const categories = [
            { name: 'Restaurant', slug: 'restaurant', icon: '🍽️' },
            { name: 'Hôtel', slug: 'hotel', icon: '🏨' },
            { name: 'Transport', slug: 'transport', icon: '🚌' },
            { name: 'Tourisme', slug: 'tourisme', icon: '🏛️' },
            { name: 'Santé', slug: 'sante', icon: '🏥' }
        ];

        for (const catData of categories) {
            let category = await models.Category.findOne({ where: { slug: catData.slug } });
            if (!category) {
                category = await models.Category.create(catData);
                await category.update({ translate_id: category.id });
                console.log(`✅ Catégorie ${catData.name} créée avec ID:`, category.id);
            }
        }

        console.log('\n🎉 Données de test initialisées avec succès !');
        console.log(`📋 Pour Postman, utilisez:`);
        console.log(`   - quartier_id: ${quartier.id}`);
        console.log(`   - category_id: 1 (ou autre selon vos besoins)`);

    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    initTestData();
}

module.exports = initTestData;
