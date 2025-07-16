// debug_validator_files.js - Diagnostic complet des fichiers validators
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnostic des fichiers validators...\n');

// 1. Vérifier la structure des dossiers
console.log('1️⃣ Vérification de la structure des dossiers...');
const validatorsPath = path.join(__dirname, 'src', 'validators');

if (!fs.existsSync(validatorsPath)) {
    console.log('❌ Le dossier src/validators n\'existe pas !');
    console.log('   Création du dossier...');
    fs.mkdirSync(validatorsPath, { recursive: true });
} else {
    console.log('✅ Dossier src/validators existe');
}

// 2. Lister les fichiers dans validators
console.log('\n2️⃣ Fichiers dans src/validators:');
try {
    const files = fs.readdirSync(validatorsPath);
    if (files.length === 0) {
        console.log('   ⚠️  Aucun fichier trouvé');
    } else {
        files.forEach(file => {
            console.log(`   - ${file}`);
            // Vérifier le contenu de chaque fichier
            const filePath = path.join(validatorsPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const firstLine = content.split('\n')[0];
            console.log(`     Première ligne: ${firstLine}`);
            
            // Vérifier si c'est un validator Joi
            if (content.includes('Joi.object')) {
                console.log('     ✅ Semble être un validator Joi');
            } else {
                console.log('     ⚠️  Ne semble pas être un validator Joi');
            }
        });
    }
} catch (error) {
    console.log('❌ Erreur lecture dossier:', error.message);
}

// 3. Vérifier le contenu exact d'authValidator.js
console.log('\n3️⃣ Analyse détaillée de authValidator.js:');
const authValidatorPath = path.join(validatorsPath, 'authValidator.js');

if (fs.existsSync(authValidatorPath)) {
    const content = fs.readFileSync(authValidatorPath, 'utf8');
    console.log('📄 Contenu actuel (premières lignes):');
    console.log('=' . repeat(50));
    console.log(content.substring(0, 500) + '...');
    console.log('=' . repeat(50));
    
    // Analyser le module exporté
    try {
        delete require.cache[require.resolve(authValidatorPath)];
        const authValidator = require(authValidatorPath);
        console.log('\n📦 Module exporté:');
        console.log('   Type:', typeof authValidator);
        if (typeof authValidator === 'object') {
            console.log('   Propriétés:', Object.keys(authValidator));
        }
    } catch (error) {
        console.log('❌ Erreur chargement module:', error.message);
    }
} else {
    console.log('❌ authValidator.js n\'existe pas !');
}

// 4. Vérifier les imports dans les routes
console.log('\n4️⃣ Vérification des imports dans routes/auth.js:');
const authRoutesPath = path.join(__dirname, 'src', 'routes', 'auth.js');

if (fs.existsSync(authRoutesPath)) {
    const content = fs.readFileSync(authRoutesPath, 'utf8');
    const lines = content.split('\n');
    
    // Chercher les imports
    lines.forEach((line, index) => {
        if (line.includes('require') && line.includes('validator')) {
            console.log(`   Ligne ${index + 1}: ${line.trim()}`);
        }
    });
    
    // Chercher l'utilisation d'authValidator
    console.log('\n   Utilisation d\'authValidator:');
    lines.forEach((line, index) => {
        if (line.includes('authValidator.')) {
            console.log(`   Ligne ${index + 1}: ${line.trim()}`);
        }
    });
} else {
    console.log('❌ routes/auth.js n\'existe pas !');
}

// 5. Test direct du problème
console.log('\n5️⃣ Test direct du problème:');
try {
    const express = require('express');
    const router = express.Router();
    
    // Tester avec une route simple
    router.get('/test', (req, res) => res.json({ test: true }));
    console.log('✅ Route simple fonctionne');
    
    // Tester avec un paramètre
    router.get('/test/:id', (req, res) => res.json({ id: req.params.id }));
    console.log('✅ Route avec paramètre fonctionne');
    
    // Tester le chargement des modules
    console.log('\n   Test chargement des modules:');
    
    try {
        const validationMiddleware = require('./src/middlewares/validationMiddleware');
        console.log('   ✅ validationMiddleware chargé, type:', typeof validationMiddleware);
    } catch (e) {
        console.log('   ❌ Erreur validationMiddleware:', e.message);
    }
    
    try {
        const authValidator = require('./src/validators/authValidator');
        console.log('   ✅ authValidator chargé, type:', typeof authValidator);
        if (authValidator.register) {
            console.log('   ✅ authValidator.register existe');
        } else {
            console.log('   ❌ authValidator.register n\'existe pas !');
        }
    } catch (e) {
        console.log('   ❌ Erreur authValidator:', e.message);
    }
    
} catch (error) {
    console.log('❌ Erreur test:', error.message);
}

// 6. Recherche de patterns problématiques
console.log('\n6️⃣ Recherche de routes mal formatées:');
const routesPath = path.join(__dirname, 'src', 'routes');

if (fs.existsSync(routesPath)) {
    const routeFiles = fs.readdirSync(routesPath);
    
    routeFiles.forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(routesPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            console.log(`\n   Analyse de ${file}:`);
            lines.forEach((line, index) => {
                // Patterns problématiques
                if (line.match(/['"]\/:(?![a-zA-Z0-9_])/)) {
                    console.log(`     ⚠️  Ligne ${index + 1}: Route suspecte - ${line.trim()}`);
                }
                if (line.includes('router.') && line.includes('undefined')) {
                    console.log(`     ❌ Ligne ${index + 1}: Undefined dans route - ${line.trim()}`);
                }
            });
        }
    });
}

console.log('\n🎯 Fin du diagnostic');