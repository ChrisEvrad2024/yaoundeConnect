// fix_route_params.js - Corriger automatiquement les routes avec /: mal formaté
const fs = require('fs');
const path = require('path');

console.log('🔧 Correction automatique des routes problématiques...\n');

// Fonction pour corriger un fichier
const fixFile = (filePath, fileName) => {
    if (!fs.existsSync(filePath)) {
        return { found: false };
    }
    
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = originalContent;
    let changesMade = false;
    const changes = [];
    
    // Patterns à corriger et leurs remplacements
    const corrections = [
        {
            // Route se terminant par /:
            pattern: /(["'`])([^"'`]*)\/:(\s*["'`])/g,
            replacement: (match, quote1, path, quote2) => {
                changes.push(`"${path}/:" → "${path}/:id"`);
                return `${quote1}${path}/:id${quote2}`;
            },
            description: 'Route se terminant par /:'
        },
        {
            // app.use('/:') ou router.use('/:')
            pattern: /\.(use|get|post|put|delete|patch|all)\s*\(\s*(["'`])\/:(\s*["'`])/g,
            replacement: (match, method, quote1, quote2) => {
                changes.push(`"/:${quote2} → "/:id${quote2}`);
                return `.${method}(${quote1}/:id${quote2}`;
            },
            description: 'Route avec seulement /:'
        },
        {
            // Corriger /: suivi d'un caractère non valide
            pattern: /(["'`][^"'`]*)\/:([^a-zA-Z0-9_][^"'`]*["'`])/g,
            replacement: (match, before, after) => {
                changes.push(`"${before}/:${after}" → "${before}/:id${after}"`);
                return `${before}/:id${after}`;
            },
            description: 'Route avec /: suivi de caractère invalide'
        }
    ];
    
    // Appliquer les corrections
    corrections.forEach(({ pattern, replacement, description }) => {
        const beforeLength = modifiedContent.length;
        modifiedContent = modifiedContent.replace(pattern, replacement);
        if (modifiedContent.length !== beforeLength) {
            changesMade = true;
        }
    });
    
    // Sauvegarder si des changements ont été faits
    if (changesMade && changes.length > 0) {
        // Créer une sauvegarde
        const backupPath = filePath + '.backup';
        fs.writeFileSync(backupPath, originalContent);
        
        // Écrire le fichier corrigé
        fs.writeFileSync(filePath, modifiedContent);
        
        return {
            found: true,
            changes: changes,
            backupPath: backupPath
        };
    }
    
    return { found: false };
};

// Fonction pour vérifier si un fichier a des problèmes
const checkFile = (filePath) => {
    if (!fs.existsSync(filePath)) return false;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier s'il y a des patterns problématiques
    const problematicPatterns = [
        /['"]\/:(?![a-zA-Z0-9_])/,
        /['"]\/:$/,
        /['"]\/:['"`]/,
        /\/:\s+['"]/,
    ];
    
    return problematicPatterns.some(pattern => pattern.test(content));
};

// Liste des fichiers à vérifier et corriger
const files = [
    'src/app.js',
    'src/routes/auth.js',
    'src/routes/poi.js',
    'server.js',
    'app.js',
    'app_old.js'
];

let totalFixed = 0;

console.log('📋 Vérification et correction des fichiers...\n');

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    console.log(`📄 ${file}:`);
    
    if (!fs.existsSync(filePath)) {
        console.log('   ⚠️  Fichier non trouvé');
        return;
    }
    
    // Vérifier d'abord s'il y a un problème
    if (checkFile(filePath)) {
        console.log('   🔍 Problèmes détectés, correction en cours...');
        
        const result = fixFile(filePath, file);
        
        if (result.found) {
            console.log('   ✅ Fichier corrigé !');
            console.log('   📝 Changements effectués:');
            result.changes.forEach(change => {
                console.log(`      - ${change}`);
            });
            console.log(`   💾 Sauvegarde créée: ${path.basename(result.backupPath)}`);
            totalFixed++;
        }
    } else {
        console.log('   ✅ Aucun problème trouvé');
    }
    
    console.log('');
});

// Vérifier aussi tous les fichiers dans src/routes
console.log('📁 Vérification du dossier src/routes...\n');

const routesDir = path.join(__dirname, 'src', 'routes');
if (fs.existsSync(routesDir)) {
    const routeFiles = fs.readdirSync(routesDir);
    
    routeFiles.forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(routesDir, file);
            
            console.log(`📄 routes/${file}:`);
            
            if (checkFile(filePath)) {
                console.log('   🔍 Problèmes détectés, correction en cours...');
                
                const result = fixFile(filePath, `routes/${file}`);
                
                if (result.found) {
                    console.log('   ✅ Fichier corrigé !');
                    console.log('   📝 Changements effectués:');
                    result.changes.forEach(change => {
                        console.log(`      - ${change}`);
                    });
                    totalFixed++;
                }
            } else {
                console.log('   ✅ Aucun problème trouvé');
            }
            
            console.log('');
        }
    });
}

console.log('🎯 Résumé:');
console.log(`   Total de fichiers corrigés: ${totalFixed}`);

if (totalFixed > 0) {
    console.log('\n✅ Les corrections ont été appliquées !');
    console.log('💡 Des sauvegardes (.backup) ont été créées pour tous les fichiers modifiés.');
    console.log('\n🚀 Redémarrez maintenant votre serveur avec: npm run dev');
} else {
    console.log('\n✅ Aucune correction nécessaire.');
    console.log('💡 Si l\'erreur persiste, exécutez "node find_exact_route_problem.js" pour plus de détails.');
}