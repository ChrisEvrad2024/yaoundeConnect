const { sequelize } = require('../config/database');
const models = require('../models');

const testDatabase = async () => {
  try {
    // Test connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données OK');

    // Test création d'un utilisateur
    const testUser = await models.User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123'
    });
    console.log('✅ Création utilisateur OK');

    // Test création d'une catégorie
    const testCategory = await models.Category.create({
      name: 'Restaurant',
      slug: 'restaurant'
    });
    console.log('✅ Création catégorie OK');

    // Vérifier qu'il y a au moins une ville et un quartier
    const existingTown = await models.Town.findOne();
    const existingQuartier = await models.Quartier.findOne();

    if (!existingTown || !existingQuartier) {
      console.log('⚠️  Vous devez avoir au moins une ville et un quartier dans votre base');
      return;
    }

    // Test création d'un POI
    const testPOI = await models.PointInterest.create({
      name: 'Test POI',
      adress: 'Adresse test',
      description: "Un point d'intérêt de test",
      latitude: 3.848,
      longitude: 11.5021,
      quartier_id: existingQuartier.id,
      category_id: testCategory.id,
      user_id: testUser.id,
      created_by: testUser.id
    });
    console.log('✅ Création POI OK');

    // Test création d'un favori
    const testFavorite = await models.Favorite.create({
      user_id: testUser.id,
      poi_id: testPOI.id
    });
    console.log('✅ Création favori OK');

    // Test des associations
    const userWithFavorites = await models.User.findByPk(testUser.id, {
      include: ['favoritePOIs']
    });
    console.log('✅ Association User -> Favoris OK:', userWithFavorites.favoritePOIs.length);

    // Nettoyage des données de test
    await testFavorite.destroy();
    await testPOI.destroy();
    await testCategory.destroy();
    await testUser.destroy();
    console.log('✅ Nettoyage OK');

    console.log('🎉 Tous les tests passés avec le schéma existant !');
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
};

testDatabase();
