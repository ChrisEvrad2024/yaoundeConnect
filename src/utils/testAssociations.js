const models = require('../models');

const testAssociations = () => {
    console.log(' Test des associations entre modèles...');

    // Test User associations
    console.log('\n Associations User:');
    const userAssociations = Object.keys(models.User.associations);
    userAssociations.forEach(assoc => {
        console.log(`  ✅ ${assoc}: ${models.User.associations[assoc].associationType}`);
    });

    // Test PointInterest associations
    console.log('\n Associations PointInterest:');
    const poiAssociations = Object.keys(models.PointInterest.associations);
    poiAssociations.forEach(assoc => {
        console.log(`  ✅ ${assoc}: ${models.PointInterest.associations[assoc].associationType}`);
    });

    // Test Favorite associations
    console.log('\n  Associations Favorite:');
    const favoriteAssociations = Object.keys(models.Favorite.associations);
    favoriteAssociations.forEach(assoc => {
        console.log(`  ✅ ${assoc}: ${models.Favorite.associations[assoc].associationType}`);
    });

    console.log('\n🎉 Test des associations terminé !');
};

testAssociations();