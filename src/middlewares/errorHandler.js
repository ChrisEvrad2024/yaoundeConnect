const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Erreur de validation Sequelize
    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(error => ({
            field: error.path,
            message: error.message
        }));

        return res.status(400).json({
            type: 'https://httpstatuses.com/400',
            title: 'Erreur de validation',
            status: 400,
            detail: 'Les données fournies ne sont pas valides',
            errors
        });
    }

    // Erreur de contrainte unique
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            type: 'https://httpstatuses.com/409',
            title: 'Conflit de données',
            status: 409,
            detail: 'Cette ressource existe déjà'
        });
    }

    // Erreur JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            type: 'https://httpstatuses.com/401',
            title: 'Token invalide',
            status: 401,
            detail: 'Le token d\'authentification est invalide'
        });
    }

    // Erreur générique
    return res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur interne du serveur',
        status: 500,
        detail: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
    });
};

module.exports = errorHandler;