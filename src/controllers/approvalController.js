const ApprovalService = require('../services/approvalService');

class ApprovalController {

    // POST /api/poi/:id/approve - Approuver un POI
    static async approvePOI(req, res) {
        try {
            const { id } = req.params;
            const { comments } = req.body;
            const moderatorId = req.user.id;

            const result = await ApprovalService.approvePOI(
                parseInt(id),
                moderatorId,
                comments
            );

            // TODO: Émettre notification Socket.IO
            socketService.notifyPOIApproval(result);

            res.json({
                message: 'POI approuvé avec succès',
                data: {
                    poi_id: id,
                    status: 'approved',
                    approved_by: moderatorId,
                    comments
                }
            });

            try {
                await notificationService.notifyPOIApproval(result);
            } catch (notificationError) {
                console.error('Erreur notification approbation:', notificationError);
            }

        } catch (error) {
            console.error('Erreur approbation POI:', error);

            if (error.message.includes('non trouvé')) {
                return res.status(404).json({
                    type: 'https://httpstatuses.com/404',
                    title: 'POI non trouvé',
                    status: 404,
                    detail: error.message
                });
            }

            if (error.message.includes('déjà')) {
                return res.status(409).json({
                    type: 'https://httpstatuses.com/409',
                    title: 'Conflit de statut',
                    status: 409,
                    detail: error.message
                });
            }

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur d\'approbation',
                status: 500,
                detail: 'Une erreur est survenue lors de l\'approbation'
            });
        }
    }

    // POST /api/poi/:id/reject - Rejeter un POI
    static async rejectPOI(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const moderatorId = req.user.id;

            const result = await ApprovalService.rejectPOI(
                parseInt(id),
                moderatorId,
                reason
            );

            // TODO: Émettre notification Socket.IO
            socketService.notifyPOIRejection(result);

            res.json({
                message: 'POI rejeté avec succès',
                data: {
                    poi_id: id,
                    status: 'rejected',
                    approved_by: moderatorId,
                    reason
                }
            });
            try {
                await notificationService.notifyPOIRejection(result);
            } catch (notificationError) {
                console.error('Erreur notification rejet:', notificationError);
            }

        } catch (error) {
            console.error('Erreur rejet POI:', error);

            if (error.message.includes('non trouvé')) {
                return res.status(404).json({
                    type: 'https://httpstatuses.com/404',
                    title: 'POI non trouvé',
                    status: 404,
                    detail: error.message
                });
            }

            if (error.message.includes('raison')) {
                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Raison requise',
                    status: 400,
                    detail: error.message
                });
            }

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur de rejet',
                status: 500,
                detail: 'Une erreur est survenue lors du rejet'
            });
        }
    }

    // POST /api/poi/:id/reapprove - Réapprouver un POI rejeté
    static async reapprovePOI(req, res) {
        try {
            const { id } = req.params;
            const { comments } = req.body;
            const moderatorId = req.user.id;

            const result = await ApprovalService.reapprovePOI(
                parseInt(id),
                moderatorId,
                comments
            );

            res.json({
                message: 'POI réapprouvé avec succès',
                data: {
                    poi_id: id,
                    status: 'approved',
                    approved_by: moderatorId,
                    comments
                }
            });

        } catch (error) {
            console.error('Erreur réapprobation POI:', error);

            if (error.message.includes('non trouvé')) {
                return res.status(404).json({
                    type: 'https://httpstatuses.com/404',
                    title: 'POI non trouvé',
                    status: 404,
                    detail: error.message
                });
            }

            if (error.message.includes('rejetés')) {
                return res.status(400).json({
                    type: 'https://httpstatuses.com/400',
                    title: 'Statut invalide',
                    status: 400,
                    detail: error.message
                });
            }

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur de réapprobation',
                status: 500,
                detail: 'Une erreur est survenue lors de la réapprobation'
            });
        }
    }

    // GET /api/moderation/pending - Lister les POI en attente
    static async getPendingPOIs(req, res) {
        try {
            const filters = req.query;
            const result = await ApprovalService.getPendingPOIs(filters);

            res.json({
                message: 'POI en attente récupérés avec succès',
                data: result.data,
                pagination: result.pagination,
                filters
            });

        } catch (error) {
            console.error('Erreur récupération POI pending:', error);

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur de récupération',
                status: 500,
                detail: 'Une erreur est survenue lors de la récupération'
            });
        }
    }

    // GET /api/moderation/history/:id - Historique de modération d'un POI
    static async getModerationHistory(req, res) {
        try {
            const { id } = req.params;
            const history = await ApprovalService.getModerationHistory(parseInt(id));

            res.json({
                message: 'Historique de modération récupéré',
                data: {
                    poi_id: id,
                    history
                }
            });

        } catch (error) {
            console.error('Erreur historique modération:', error);

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur historique',
                status: 500,
                detail: 'Une erreur est survenue lors de la récupération de l\'historique'
            });
        }
    }

    // GET /api/moderation/stats - Statistiques de modération
    static async getModerationStats(req, res) {
        try {
            const { period = 'week', moderator_id } = req.query;

            // Si pas d'ID spécifié et pas admin, utiliser l'ID du modérateur connecté
            const targetModeratorId = moderator_id ||
                (req.user.role !== 'admin' && req.user.role !== 'superadmin' ? req.user.id : null);

            const stats = await ApprovalService.getModerationStats(
                targetModeratorId ? parseInt(targetModeratorId) : null,
                period
            );

            res.json({
                message: 'Statistiques de modération récupérées',
                data: stats
            });

        } catch (error) {
            console.error('Erreur stats modération:', error);

            res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Erreur statistiques',
                status: 500,
                detail: 'Une erreur est survenue lors du calcul des statistiques'
            });
        }
    }
}

module.exports = ApprovalController;