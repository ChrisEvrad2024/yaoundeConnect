// check_server_import.js - Vérifier quel app.js est utilisé
const fs = require('fs');

console.log('🔍 Vérification de l\'import dans server.js...\n');

try {
    const serverContent = fs.readFileSync('./server.js', 'utf8');
    console.log('📄 Contenu de server.js:');
    console.log('='.repeat(50));
    console.log(serverContent);
    console.log('='.repeat(50));
    
    // Analyser les imports
    const lines = serverContent.split('\n');
    lines.forEach((line, index) => {
        if (line.includes('require') && line.includes('app')) {
            console.log(`\n🎯 Ligne ${index + 1} - Import détecté: ${line.trim()}`);
            
            if (line.includes('./src/app')) {
                console.log('✅ Utilise ./src/app.js (CORRECT)');
            } else if (line.includes('./app')) {
                console.log('⚠️  Utilise ./app.js (RACINE - peut-être le problème)');
            } else {
                console.log('🤔 Import non standard');
            }
        }
    });
    
} catch (error) {
    console.log('❌ Erreur lecture server.js:', error.message);
}

// Comparer les deux app.js
console.log('\n🔍 Comparaison des deux fichiers app.js...\n');

try {
    const srcAppContent = fs.readFileSync('./src/app.js', 'utf8');
    const rootAppContent = fs.readFileSync('./app.js', 'utf8');
    
    console.log('📊 Statistiques:');
    console.log(`   src/app.js: ${srcAppContent.length} caractères, ${srcAppContent.split('\n').length} lignes`);
    console.log(`   app.js: ${rootAppContent.length} caractères, ${rootAppContent.split('\n').length} lignes`);
    
    if (srcAppContent === rootAppContent) {
        console.log('✅ Les deux fichiers sont identiques');
    } else {
        console.log('⚠️  Les deux fichiers sont DIFFÉRENTS !');
        
        // Chercher les différences dans les routes
        const srcRoutes = srcAppContent.match(/app\.use\([^)]+\)/g) || [];
        const rootRoutes = rootAppContent.match(/app\.use\([^)]+\)/g) || [];
        
        console.log('\n📍 Routes dans src/app.js:');
        srcRoutes.forEach(route => console.log(`   ${route}`));
        
        console.log('\n📍 Routes dans app.js (racine):');
        rootRoutes.forEach(route => console.log(`   ${route}`));
    }
    
} catch (error) {
    console.log('❌ Erreur comparaison:', error.message);
}

console.log('\n🎯 Fin de la vérification');