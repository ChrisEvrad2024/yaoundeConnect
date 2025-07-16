const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');

const testDB = async () => {
    console.log('🔍 Test de connexion à la base de données...');

    try {
        // Vérifier les variables d'environnement
        console.log('📋 Variables DB chargées:');
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   User: ${process.env.DB_USER}`);
        console.log(`   Database: ${process.env.DB_NAME}`);
        console.log(`   Port: ${process.env.DB_PORT}`);

        await sequelize.authenticate();
        console.log('✅ Connexion MySQL réussie');

        // Test requête simple
        const [results] = await sequelize.query('SELECT 1 as test');
        console.log('✅ Requête test OK:', results[0].test);

        // Vérifier les tables existantes
        const [tables] = await sequelize.query('SHOW TABLES');
        console.log(`📋 Tables disponibles: ${tables.length}`);
        tables.slice(0, 5).forEach(table => {
            console.log(`  - ${Object.values(table)[0]}`);
        });
        if (tables.length > 5) {
            console.log(`  ... et ${tables.length - 5} autres`);
        }

        await sequelize.close();

    } catch (error) {
        console.error('❌ Erreur de connexion:', error.message);

        // Suggestions de correction selon l'erreur
        if (error.message.includes('Access denied')) {
            console.log('\n💡 Suggestions:');
            console.log('1. Vérifiez vos identifiants MySQL dans .env');
            console.log('2. Assurez-vous que MySQL est démarré');
            console.log('3. Vérifiez les permissions utilisateur');
        }

        process.exit(1);
    }
};

testDB();