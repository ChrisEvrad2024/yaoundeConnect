// debug_poi_routes.js - Trouve la route POI problématique
console.log('🔍 Debug des routes POI...\n');

const fs = require('fs');
const express = require('express');

try {
    // Lire le contenu du fichier POI
    const poiContent = fs.readFileSync('./src/routes/poi.js', 'utf8');
    console.log('📄 Contenu du fichier poi.js:');
    console.log('=' * 50);
    console.log(poiContent);
    console.log('=' * 50);
    
    // Chercher des patterns problématiques
    const lines = poiContent.split('\n');
    
    console.log('\n🔍 Analyse ligne par ligne:');
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Chercher les définitions de routes
        if (line.includes('router.') && (line.includes('get') || line.includes('post') || line.includes('put') || line.includes('delete'))) {
            console.log(`Ligne ${lineNum}: ${line.trim()}`);
            
            // Patterns problématiques
            if (line.includes('/:id:') || line.includes('/: ') || line.includes('/:)') || line.includes('/:}')) {
                console.log(`  ⚠️  PROBLÈME DÉTECTÉ: paramètre mal formaté`);
            }
            
            // Vérifier les quotes non fermées
            const singleQuotes = (line.match(/'/g) || []).length;
            const doubleQuotes = (line.match(/"/g) || []).length;
            if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
                console.log(`  ⚠️  PROBLÈME DÉTECTÉ: quotes non fermées`);
            }
        }
    });
    
    console.log('\n🧪 Test de chargement route par route...');
    
    // Essayer de créer un router et ajouter les routes une par une
    const router = express.Router();
    
    // Simuler les imports (remplacez par les vrais si nécessaire)
    const mockController = {
        createPOI: (req, res) => res.json({test: 'createPOI'}),
        getPOI: (req, res) => res.json({test: 'getPOI'}),
        searchPOI: (req, res) => res.json({test: 'searchPOI'}),
        findNearbyPOI: (req, res) => res.json({test: 'findNearbyPOI'}),
        updatePOI: (req, res) => res.json({test: 'updatePOI'}),
        deletePOI: (req, res) => res.json({test: 'deletePOI'}),
        getPoiStats: (req, res) => res.json({test: 'getPoiStats'}),
        uploadImages: (req, res) => res.json({test: 'uploadImages'})
    };
    
    const mockMiddleware = (req, res, next) => next();
    
    // Tester chaque type de route courant
    const testRoutes = [
        () => router.get('/', mockController.searchPOI),
        () => router.get('/nearby', mockController.findNearbyPOI),
        () => router.get('/:id', mockController.getPOI),
        () => router.get('/:id/stats', mockController.getPoiStats),
        () => router.post('/', mockController.createPOI),
        () => router.put('/:id', mockController.updatePOI),
        () => router.delete('/:id', mockController.deletePOI),
        () => router.post('/:id/upload-images', mockController.uploadImages)
    ];
    
    testRoutes.forEach((testRoute, index) => {
        try {
            testRoute();
            console.log(`✅ Route test ${index + 1} OK`);
        } catch (error) {
            console.log(`❌ Route test ${index + 1} ERREUR:`, error.message);
        }
    });

} catch (error) {
    console.log('❌ Erreur lecture fichier POI:', error.message);
}

console.log('\n🎯 Fin du debug POI');