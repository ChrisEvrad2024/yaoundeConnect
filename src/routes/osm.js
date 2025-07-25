const express = require('express');
const OSMController = require('../controllers/osmController');
const validationMiddleware = require('../middlewares/validationMiddleware');
const osmValidator = require('../validators/osmValidator');

const router = express.Router();

// Routes publiques (pas d'authentification requise pour les services géographiques)

// GET /api/osm/geocode - Géocoder une adresse
router.get(
    '/geocode',
    validationMiddleware(osmValidator.geocode, 'query'),
    OSMController.geocodeAddress
);

// GET /api/osm/reverse - Géocodage inverse
router.get(
    '/reverse',
    validationMiddleware(osmValidator.reverse, 'query'),
    OSMController.reverseGeocode
);

// POST /api/osm/validate - Valider une adresse
router.post(
    '/validate',
    validationMiddleware(osmValidator.validate),
    OSMController.validateAddress
);

// GET /api/osm/nearby - POI OSM à proximité
router.get(
    '/nearby',
    validationMiddleware(osmValidator.nearby, 'query'),
    OSMController.findNearbyOSMPOIs
);

module.exports = router;
