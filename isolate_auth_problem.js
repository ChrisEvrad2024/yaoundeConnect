// isolate_auth_problem.js - Isoler le problème dans auth
console.log('🔍 Isolation du problème auth...\n');

const express = require('express');

// Test 1: App minimal sans routes
console.log('1️⃣ Test app minimal...');
try {
    const app1 = express();
    app1.get('/', (req, res) => res.json({test: 'minimal'}));
    console.log('✅ App minimal OK');
} catch (error) {
    console.log('❌ Erreur app minimal:', error.message);
    return;
}

// Test 2: App avec middlewares de base
console.log('\n2️⃣ Test app avec middlewares...');
try {
    const app2 = express();
    const cors = require('cors');
    const helmet = require('helmet');
    const morgan = require('morgan');
    
    app2.use(helmet());
    app2.use(cors());
    app2.use(morgan('combined'));
    app2.use(express.json());
    app2.get('/', (req, res) => res.json({test: 'middlewares'}));
    console.log('✅ App avec middlewares OK');
} catch (error) {
    console.log('❌ Erreur middlewares:', error.message);
    return;
}

// Test 3: Import des composants auth individuellement
console.log('\n3️⃣ Test imports auth individuels...');

try {
    console.log('   - AuthController...');
    const AuthController = require('./src/controllers/authController');
    console.log('   ✅ AuthController OK');
} catch (error) {
    console.log('   ❌ AuthController:', error.message);
}

try {
    console.log('   - authMiddleware...');
    const authMiddleware = require('./src/middlewares/authMiddleware');
    console.log('   ✅ authMiddleware OK');
} catch (error) {
    console.log('   ❌ authMiddleware:', error.message);
}

try {
    console.log('   - validationMiddleware...');
    const validationMiddleware = require('./src/middlewares/validationMiddleware');
    console.log('   ✅ validationMiddleware OK');
} catch (error) {
    console.log('   ❌ validationMiddleware:', error.message);
}

try {
    console.log('   - authValidator...');
    const authValidator = require('./src/validators/authValidator');
    console.log('   ✅ authValidator OK');
} catch (error) {
    console.log('   ❌ authValidator:', error.message);
}

try {
    console.log('   - errorHandler...');
    const errorHandler = require('./src/middlewares/errorHandler');
    console.log('   ✅ errorHandler OK');
} catch (error) {
    console.log('   ❌ errorHandler:', error.message);
}

// Test 4: Création du router auth étape par étape
console.log('\n4️⃣ Test création router auth...');
try {
    const router = express.Router();
    
    const AuthController = require('./src/controllers/authController');
    const authMiddleware = require('./src/middlewares/authMiddleware');
    const validationMiddleware = require('./src/middlewares/validationMiddleware');
    const authValidator = require('./src/validators/authValidator');
    
    console.log('   - Ajout route /register...');
    router.post('/register',
        validationMiddleware(authValidator.register),
        AuthController.register
    );
    console.log('   ✅ Route /register OK');
    
    console.log('   - Ajout route /login...');
    router.post('/login',
        validationMiddleware(authValidator.login),
        AuthController.login
    );
    console.log('   ✅ Route /login OK');
    
    console.log('   - Ajout route /verify-email...');
    router.get('/verify-email',
        validationMiddleware(authValidator.verifyEmail, 'query'),
        AuthController.verifyEmail
    );
    console.log('   ✅ Route /verify-email OK');
    
    console.log('   - Ajout route /resend-verification...');
    router.post('/resend-verification',
        validationMiddleware(authValidator.resendVerification),
        AuthController.resendVerification
    );
    console.log('   ✅ Route /resend-verification OK');
    
    console.log('   - Ajout route /me...');
    router.get('/me',
        authMiddleware,
        AuthController.getProfile
    );
    console.log('   ✅ Route /me OK');
    
    console.log('   - Ajout route /logout...');
    router.post('/logout',
        authMiddleware,
        AuthController.logout
    );
    console.log('   ✅ Route /logout OK');
    
} catch (error) {
    console.log('   ❌ Erreur création router:', error.message);
    console.log('   Stack:', error.stack);
}

// Test 5: Import direct du fichier routes/auth.js
console.log('\n5️⃣ Test import direct routes/auth.js...');
try {
    const authRoutes = require('./src/routes/auth');
    console.log('✅ Import routes/auth.js OK');
} catch (error) {
    console.log('❌ Erreur import routes/auth.js:', error.message);
    console.log('Stack:', error.stack);
}

// Test 6: App complète étape par étape
console.log('\n6️⃣ Test app complète étape par étape...');
try {
    const app = express();
    const cors = require('cors');
    const helmet = require('helmet');
    const morgan = require('morgan');
    const path = require('path');
    
    console.log('   - Middlewares sécurité...');
    app.use(helmet());
    app.use(cors({
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true
    }));
    
    console.log('   - Middlewares base...');
    app.use(morgan('combined'));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    console.log('   - Static files...');
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    
    console.log('   - Routes de base...');
    app.get('/', (req, res) => {
        res.json({
            message: 'API yaoundeConnect - Test',
            status: 'running'
        });
    });
    
    app.get('/health', (req, res) => {
        res.json({ status: 'healthy' });
    });
    
    console.log('   - Routes auth...');
    app.use('/api/auth', require('./src/routes/auth'));
    
    console.log('   - Route 404...');
    app.use('*', (req, res) => {
        res.status(404).json({
            error: 'Route non trouvée'
        });
    });
    
    console.log('   - Error handler...');
    const errorHandler = require('./src/middlewares/errorHandler');
    app.use(errorHandler);
    
    console.log('✅ App complète assemblée avec succès !');
    
} catch (error) {
    console.log('❌ Erreur app complète:', error.message);
    console.log('Stack:', error.stack);
}

console.log('\n🎯 Fin du diagnostic isolé');