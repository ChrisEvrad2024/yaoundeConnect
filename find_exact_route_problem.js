// find_exact_route_problem.js - Trouver exactement quelle route cause le problème
const fs = require('fs');
const path = require('path');

console.log('🔍 Recherche de la route problématique avec "/:"\n');

// Fonction pour analyser un fichier ligne par ligne
const analyzeFile = (filePath, fileName) => {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${fileName} n'existe pas`);
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let problemFound = false;
    
    console.log(`\n📄 Analyse de ${fileName}:`);
    
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Patterns spécifiques qui causent "Missing parameter name"
        const problematicPatterns = [
            /['"]\/:(?![a-zA-Z0-9_])/,  // /: sans nom de paramètre
            /['"]\/:$/,                   // /: à la fin
            /['"]\/:['"`]/,              // /: suivi d'une quote
            /\/:\s+['"]/,                // /: avec espace
            /\/:[^a-zA-Z0-9_'"]/,        // /: suivi d'un caractère non valide
        ];
        
        problematicPatterns.forEach(pattern => {
            if (pattern.test(line)) {
                console.log(`\n🚨 PROBLÈME TROUVÉ - Ligne ${lineNum}:`);
                console.log(`   ${line.trim()}`);
                console.log(`   ^^^ Cette ligne contient "/:" sans nom de paramètre valide`);
                problemFound = true;
                
                // Essayer de comprendre le contexte
                if (line.includes('app.use') || line.includes('app.all') || line.includes('router.')) {
                    console.log(`   Contexte: Définition de route`);
                }
            }
        });
        
        // Recherche spécifique de patterns exacts
        if (line.includes('/:') && !line.includes('/:id') && !line.includes('/:param') && !line.match(/\/:[a-zA-Z0-9_]+/)) {
            if (!problemFound) {
                console.log(`\n⚠️  Ligne ${lineNum} suspecte:`);
                console.log(`   ${line.trim()}`);
            }
        }
    });
    
    if (!problemFound) {
        console.log('   ✅ Aucun problème trouvé');
    }
};

// Liste des fichiers à vérifier
const filesToCheck = [
    'src/app.js',
    'src/routes/auth.js',
    'src/routes/poi.js',
    'server.js',
    'app.js',
    'app_old.js'
];

console.log('🔍 Recherche dans tous les fichiers...');

filesToCheck.forEach(file => {
    analyzeFile(path.join(__dirname, file), file);
});

// Vérifier aussi tous les fichiers .js dans src
console.log('\n🔍 Recherche dans tous les fichiers .js du dossier src...');

const searchDirectory = (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            searchDirectory(fullPath);
        } else if (file.endsWith('.js')) {
            const relativePath = path.relative(__dirname, fullPath);
            analyzeFile(fullPath, relativePath);
        }
    });
};

searchDirectory(path.join(__dirname, 'src'));

// Test spécifique pour voir quel type de route cause le problème
console.log('\n🧪 Test de différents patterns de routes:');

const testPatterns = [
    '/:id',          // OK
    '/:',            // Problème !
    '/: ',           // Problème !
    '/:)',           // Problème !
    '/test/:',       // Problème !
    '/test/:id',     // OK
    '*',             // OK pour 404
    '/*',            // OK
];

testPatterns.forEach(pattern => {
    try {
        // Simuler ce que fait Express
        const hasInvalidParam = pattern.includes('/:') && !pattern.match(/\/:[a-zA-Z0-9_]+/);
        if (hasInvalidParam) {
            console.log(`❌ "${pattern}" - Causerait l'erreur "Missing parameter name"`);
        } else {
            console.log(`✅ "${pattern}" - Pattern valide`);
        }
    } catch (e) {
        console.log(`❌ "${pattern}" - Erreur: ${e.message}`);
    }
});

console.log('\n💡 Solution: Recherchez et corrigez toutes les routes contenant "/:" sans nom de paramètre valide.');
console.log('   Exemples de corrections:');
console.log('   - "/:" → "/:id" ou "/" (selon le besoin)');
console.log('   - "/test/:" → "/test/:param" ou "/test" (selon le besoin)');
console.log('\n🎯 Fin de la recherche');