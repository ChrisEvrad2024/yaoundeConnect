const OSMService = require('../services/osmService');

class OSMController {

    // GET /api/osm/geocode - Géocoder une adresse
    static async geocodeAddress(req, res) {
        try {
            const { address, city = 'Yaoundé', country = 'Cameroun' } = req.query;

            if (!address) {
                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Adresse requise',
                    status: 400,
                    detail: 'Le paramètre address est obligatoire'
                });
            }

            const result = await OSMService.geocodeAddress(address, city, country);

            res.json({
                message: 'Géocodage effectué',
                data: result
            });

        } catch (error) {
            console.error('❌ Erreur géocodage controller:', error);

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur de géocodage',
                status: 500,
                detail: 'Une erreur est survenue lors du géocodage'
            });
        }
    }

    // GET /api/osm/reverse - Géocodage inverse
    static async reverseGeocode(req, res) {
        try {
            const { latitude, longitude } = req.query;

            if (!latitude || !longitude) {
                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Coordonnées requises',
                    status: 400,
                    detail: 'Les paramètres latitude et longitude sont obligatoires'
                });
            }

            const result = await OSMService.reverseGeocode(
                parseFloat(latitude),
                parseFloat(longitude)
            );

            res.json({
                message: 'Géocodage inverse effectué',
                data: result
            });

        } catch (error) {
            console.error('❌ Erreur géocodage inverse controller:', error);

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur de géocodage inverse',
                status: 500,
                detail: 'Une erreur est survenue lors du géocodage inverse'
            });
        }
    }

    // POST /api/osm/validate - Valider une adresse
    static async validateAddress(req, res) {
        try {
            const { address, latitude, longitude } = req.body;

            if (!address || !latitude || !longitude) {
                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Données incomplètes',
                    status: 400,
                    detail: 'Adresse, latitude et longitude sont obligatoires'
                });
            }

            const result = await OSMService.validateAddress(
                address,
                parseFloat(latitude),
                parseFloat(longitude)
            );

            res.json({
                message: 'Validation d\'adresse effectuée',
                data: result
            });

        } catch (error) {
            console.error('❌ Erreur validation adresse controller:', error);

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur de validation',
                status: 500,
                detail: 'Une erreur est survenue lors de la validation'
            });
        }
    }

    // GET /api/osm/nearby - POI OSM à proximité
    static async findNearbyOSMPOIs(req, res) {
        try {
            const { latitude, longitude, radius = 1, category } = req.query;

            if (!latitude || !longitude) {
                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Coordonnées requises',
                    status: 400,
                    detail: 'Les paramètres latitude et longitude sont obligatoires'
                });
            }

            const result = await OSMService.findNearbyOSMPOIs(
                parseFloat(latitude),
                parseFloat(longitude),
                parseFloat(radius),
                category
            );

            res.json({
                message: 'Recherche POI OSM effectuée',
                data: result
            });

        } catch (error) {
            console.error(' Erreur recherche POI OSM controller:', error);

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur de recherche',
                status: 500,
                detail: 'Une erreur est survenue lors de la recherche'
            });
        }
    }
}

module.exports = OSMController;