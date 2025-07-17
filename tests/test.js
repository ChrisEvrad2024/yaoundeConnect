const { execSync } = require('child_process');

const runTests = () => {
    console.log(' Lancement de la suite de tests yaoundeConnect...\n');

    try {
        // Tests unitaires
        console.log(' Tests unitaires...');
        execSync('npx jest tests/services tests/controllers tests/middlewares --verbose',
            { stdio: 'inherit' }
        );

        // Tests d'intégration
        console.log('\n Tests d\'intégration...');
        execSync('npx jest tests/integration --verbose',
            { stdio: 'inherit' }
        );

        // Tests de performance
        console.log('\n Tests de performance...');
        execSync('npx jest tests/performance --verbose',
            { stdio: 'inherit' }
        );

        // Tests E2E
        console.log('\n Tests End-to-End...');
        execSync('npx jest tests/e2e --verbose',
            { stdio: 'inherit' }
        );

        // Rapport de couverture
        console.log('\n Génération du rapport de couverture...');
        execSync('npx jest --coverage',
            { stdio: 'inherit' }
        );

        console.log('\n Tous les tests sont passés avec succès !');

    } catch (error) {
        console.error('\n Échec des tests:', error.message);
        process.exit(1);
    }
};

if (require.main === module) {
    runTests();
}

module.exports = runTests;