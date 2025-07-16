const { upload } = require('../config/upload');

// Middleware pour upload d'images POI
const uploadPOIImages = (req, res, next) => {
    const uploadMultiple = upload.array('images', 5); // Maximum 5 images

    uploadMultiple(req, res, (err) => {
        if (err) {
            console.error('Erreur upload:', err);

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Fichier trop volumineux',
                    status: 400,
                    detail: `La taille du fichier ne doit pas dépasser ${process.env.MAX_FILE_SIZE || '10MB'}`
                });
            }

            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Trop de fichiers',
                    status: 400,
                    detail: 'Vous ne pouvez uploader que 5 images maximum'
                });
            }

            if (err.message.includes('Type de fichier non autorisé')) {
                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Type de fichier invalide',
                    status: 400,
                    detail: err.message
                });
            }

            return res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur upload',
                status: 500,
                detail: 'Une erreur est survenue lors de l\'upload'
            });
        }

        next();
    });
};

// Middleware pour upload d'une seule image
const uploadSingleImage = (req, res, next) => {
    const uploadSingle = upload.single('image');

    uploadSingle(req, res, (err) => {
        if (err) {
            console.error('Erreur upload single:', err);

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Fichier trop volumineux',
                    status: 400,
                    detail: `La taille du fichier ne doit pas dépasser ${process.env.MAX_FILE_SIZE || '10MB'}`
                });
            }

            if (err.message.includes('Type de fichier non autorisé')) {
                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Type de fichier invalide',
                    status: 400,
                    detail: err.message
                });
            }

            return res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur upload',
                status: 500,
                detail: 'Une erreur est survenue lors de l\'upload'
            });
        }

        next();
    });
};

module.exports = {
    uploadPOIImages,
    uploadSingleImage
};