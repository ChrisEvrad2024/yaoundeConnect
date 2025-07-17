const express = require('express');
const POIController = require('../controllers/poiController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { uploadPOIImages } = require('../middlewares/uploadMiddleware');
const poiValidator = require('../validators/poiValidator');

const router = express.Router();

// Routes publiques (consultation)

// GET /api/poi - Rechercher et lister les POI
router.get('/',
    validationMiddleware(poiValidator.searchAdvanced, 'query'),
    POIController.searchPOIAdvanced
);

// GET /api/poi/nearby - POI à proximité
router.get('/nearby',
    validationMiddleware(poiValidator.nearby, 'query'),
    POIController.findNearbyPOI
);

// GET /api/poi/:id - Obtenir un POI par ID
router.get('/:id',
    validationMiddleware(poiValidator.params, 'params'),
    POIController.getPOI
);

// GET /api/poi/:id/stats - Statistiques d'un POI
router.get('/:id/stats',
    validationMiddleware(poiValidator.params, 'params'),
    POIController.getPoiStats
);

// Routes protégées (authentification requise)

// POST /api/poi - Créer un nouveau POI (collecteur+)
router.post('/',
    authMiddleware,
    roleMiddleware.collecteur,
    uploadPOIImages,
    validationMiddleware(poiValidator.create),
    POIController.createPOI
);

// PUT /api/poi/:id - Mettre à jour un POI (créateur ou modérateur+)
router.put('/:id',
    authMiddleware,
    validationMiddleware(poiValidator.params, 'params'),
    validationMiddleware(poiValidator.update),
    POIController.updatePOI
);

// DELETE /api/poi/:id - Supprimer un POI (créateur ou modérateur+)
router.delete('/:id',
    authMiddleware,
    validationMiddleware(poiValidator.params, 'params'),
    POIController.deletePOI
);

// POST /api/poi/:id/upload-images - Upload d'images supplémentaires
router.post('/:id/upload-images',
    authMiddleware,
    validationMiddleware(poiValidator.params, 'params'),
    uploadPOIImages,
    POIController.uploadImages
);

module.exports = router;