// check_all_routes.js - Debug des routes avec paramètres
console.log('🔍 Vérification de toutes les routes...\n');

const express = require('express');

// Test routes auth
try {
    console.log('1️⃣ Test routes auth...');
    const authRoutes = require('./src/routes/auth');
    console.log('✅ Routes auth chargées');
} catch (error) {
    console.log('❌ Erreur routes auth:', error.message);
}

// Test routes POI (si elles existent)
try {
    console.log('\n2️⃣ Test routes POI...');
    const poiRoutes = require('./src/routes/poi');
    console.log('✅ Routes POI chargées');
} catch (error) {
    console.log('❌ Erreur routes POI:', error.message);
}

// Test app.js
try {
    console.log('\n3️⃣ Test app.js...');
    const app = require('./src/app');
    console.log('✅ App chargée');
} catch (error) {
    console.log('❌ Erreur app.js:', error.message);
    console.log('Stack:', error.stack);
}

console.log('\n4️⃣ Recherche de routes avec paramètres...');

// Vérifier le contenu du fichier app.js pour les routes
const fs = require('fs');

try {
    const appContent = fs.readFileSync('./src/app.js', 'utf8');
    const lines = appContent.split('\n');
    
    console.log('Lignes contenant des routes dans app.js:');
    lines.forEach((line, index) => {
        if (line.includes('app.use') && line.includes('/')) {
            console.log(`  Ligne ${index + 1}: ${line.trim()}`);
        }
    });
    
    // Chercher des patterns problématiques
    const problematicPatterns = [
        /\/:[^\/\s]*\//, // Pattern like /:param/
        /\/:\s/, // Pattern like /: (espace après :)
        /\/:\)/, // Pattern like /:)
        /\/:\}/, // Pattern like /:}
    ];
    
    problematicPatterns.forEach((pattern, index) => {
        if (pattern.test(appContent)) {
            console.log(`⚠️  Pattern problématique ${index + 1} détecté:`, pattern);
        }
    });
    
} catch (error) {
    console.log('❌ Erreur lecture app.js:', error.message);
}

console.log('\n🎯 Fin de la vérification');