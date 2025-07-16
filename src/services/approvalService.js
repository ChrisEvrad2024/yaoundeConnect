const { PointInterest, User, AuditLog } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class ApprovalService {

    // Approuver un POI
    static async approvePOI(poiId, moderatorId, comments = null) {
        const transaction = await sequelize.transaction();

        try {
            // Vérifier que le POI existe et est en attente
            const poi = await PointInterest.findByPk(poiId, {
                include: [
                    { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
                ],
                transaction
            });

            if (!poi) {
                throw new Error('POI non trouvé');
            }

            if (poi.status === 'approved') {
                throw new Error('Ce POI est déjà approuvé');
            }

            if (poi.status === 'rejected') {
                throw new Error('Ce POI a été rejeté. Utilisez la réapprobation si nécessaire');
            }

            // Sauvegarder l'ancien statut pour l'audit
            const oldValues = {
                status: poi.status,
                approved_by: poi.approved_by
            };

            // Mettre à jour le POI
            await poi.update({
                status: 'approved',
                approved_by: moderatorId,
                is_verify: 1 // Marquer comme vérifié
            }, { transaction });

            // Créer l'entrée d'audit
            await AuditLog.create({
                table_name: 'point_interests',
                record_id: poiId,
                action: 'UPDATE',
                old_values: oldValues,
                new_values: {
                    status: 'approved',
                    approved_by: moderatorId,
                    is_verify: 1,
                    moderation_comments: comments
                },
                user_id: moderatorId
            }, { transaction });

            await transaction.commit();

            // Retourner les données pour notification
            return {
                poi: poi.toJSON(),
                moderator_id: moderatorId,
                action: 'approved',
                comments
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Rejeter un POI
    static async rejectPOI(poiId, moderatorId, reason) {
        const transaction = await sequelize.transaction();

        try {
            const poi = await PointInterest.findByPk(poiId, {
                include: [
                    { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
                ],
                transaction
            });

            if (!poi) {
                throw new Error('POI non trouvé');
            }

            if (poi.status === 'rejected') {
                throw new Error('Ce POI est déjà rejeté');
            }

            if (!reason || reason.trim().length < 10) {
                throw new Error('Une raison de rejet d\'au moins 10 caractères est requise');
            }

            // Sauvegarder l'ancien statut
            const oldValues = {
                status: poi.status,
                approved_by: poi.approved_by
            };

            // Mettre à jour le POI
            await poi.update({
                status: 'rejected',
                approved_by: moderatorId,
                is_verify: 0
            }, { transaction });

            // Créer l'entrée d'audit avec la raison
            await AuditLog.create({
                table_name: 'point_interests',
                record_id: poiId,
                action: 'UPDATE',
                old_values: oldValues,
                new_values: {
                    status: 'rejected',
                    approved_by: moderatorId,
                    rejection_reason: reason
                },
                user_id: moderatorId
            }, { transaction });

            await transaction.commit();

            return {
                poi: poi.toJSON(),
                moderator_id: moderatorId,
                action: 'rejected',
                reason
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Réapprouver un POI rejeté
    static async reapprovePOI(poiId, moderatorId, comments = null) {
        const transaction = await sequelize.transaction();

        try {
            const poi = await PointInterest.findByPk(poiId, { transaction });

            if (!poi) {
                throw new Error('POI non trouvé');
            }

            if (poi.status !== 'rejected') {
                throw new Error('Seuls les POI rejetés peuvent être réapprouvés');
            }

            const oldValues = {
                status: poi.status,
                approved_by: poi.approved_by
            };

            await poi.update({
                status: 'approved',
                approved_by: moderatorId,
                is_verify: 1
            }, { transaction });

            await AuditLog.create({
                table_name: 'point_interests',
                record_id: poiId,
                action: 'UPDATE',
                old_values: oldValues,
                new_values: {
                    status: 'approved',
                    approved_by: moderatorId,
                    reapproval_comments: comments
                },
                user_id: moderatorId
            }, { transaction });

            await transaction.commit();

            return {
                poi: poi.toJSON(),
                moderator_id: moderatorId,
                action: 'reapproved',
                comments
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Lister les POI en attente de modération
    static async getPendingPOIs(filters = {}) {
        const {
            page = 1,
            limit = 20,
            sort_by = 'created_at',
            sort_order = 'asc',
            quartier_id,
            category_id,
            created_by
        } = filters;

        const whereConditions = {
            status: 'pending'
        };

        // Filtres additionnels
        if (quartier_id) whereConditions.quartier_id = quartier_id;
        if (category_id) whereConditions.category_id = category_id;
        if (created_by) whereConditions.created_by = created_by;

        const offset = (page - 1) * limit;

        const { count, rows } = await PointInterest.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email', 'role']
                },
                {
                    model: require('../models').Category,
                    attributes: ['id', 'name', 'slug']
                },
                {
                    model: require('../models').Quartier,
                    attributes: ['id', 'name']
                }
            ],
            order: [[sort_by, sort_order.toUpperCase()]],
            limit: parseInt(limit),
            offset: offset,
            distinct: true
        });

        return {
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
                hasNext: page < Math.ceil(count / limit),
                hasPrev: page > 1
            }
        };
    }

    // Obtenir l'historique de modération d'un POI
    static async getModerationHistory(poiId) {
        const history = await AuditLog.findAll({
            where: {
                table_name: 'point_interests',
                record_id: poiId
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'role']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return history.map(entry => ({
            id: entry.id,
            action: entry.action,
            moderator: entry.User ? {
                id: entry.User.id,
                name: entry.User.name,
                role: entry.User.role
            } : null,
            old_values: entry.old_values,
            new_values: entry.new_values,
            created_at: entry.created_at
        }));
    }

    // Statistiques de modération
    static async getModerationStats(moderatorId = null, period = 'week') {
        const periodConditions = this.getPeriodCondition(period);
        
        const baseWhere = {
            table_name: 'point_interests',
            action: 'UPDATE',
            created_at: periodConditions
        };

        if (moderatorId) {
            baseWhere.user_id = moderatorId;
        }

        const [approvals, rejections, total] = await Promise.all([
            AuditLog.count({
                where: {
                    ...baseWhere,
                    new_values: {
                        [Op.like]: '%"status":"approved"%'
                    }
                }
            }),
            AuditLog.count({
                where: {
                    ...baseWhere,
                    new_values: {
                        [Op.like]: '%"status":"rejected"%'
                    }
                }
            }),
            AuditLog.count({ where: baseWhere })
        ]);

        return {
            period,
            moderator_id: moderatorId,
            approvals,
            rejections,
            total,
            approval_rate: total > 0 ? ((approvals / total) * 100).toFixed(1) : 0
        };
    }

    // Helper pour les conditions de période
    static getPeriodCondition(period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        return {
            [Op.gte]: startDate
        };
    }
}

module.exports = ApprovalService;