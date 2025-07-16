const validationMiddleware = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            let dataToValidate;

            // Déterminer la source des données à valider
            switch (source) {
                case 'body':
                    dataToValidate = req.body;
                    break;
                case 'query':
                    dataToValidate = req.query;
                    break;
                case 'params':
                    dataToValidate = req.params;
                    break;
                default:
                    dataToValidate = req.body;
            }

            // Valider les données
            const { error, value } = schema.validate(dataToValidate, {
                abortEarly: false, // Récupérer toutes les erreurs
                stripUnknown: true // Supprimer les champs non définis dans le schéma
            });

            if (error) {
                const errors = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value
                }));

                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Données invalides',
                    status: 400,
                    detail: 'Les données fournies ne respectent pas le format attendu',
                    errors
                });
            }

            // Remplacer les données originales par les données validées et nettoyées
            if (source === 'body') {
                req.body = value;
            } else if (source === 'query') {
                req.query = value;
            } else if (source === 'params') {
                req.params = value;
            }

            next();

        } catch (err) {
            console.error('Erreur middleware validation:', err);
            return res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur de validation',
                status: 500,
                detail: 'Erreur lors de la validation des données'
            });
        }
    };
};

module.exports = validationMiddleware;