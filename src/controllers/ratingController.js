const RatingService = require('../services/ratingService');

class RatingController {

    // POST /api/poi/:poiId/rate - Noter un POI
    static async ratePOI(req, res) {
        try {
            const { poiId } = req.params;
            const { rating } = req.body;
            const userId = req.user.id;

            const result = await RatingService.ratePointInterest(
                parseInt(poiId),
                userId,
                parseInt(rating)
            );

            const message = result.action === 'created'
                ? 'Note ajoutée avec succès'
                : 'Note mise à jour avec succès';

            res.json({
                message,
                data: result
            });

        } catch (error) {
            console.error('Erreur notation POI:', error);

            if (error.message.includes('non trouvé') || error.message.includes('non approuvé')) {
                return res.status(404).json({
                    type: 'https://httpstatuses.com/404',
                    title: 'POI non trouvé',
                    status: 404,
                    detail: error.message
                });
            }

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur de notation',
                status: 500,
                detail: 'Une erreur est survenue lors de la notation'
            });
        }
    }

    // DELETE /api/poi/:poiId/rate - Supprimer sa note
    static async removeRating(req, res) {
        try {
            const { poiId } = req.params;
            const userId = req.user.id;

            const result = await RatingService.removeRating(parseInt(poiId), userId);

            res.json({
                message: 'Note supprimée avec succès',
                data: result
            });

        } catch (error) {
            console.error('Erreur suppression note:', error);

            if (error.message.includes('Aucune note trouvée')) {
                return res.status(404).json({
                    type: 'https://httpstatuses.com/404',
                    title: 'Note non trouvée',
                    status: 404,
                    detail: error.message
                });
            }

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur suppression',
                status: 500,
                detail: 'Une erreur est survenue lors de la suppression'
            });
        }
    }

    // GET /api/poi/:poiId/rate/me - Obtenir sa note pour un POI
    static async getUserRating(req, res) {
        try {
            const { poiId } = req.params;
            const userId = req.user.id;

            const rating = await RatingService.getUserRating(parseInt(poiId), userId);

            res.json({
                data: {
                    poi_id: parseInt(poiId),
                    user_id: userId,
                    rating: rating,
                    has_rated: rating !== null
                }
            });

        } catch (error) {
            console.error('Erreur récupération note utilisateur:', error);

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur récupération',
                status: 500,
                detail: 'Une erreur est survenue lors de la récupération'
            });
        }
    }

    // GET /api/poi/:poiId/ratings - Détails des notes d'un POI
    static async getPOIRatings(req, res) {
        try {
            const { poiId } = req.params;
            const details = await RatingService.getPOIRatingDetails(parseInt(poiId));

            res.json({
                data: details
            });

        } catch (error) {
            console.error('Erreur détails notes POI:', error);

            if (error.message.includes('non trouvé')) {
                return res.status(404).json({
                    type: 'https://httpstatuses.com/404',
                    title: 'POI non trouvé',
                    status: 404,
                    detail: error.message
                });
            }

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur récupération',
                status: 500,
                detail: 'Une erreur est survenue lors de la récupération'
            });
        }
    }

    // GET /api/ratings/top - Top POI les mieux notés
    static async getTopRatedPOIs(req, res) {
        try {
            const options = req.query;
            const topPOIs = await RatingService.getTopRatedPOIs(options);

            res.json({
                message: 'Top POI récupérés avec succès',
                data: topPOIs,
                filters: options
            });

        } catch (error) {
            console.error('Erreur top POI:', error);

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur récupération',
                status: 500,
                detail: 'Une erreur est survenue lors de la récupération'
            });
        }
    }
}

module.exports = RatingController;
