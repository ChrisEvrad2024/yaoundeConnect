// fix_middleware_location.js - Déplacer les middlewares au bon endroit
const fs = require('fs');
const path = require('path');

console.log('🔧 Correction de l\'emplacement des middlewares...\n');

// 1. Vérifier que les middlewares sont dans le bon dossier
console.log('1️⃣ Vérification des emplacements...');

const filesToMove = [
    {
        from: 'src/validators/validationMiddleware.js',
        to: 'src/middlewares/validationMiddleware.js',
        isMiddleware: true
    },
    {
        from: 'src/validators/roleMiddleware.js',
        to: 'src/middlewares/roleMiddleware.js',
        isMiddleware: true
    }
];

// Créer le dossier middlewares si nécessaire
const middlewaresDir = path.join(__dirname, 'src', 'middlewares');
if (!fs.existsSync(middlewaresDir)) {
    fs.mkdirSync(middlewaresDir, { recursive: true });
    console.log('✅ Dossier src/middlewares créé');
}

// Déplacer les fichiers
filesToMove.forEach(({ from, to, isMiddleware }) => {
    const fromPath = path.join(__dirname, from);
    const toPath = path.join(__dirname, to);
    
    if (fs.existsSync(fromPath)) {
        if (isMiddleware) {
            console.log(`\n📁 Déplacement de ${from} vers ${to}...`);
            
            // Lire le contenu
            const content = fs.readFileSync(fromPath, 'utf8');
            
            // Écrire dans le nouveau dossier
            fs.writeFileSync(toPath, content);
            
            // Supprimer l'ancien fichier
            fs.unlinkSync(fromPath);
            
            console.log('✅ Fichier déplacé avec succès');
        }
    } else {
        console.log(`⚠️  ${from} n'existe pas`);
    }
});

// 2. Vérifier tous les fichiers dans app.js pour des routes problématiques
console.log('\n2️⃣ Recherche approfondie du problème...');

const checkFile = (filePath, fileName) => {
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`\n📄 Analyse de ${fileName}:`);
    
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Patterns problématiques pour path-to-regexp
        const problematicPatterns = [
            { pattern: /app\.use\s*\(\s*['"`]\/:[^a-zA-Z0-9_]/, desc: 'Route avec paramètre vide après use' },
            { pattern: /app\.all\s*\(\s*['"`]\/:[^a-zA-Z0-9_]/, desc: 'Route avec paramètre vide après all' },
            { pattern: /router\.\w+\s*\(\s*['"`]\/:[^a-zA-Z0-9_]/, desc: 'Route avec paramètre vide' },
            { pattern: /['"`]\/:\s*['"`]/, desc: 'Paramètre vide (/:)' },
            { pattern: /['"`]\/:\s*[,)]/, desc: 'Paramètre incomplet' },
            { pattern: /app\.use\s*\(\s*['"`]\/\s*:\s*['"`]/, desc: 'Espace avant :' }
        ];
        
        problematicPatterns.forEach(({ pattern, desc }) => {
            if (pattern.test(line)) {
                console.log(`   ❌ Ligne ${lineNum}: ${desc}`);
                console.log(`      ${line.trim()}`);
            }
        });
        
        // Vérifier spécifiquement les app.use et app.all
        if (line.includes('app.use') || line.includes('app.all')) {
            // Extraire le premier argument
            const match = line.match(/app\.(use|all)\s*\(\s*['"`]([^'"`]*)/);
            if (match && match[2]) {
                const route = match[2];
                if (route.includes(':') && !route.match(/:[a-zA-Z0-9_]+/)) {
                    console.log(`   🚨 PROBLÈME TROUVÉ - Ligne ${lineNum}: Route mal formatée "${route}"`);
                    console.log(`      ${line.trim()}`);
                }
            }
        }
    });
};

// Fichiers à vérifier
const filesToCheck = [
    { path: 'src/app.js', name: 'app.js' },
    { path: 'server.js', name: 'server.js' },
    { path: 'app.js', name: 'app.js (racine)' },
    { path: 'src/routes/auth.js', name: 'routes/auth.js' },
    { path: 'src/routes/poi.js', name: 'routes/poi.js' }
];

filesToCheck.forEach(({ path: filePath, name }) => {
    checkFile(path.join(__dirname, filePath), name);
});

// 3. Vérifier le problème spécifique dans app.js
console.log('\n3️⃣ Analyse spécifique de app.js...');

const appPath = path.join(__dirname, 'src', 'app.js');
if (fs.existsSync(appPath)) {
    const content = fs.readFileSync(appPath, 'utf8');
    
    // Chercher la ligne app.all('*', ...)
    if (content.includes("app.all('*'")) {
        console.log('✅ Route 404 trouvée avec app.all(\'*\', ...)');
    } else if (content.includes('app.use(\'*\'')) {
        console.log('⚠️  Route 404 utilise app.use au lieu de app.all');
        
        // Corriger automatiquement
        const correctedContent = content.replace(
            /app\.use\s*\(\s*['"]\*['"]/g,
            "app.all('*'"
        );
        
        if (correctedContent !== content) {
            fs.writeFileSync(appPath, correctedContent);
            console.log('✅ Corrigé app.use(\'*\') en app.all(\'*\')');
        }
    }
    
    // Vérifier s'il y a des routes avec /: mal formatées
    const regex = /app\.\w+\s*\(\s*['"`]([^'"`]*)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const route = match[1];
        if (route.includes('/:') && !route.match(/\/:[a-zA-Z0-9_]+/)) {
            console.log(`❌ Route problématique trouvée: "${route}"`);
        }
    }
}

console.log('\n🎯 Vérifications terminées.');
console.log('\n💡 Si le problème persiste, vérifiez:');
console.log('   1. Que tous les middlewares sont dans src/middlewares/');
console.log('   2. Que les imports utilisent les bons chemins');
console.log('   3. Redémarrez le serveur après les corrections');