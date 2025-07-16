const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers s'ils n'existent pas
const createUploadDirs = () => {
    const dirs = [
        'uploads/images/poi',
        'uploads/images/temp',
        'uploads/thumbnails/small',
        'uploads/thumbnails/medium',
        'uploads/thumbnails/large'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Dossier créé: ${dir}`);
        }
    });
};

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        createUploadDirs();
        cb(null, 'uploads/images/temp'); // Stockage temporaire
    },
    filename: (req, file, cb) => {
        // Générer un nom unique : timestamp-random-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// Filtres de fichiers
const fileFilter = (req, file, cb) => {
    // Types MIME autorisés
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Types autorisés: JPEG, PNG, WebP`), false);
    }
};

// Configuration multer
const uploadConfig = {
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB par défaut
        files: 5 // Maximum 5 fichiers par upload
    }
};

// Middleware multer
const upload = multer(uploadConfig);

// Configuration des tailles de thumbnails
const thumbnailSizes = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 800, height: 600 }
};

module.exports = {
    upload,
    thumbnailSizes,
    createUploadDirs,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
};