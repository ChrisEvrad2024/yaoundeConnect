// debug_express_routes.js - Intercepter et tracer les routes Express
const Module = require('module');
const originalRequire = Module.prototype.require;

console.log('🔍 Debug Express Routes - Interception des chargements de modules\n');

// Intercepter les requires pour tracer les routes
Module.prototype.require = function(id) {
    const result = originalRequire.apply(this, arguments);
    
    // Intercepter Express Router
    if (id === 'express') {
        const express = result;
        const originalRouter = express.Router;
        
        express.Router = function() {
            const router = originalRouter.apply(this, arguments);
            
            // Intercepter toutes les méthodes de routing
            ['get', 'post', 'put', 'delete', 'patch', 'all', 'use'].forEach(method => {
                const original = router[method];
                router[method] = function(path, ...args) {
                    if (typeof path === 'string') {
                        // Vérifier si la route a un problème
                        if (path.includes('/:') && !path.match(/\/:[a-zA-Z0-9_]+/)) {
                            console.log(`\n🚨 ROUTE PROBLÉMATIQUE DÉTECTÉE!`);
                            console.log(`   Méthode: router.${method}`);
                            console.log(`   Path: "${path}"`);
                            console.log(`   Stack trace:`);
                            console.trace();
                        }
                    }
                    return original.apply(this, [path, ...args]);
                };
            });
            
            return router;
        };
        
        // Intercepter aussi les méthodes sur l'app Express
        const originalExpress = express;
        const wrappedExpress = function() {
            const app = originalExpress.apply(this, arguments);
            
            ['get', 'post', 'put', 'delete', 'patch', 'all', 'use'].forEach(method => {
                const original = app[method];
                app[method] = function(path, ...args) {
                    if (typeof path === 'string') {
                        if (path.includes('/:') && !path.match(/\/:[a-zA-Z0-9_]+/)) {
                            console.log(`\n🚨 ROUTE PROBLÉMATIQUE DÉTECTÉE!`);
                            console.log(`   Méthode: app.${method}`);
                            console.log(`   Path: "${path}"`);
                            console.log(`   Stack trace:`);
                            console.trace();
                        }
                    }
                    return original.apply(this, [path, ...args]);
                };
            });
            
            return app;
        };
        
        // Copier les propriétés statiques
        Object.setPrototypeOf(wrappedExpress, originalExpress);
        Object.keys(originalExpress).forEach(key => {
            wrappedExpress[key] = originalExpress[key];
        });
        
        return wrappedExpress;
    }
    
    return result;
};

console.log('✅ Interception mise en place\n');
console.log('🚀 Démarrage du serveur avec traçage...\n');

try {
    // Charger l'application
    require('./server.js');
} catch (error) {
    console.log('\n❌ Erreur capturée:');
    console.log('   Message:', error.message);
    
    if (error.message.includes('Missing parameter name')) {
        console.log('\n💡 L\'erreur provient de path-to-regexp');
        console.log('   Vérifiez la stack trace ci-dessus pour identifier la route problématique');
    }
}