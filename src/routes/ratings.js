const express = require('express');
const RatingController = require('../controllers/ratingController');
const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');
const ratingValidator = require('../validators/ratingValidator');

const router = express.Router();

// Routes publiques
// GET /api/poi/:poiId/ratings - Détails des notes d'un POI
router.get('/poi/:poiId/ratings',
    validationMiddleware(ratingValidator.params, 'params'),
    RatingController.getPOIRatings
);

// GET /api/ratings/top - Top POI les mieux notés
router.get('/top',
    validationMiddleware(ratingValidator.topPOIs, 'query'),
    RatingController.getTopRatedPOIs
);

// Routes authentifiées
router.use(authMiddleware);

// POST /api/poi/:poiId/rate - Noter un POI
router.post('/poi/:poiId/rate',
    validationMiddleware(ratingValidator.params, 'params'),
    validationMiddleware(ratingValidator.rate),
    RatingController.ratePOI
);

// DELETE /api/poi/:poiId/rate - Supprimer sa note
router.delete('/poi/:poiId/rate',
    validationMiddleware(ratingValidator.params, 'params'),
    RatingController.removeRating
);

// GET /api/poi/:poiId/rate/me - Obtenir sa note pour un POI
router.get('/poi/:poiId/rate/me',
    validationMiddleware(ratingValidator.params, 'params'),
    RatingController.getUserRating
);

module.exports = router;