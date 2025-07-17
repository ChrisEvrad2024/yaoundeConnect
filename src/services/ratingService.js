const { Rating, PointInterest, User } = require('../models');
const { sequelize } = require('../config/database');

class RatingService {

    // Créer ou mettre à jour une note
    static async ratePointInterest(poiId, userId, rating) {
        const transaction = await sequelize.transaction();

        try {
            // Vérifier que le POI existe et est approuvé
            const poi = await PointInterest.findOne({
                where: { 
                    id: poiId, 
                    status: 'approved' 
                },
                transaction
            });

            if (!poi) {
                throw new Error('POI non trouvé ou non approuvé');
            }

            // Vérifier si l'utilisateur a déjà noté ce POI
            const existingRating = await Rating.findOne({
                where: { poi_id: poiId, user_id: userId },
                transaction
            });

            let action;
            let previousRating = null;

            if (existingRating) {
                // Mettre à jour la note existante
                previousRating = existingRating.rating;
                await existingRating.update({ rating }, { transaction });
                action = 'updated';
            } else {
                // Créer une nouvelle note
                await Rating.create({
                    poi_id: poiId,
                    user_id: userId,
                    rating
                }, { transaction });
                action = 'created';
            }

            // Recalculer les statistiques du POI
            const ratingStats = await this.calculatePOIRatingStats(poiId, transaction);
            
            await poi.update({
                rating: ratingStats.average,
                rating_count: ratingStats.count
            }, { transaction });

            await transaction.commit();

            return {
                action,
                previous_rating: previousRating,
                new_rating: rating,
                poi_stats: ratingStats
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Supprimer une note
    static async removeRating(poiId, userId) {
        const transaction = await sequelize.transaction();

        try {
            const rating = await Rating.findOne({
                where: { poi_id: poiId, user_id: userId },
                transaction
            });

            if (!rating) {
                throw new Error('Aucune note trouvée pour ce POI');
            }

            const removedRating = rating.rating;
            await rating.destroy({ transaction });

            // Recalculer les statistiques
            const ratingStats = await this.calculatePOIRatingStats(poiId, transaction);
            
            const poi = await PointInterest.findByPk(poiId, { transaction });
            await poi.update({
                rating: ratingStats.average,
                rating_count: ratingStats.count
            }, { transaction });

            await transaction.commit();

            return {
                action: 'removed',
                removed_rating: removedRating,
                poi_stats: ratingStats
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Obtenir la note d'un utilisateur pour un POI
    static async getUserRating(poiId, userId) {
        const rating = await Rating.findOne({
            where: { poi_id: poiId, user_id: userId }
        });

        return rating ? rating.rating : null;
    }

    // Calculer les statistiques de notation d'un POI
    static async calculatePOIRatingStats(poiId, transaction = null) {
        const stats = await Rating.findOne({
            where: { poi_id: poiId },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('rating')), 'count'],
                [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
                [sequelize.fn('MIN', sequelize.col('rating')), 'min'],
                [sequelize.fn('MAX', sequelize.col('rating')), 'max']
            ],
            transaction
        });

        // Calculer la distribution des notes
        const distribution = await Rating.findAll({
            where: { poi_id: poiId },
            attributes: [
                'rating',
                [sequelize.fn('COUNT', sequelize.col('rating')), 'count']
            ],
            group: ['rating'],
            order: [['rating', 'ASC']],
            transaction
        });

        const distributionMap = {};
        for (let i = 1; i <= 5; i++) {
            distributionMap[i] = 0;
        }
        
        distribution.forEach(item => {
            distributionMap[item.rating] = parseInt(item.dataValues.count);
        });

        return {
            count: parseInt(stats?.dataValues?.count || 0),
            average: parseFloat(stats?.dataValues?.average || 0).toFixed(1),
            min: parseInt(stats?.dataValues?.min || 0),
            max: parseInt(stats?.dataValues?.max || 0),
            distribution: distributionMap
        };
    }

    // Obtenir les statistiques détaillées d'un POI
    static async getPOIRatingDetails(poiId) {
        const poi = await PointInterest.findByPk(poiId);
        if (!poi) {
            throw new Error('POI non trouvé');
        }

        const stats = await this.calculatePOIRatingStats(poiId);

        // Récentes évaluations avec utilisateurs
        const recentRatings = await Rating.findAll({
            where: { poi_id: poiId },
            include: [{
                model: User,
                attributes: ['id', 'name']
            }],
            order: [['created_at', 'DESC']],
            limit: 10
        });

        return {
            poi_id: poiId,
            poi_name: poi.name,
            overall_rating: parseFloat(poi.rating),
            total_ratings: poi.rating_count,
            statistics: stats,
            recent_ratings: recentRatings.map(r => ({
                rating: r.rating,
                user: r.User.name,
                created_at: r.created_at
            }))
        };
    }

    // Top POI par note
    static async getTopRatedPOIs(options = {}) {
        const {
            limit = 10,
            min_ratings = 5,
            category_id = null,
            quartier_id = null
        } = options;

        const whereConditions = {
            status: 'approved',
            rating_count: {
                [Op.gte]: min_ratings
            }
        };

        if (category_id) whereConditions.category_id = category_id;
        if (quartier_id) whereConditions.quartier_id = quartier_id;

        const topPOIs = await PointInterest.findAll({
            where: whereConditions,
            include: [
                {
                    model: require('../models').Category,
                    attributes: ['id', 'name', 'slug']
                },
                {
                    model: require('../models').Quartier,
                    attributes: ['id', 'name']
                }
            ],
            order: [
                ['rating', 'DESC'],
                ['rating_count', 'DESC']
            ],
            limit: parseInt(limit)
        });

        return topPOIs.map(poi => ({
            id: poi.id,
            name: poi.name,
            rating: parseFloat(poi.rating),
            rating_count: poi.rating_count,
            category: poi.Category.name,
            quartier: poi.Quartier.name
        }));
    }
}

module.exports = RatingService;