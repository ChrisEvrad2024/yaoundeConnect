// intercept_path_to_regexp.js - Intercepter l'erreur directement dans path-to-regexp
const Module = require('module');
const originalRequire = Module.prototype.require;

console.log('🔍 Interception de path-to-regexp pour tracer l\'erreur\n');

let errorContext = null;

// Intercepter path-to-regexp
Module.prototype.require = function (id) {
    const result = originalRequire.apply(this, arguments);

    if (id.includes('path-to-regexp')) {
        console.log('📦 path-to-regexp intercepté!');

        // Wrapper la fonction lexer
        if (result.lexer) {
            const originalLexer = result.lexer;
            result.lexer = function (str) {
                errorContext = str;
                return originalLexer.apply(this, arguments);
            };
        }

        // Wrapper la fonction parse
        if (result.parse) {
            const originalParse = result.parse;
            result.parse = function (str, options) {
                console.log(`\n🔍 parse() appelé avec: "${str}"`);
                errorContext = str;

                try {
                    return originalParse.apply(this, arguments);
                } catch (error) {
                    console.log(`\n🚨 ERREUR dans parse()!`);
                    console.log(`   Input: "${str}"`);
                    console.log(`   Erreur: ${error.message}`);
                    console.log(`\n   Stack trace:`);
                    console.trace();
                    throw error;
                }
            };
        }

        // Wrapper pathToRegexp
        if (result.pathToRegexp) {
            const originalPathToRegexp = result.pathToRegexp;
            result.pathToRegexp = function (path, keys, options) {
                if (typeof path === 'string') {
                    console.log(`\n🔍 pathToRegexp() appelé avec: "${path}"`);

                    // Vérifier si le path a un problème
                    if (path.includes('/:') && !path.match(/\/:[a-zA-Z0-9_]+/)) {
                        console.log(`   ⚠️  Path suspect détecté!`);
                    }
                }

                try {
                    return originalPathToRegexp.apply(this, arguments);
                } catch (error) {
                    console.log(`\n🚨 ERREUR dans pathToRegexp()!`);
                    console.log(`   Path: "${path}"`);
                    console.log(`   Erreur: ${error.message}`);
                    throw error;
                }
            };
        }

        // Si c'est le module principal, wrapper les exports
        const wrappedExports = {};
        Object.keys(result).forEach(key => {
            if (typeof result[key] === 'function') {
                wrappedExports[key] = function (...args) {
                    if (args[0] && typeof args[0] === 'string' && args[0].includes('/:')) {
                        console.log(`\n🔍 ${key}() appelé avec: "${args[0]}"`);
                    }

                    try {
                        return result[key].apply(this, args);
                    } catch (error) {
                        if (error.message.includes('Missing parameter name')) {
                            console.log(`\n🚨 ERREUR "Missing parameter name" dans ${key}()!`);
                            console.log(`   Arguments:`, args[0]);
                            console.log(`   Context précédent:`, errorContext);
                            console.log(`\n   Stack trace de l'appel:`);
                            console.trace();
                        }
                        throw error;
                    }
                };
            } else {
                wrappedExports[key] = result[key];
            }
        });

        return wrappedExports;
    }

    return result;
};

console.log('✅ Interception mise en place\n');

// Ajouter un handler d'erreur global
process.on('uncaughtException', (error) => {
    if (error.message.includes('Missing parameter name')) {
        console.log('\n🚨 Erreur non gérée capturée!');
        console.log('   Dernier contexte:', errorContext);
    }
});

try {
    console.log('🚀 Démarrage du serveur...\n');
    require('./server.js');
} catch (error) {
    console.log('\n❌ Erreur lors du démarrage:');
    console.log('   Message:', error.message);

    if (errorContext) {
        console.log('   Dernier path traité:', errorContext);
    }

    // Afficher plus de détails sur la stack
    const stack = error.stack.split('\n');
    console.log('\n📍 Analyse de la stack:');
    stack.forEach((line, index) => {
        if (line.includes('.js:') && !line.includes('node_modules') && !line.includes('internal')) {
            console.log(`   ${line.trim()}`);
        }
    });
}