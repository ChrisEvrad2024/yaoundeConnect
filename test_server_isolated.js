// test_server_isolated.js - Version corrigée
const express = require('express');
require('dotenv').config();

console.log('🧪 Test du serveur étape par étape...\n');

const app = express();

// 1. Test serveur minimal
console.log('1️⃣ Test serveur minimal...');
app.get('/test', (req, res) => {
    res.json({ 
        status: 'success',
        message: 'Test OK',
        timestamp: new Date().toISOString()
    });
});

// 2. Middlewares de base
console.log('2️⃣ Ajout des middlewares de base...');
app.use(require('cors')());
console.log('✅ CORS ajouté');

app.use(express.json());
console.log('✅ JSON Parser ajouté');

// 3. Chargement des routes
console.log('\n3️⃣ Test ajout routes...');

// Route test simple
const testRouter = express.Router();
testRouter.get('/simple', (req, res) => res.json({ route: 'simple' }));
app.use('/api/test', testRouter);
console.log('✅ Route test simple ajoutée');

// Routes Auth
try {
    console.log('\n   Chargement des routes auth...');
    const authRoutes = require('./src/routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Routes auth ajoutées avec succès !');
} catch (error) {
    console.error('❌ Erreur chargement routes auth:', error.message);
    if (error.stack) console.error('Stack:', error.stack);
}

// Routes POI
try {
    console.log('\n4️⃣ Test ajout routes POI...');
    const poiRoutes = require('./src/routes/poi');
    app.use('/api/poi', poiRoutes);
    console.log('✅ Routes POI ajoutées avec succès !');
} catch (error) {
    console.error('❌ Erreur chargement routes POI:', error.message);
}

// 4. Gestion des erreurs 404 - VERSION CORRIGÉE
console.log('\n5️⃣ Configuration gestion erreurs...');
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        error: 'Endpoint non trouvé',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// 5. Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n✅ Serveur de test démarré sur le port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log('\n🧪 Routes de test disponibles:');
    console.log('   GET http://localhost:' + PORT + '/test');
    console.log('   GET http://localhost:' + PORT + '/api/test/simple');
    console.log('\n💡 Appuyez sur Ctrl+C pour arrêter.');
});

// Initialisation des services
require('./src/services/email');
console.log('✅ Service email initialisé');