// find_malformed_route.js - Trouve la route problématique
const fs = require('fs');
const path = require('path');

console.log('🔍 Recherche de la route mal formatée...\n');

// Fonction pour analyser un fichier
function analyzeFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        console.log(`📁 Analyse de ${filePath}:`);
        
        let hasRoutes = false;
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmedLine = line.trim();
            
            // Chercher les définitions de routes
            if (trimmedLine.includes('app.') || trimmedLine.includes('router.')) {
                if (trimmedLine.includes('.get') || trimmedLine.includes('.post') || 
                    trimmedLine.includes('.put') || trimmedLine.includes('.delete') ||
                    trimmedLine.includes('.use')) {
                    
                    hasRoutes = true;
                    console.log(`  Ligne ${lineNum}: ${trimmedLine}`);
                    
                    // Patterns problématiques spécifiques
                    const problematicPatterns = [
                        { pattern: /\/:\s*[,)]/, desc: "Paramètre vide (/:,)" },
                        { pattern: /\/:\s*$/, desc: "Paramètre vide en fin de ligne" },
                        { pattern: /\/:\s+/, desc: "Espace après : (/ :)" },
                        { pattern: /\/:[^a-zA-Z0-9_]/, desc: "Caractère invalide après :" },
                        { pattern: /app\.use\s*\(\s*['"][^'"]*:\s*['"]/, desc: "Paramètre dans app.use" },
                        { pattern: /['"][^'"]*\/:\s*['"]/, desc: "Route avec paramètre vide dans string" }
                    ];
                    
                    problematicPatterns.forEach(({pattern, desc}) => {
                        if (pattern.test(trimmedLine)) {
                            console.log(`    🚨 PROBLÈME DÉTECTÉ: ${desc}`);
                        }
                    });
                    
                    // Vérifier les quotes non fermées
                    const singleQuotes = (trimmedLine.match(/'/g) || []).length;
                    const doubleQuotes = (trimmedLine.match(/"/g) || []).length;
                    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
                        console.log(`    🚨 PROBLÈME: Quotes non fermées`);
                    }
                }
            }
        });
        
        if (!hasRoutes) {
            console.log(`  ✅ Aucune route trouvée`);
        }
        
        console.log(''); // Ligne vide
        
    } catch (error) {
        console.log(`❌ Erreur lecture ${filePath}:`, error.message);
    }
}

// Liste des fichiers à vérifier
const filesToCheck = [
    './src/app.js',
    './src/routes/auth.js',
    './src/routes/poi.js',
    './server.js',
    './app.js' // Au cas où il y aurait un app.js à la racine
];

// Vérifier chaque fichier
filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        analyzeFile(filePath);
    } else {
        console.log(`⚠️ Fichier non trouvé: ${filePath}\n`);
    }
});

// Recherche dans tous les fichiers .js du dossier src
console.log('🔍 Recherche dans tous les fichiers .js du dossier src...\n');

function searchInDirectory(dirPath) {
    try {
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                searchInDirectory(fullPath);
            } else if (file.endsWith('.js')) {
                analyzeFile(fullPath);
            }
        });
    } catch (error) {
        console.log(`❌ Erreur parcours ${dirPath}:`, error.message);
    }
}

if (fs.existsSync('./src')) {
    searchInDirectory('./src');
}

console.log('🎯 Recherche terminée');

// Test rapide de création de routes problématiques
console.log('\n🧪 Test des patterns problématiques:');
const express = require('express');
const app = express();

const testPatterns = [
    '/',
    '/test',
    '/:id',
    '/:',
    '/ :',
    '/api/:',
    '/test/:id',
    '/test/:'
];

testPatterns.forEach(pattern => {
    try {
        const router = express.Router();
        router.get(pattern, (req, res) => res.json({test: true}));
        console.log(`✅ Pattern "${pattern}" OK`);
    } catch (error) {
        console.log(`❌ Pattern "${pattern}" ERREUR:`, error.message);
    }
});