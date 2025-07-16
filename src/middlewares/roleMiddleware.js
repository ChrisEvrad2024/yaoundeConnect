const roleMiddleware = (requiredRoles) => {
    // Normaliser en tableau si c'est une chaîne
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    return (req, res, next) => {
        try {
            // Vérifier que l'utilisateur est authentifié
            if (!req.user) {
                return res.status(401).json({
                    type: 'https://httpstatuses.com/401',
                    title: 'Authentification requise',
                    status: 401,
                    detail: 'Vous devez être connecté pour accéder à cette ressource'
                });
            }

            // Vérifier le rôle de l'utilisateur
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    type: 'https://httpstatuses.com/403',
                    title: 'Accès refusé',
                    status: 403,
                    detail: `Rôle requis: ${roles.join(' ou ')}. Votre rôle: ${req.user.role}`
                });
            }

            next();
        } catch (error) {
            console.error('Erreur middleware role:', error);
            return res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur interne',
                status: 500,
                detail: 'Erreur lors de la vérification des permissions'
            });
        }
    };
};

// Middlewares de rôles prédéfinis
const roleMiddlewares = {
    // Collecteur ou plus
    collecteur: roleMiddleware(['collecteur', 'moderateur', 'admin', 'superadmin']),

    // Modérateur ou plus
    moderateur: roleMiddleware(['moderateur', 'admin', 'superadmin']),

    // Admin ou plus
    admin: roleMiddleware(['admin', 'superadmin']),

    // Superadmin uniquement
    superadmin: roleMiddleware(['superadmin']),

    // Fonction pour créer un middleware personnalisé
    custom: roleMiddleware
};

module.exports = roleMiddlewares;