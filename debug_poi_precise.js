// debug_poi_precise.js - Trouve exactement quelle route POI pose problème
console.log('🔍 Debug précis des routes POI...\n');

const express = require('express');

// Simuler les imports manquants avec des mocks
const mockController = {
    createPOI: (req, res) => res.json({mock: 'createPOI'}),
    getPOI: (req, res) => res.json({mock: 'getPOI'}),
    searchPOI: (req, res) => res.json({mock: 'searchPOI'}),
    findNearbyPOI: (req, res) => res.json({mock: 'findNearbyPOI'}),
    updatePOI: (req, res) => res.json({mock: 'updatePOI'}),
    deletePOI: (req, res) => res.json({mock: 'deletePOI'}),
    getPoiStats: (req, res) => res.json({mock: 'getPoiStats'}),
    uploadImages: (req, res) => res.json({mock: 'uploadImages'})
};

const mockMiddleware = (req, res, next) => next();
const mockValidation = (schema, source) => mockMiddleware;

// Test chaque route POI individuellement
const poiRoutes = [
    {
        name: "GET /",
        test: () => {
            const router = express.Router();
            router.get('/', mockValidation(), mockController.searchPOI);
            return router;
        }
    },
    {
        name: "GET /nearby", 
        test: () => {
            const router = express.Router();
            router.get('/nearby', mockValidation(), mockController.findNearbyPOI);
            return router;
        }
    },
    {
        name: "GET /:id",
        test: () => {
            const router = express.Router();
            router.get('/:id', mockValidation(), mockController.getPOI);
            return router;
        }
    },
    {
        name: "GET /:id/stats",
        test: () => {
            const router = express.Router();
            router.get('/:id/stats', mockValidation(), mockController.getPoiStats);
            return router;
        }
    },
    {
        name: "POST /",
        test: () => {
            const router = express.Router();
            router.post('/', mockMiddleware, mockMiddleware, mockValidation(), mockController.createPOI);
            return router;
        }
    },
    {
        name: "PUT /:id",
        test: () => {
            const router = express.Router();
            router.put('/:id', mockMiddleware, mockValidation(), mockController.updatePOI);
            return router;
        }
    },
    {
        name: "DELETE /:id",
        test: () => {
            const router = express.Router();
            router.delete('/:id', mockMiddleware, mockValidation(), mockController.deletePOI);
            return router;
        }
    },
    {
        name: "POST /:id/upload-images",
        test: () => {
            const router = express.Router();
            router.post('/:id/upload-images', mockMiddleware, mockValidation(), mockController.uploadImages);
            return router;
        }
    }
];

console.log('🧪 Test de chaque route POI individuellement...\n');

let problematicRoute = null;

for (let i = 0; i < poiRoutes.length; i++) {
    const route = poiRoutes[i];
    try {
        console.log(`${i + 1}️⃣ Test de ${route.name}...`);
        const router = route.test();
        
        // Tester l'ajout à une app
        const testApp = express();
        testApp.use('/api/poi', router);
        
        console.log(`   ✅ ${route.name} OK`);
    } catch (error) {
        console.log(`   ❌ ${route.name} ERREUR:`, error.message);
        problematicRoute = route.name;
        break;
    }
}

// Test avec les vrais imports si les mocks passent
if (!problematicRoute) {
    console.log('\n🔍 Tous les mocks passent, test avec les vrais imports...\n');
    
    try {
        console.log('1️⃣ Import du vrai POIController...');
        const POIController = require('./src/controllers/poiController');
        console.log('✅ POIController importé');
        
        console.log('2️⃣ Import roleMiddleware...');
        const roleMiddleware = require('./src/middlewares/roleMiddleware');
        console.log('✅ roleMiddleware importé, type:', typeof roleMiddleware);
        console.log('   - collecteur:', typeof roleMiddleware.collecteur);
        
        console.log('3️⃣ Import uploadMiddleware...');
        const { uploadPOIImages } = require('./src/middlewares/uploadMiddleware');
        console.log('✅ uploadMiddleware importé');
        console.log('   - uploadPOIImages:', typeof uploadPOIImages);
        
        console.log('4️⃣ Import poiValidator...');
        const poiValidator = require('./src/validators/poiValidator');
        console.log('✅ poiValidator importé');
        
        console.log('5️⃣ Import validationMiddleware...');
        const validationMiddleware = require('./src/middlewares/validationMiddleware');
        console.log('✅ validationMiddleware importé');
        
        // Test de la route la plus complexe (POST /)
        console.log('\n6️⃣ Test de la route POST / (la plus complexe)...');
        const router = express.Router();
        const authMiddleware = require('./src/middlewares/authMiddleware');
        
        router.post('/',
            authMiddleware,
            roleMiddleware.collecteur,
            uploadPOIImages,
            validationMiddleware(poiValidator.create),
            POIController.createPOI
        );
        
        console.log('✅ Route POST / créée avec les vrais imports');
        
        // Test ajout à l'app
        const testApp = express();
        testApp.use('/api/poi', router);
        console.log('✅ Route ajoutée à l\'app sans erreur');
        
    } catch (error) {
        console.log('❌ Erreur avec les vrais imports:', error.message);
        console.log('Stack:', error.stack);
    }
}

console.log('\n🎯 Fin du debug précis POI');