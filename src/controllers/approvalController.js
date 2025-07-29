const ApprovalService = require('../services/approvalService');
const POIService = require('../services/poiService');
const notificationService = require('../services/notificationService');
const socketService = require('../services/socketService');

class ApprovalController {
  static async createPOI(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const imageFiles = req.files || [];

      console.log(`🔧 Création POI par utilisateur ${userId} (${userRole})`);

      // Créer le POI
      const poi = await POIService.createPOI(req.body, userId, imageFiles);

      // ✅ Message adapté selon le statut
      let message;
      let statusCode = 201;

      if (poi.status === 'approved') {
        message = "Point d'intérêt créé et approuvé automatiquement";
      } else {
        message =
          "Point d'intérêt créé avec succès. Il sera visible après approbation par un modérateur.";
        statusCode = 202; // Accepted (en attente de traitement)
      }

      res.status(statusCode).json({
        message,
        poi,
        status_info: {
          current_status: poi.status,
          requires_approval: poi.status === 'pending',
          auto_approved:
            poi.status === 'approved' && ['moderateur', 'admin', 'superadmin'].includes(userRole)
        }
      });
    } catch (error) {
      console.error('❌ Erreur création POI:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Ressource non trouvée',
          status: 404,
          detail: error.message
        });
      }

      if (error.message.includes('Coordonnées')) {
        return res.status(400).json({
          type: 'https://httpstatuses.com/400',
          title: 'Coordonnées invalides',
          status: 400,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de création',
        status: 500,
        detail: 'Une erreur est survenue lors de la création du POI'
      });
    }
  }
  // POST /api/poi/:id/approve - Approuver un POI
  static async approvePOI(req, res) {
    const startTime = Date.now();
    console.log(`🔧 [${new Date().toISOString()}] Début approbation POI ${req.params.id}`);

    try {
      const { id } = req.params;
      const { comments } = req.body;
      const moderatorId = req.user.id;

      console.log(`📋 Paramètres d'approbation:`);
      console.log(`   POI ID: ${id}`);
      console.log(`   Modérateur ID: ${moderatorId}`);
      console.log(`   Commentaires: ${comments || 'Aucun'}`);

      // ✅ ÉTAPE 1: Approbation via le service
      console.log(`🔄 Étape 1: Appel du service d'approbation...`);
      const approvalResult = await ApprovalService.approvePOI(id, moderatorId, comments);
      console.log(`✅ Étape 1: Approbation en BD réussie`);
      console.log(`   Status POI: ${approvalResult.poi.status}`);

      // ✅ ÉTAPE 2: Notification (source probable d'erreur)
      console.log(`🔄 Étape 2: Envoi des notifications...`);
      try {
        await notificationService.notifyPOIApproval(approvalResult);
        console.log(`✅ Étape 2: Notifications envoyées avec succès`);
      } catch (notificationError) {
        // ⚠️ ERREUR PROBABLE ICI - mais on continue
        console.error(
          `❌ Étape 2: Erreur notification (non-bloquante):`,
          notificationError.message
        );
        console.error(`Stack:`, notificationError.stack);
        // NE PAS FAIRE ÉCHOUER LA REQUÊTE pour une erreur de notification
      }

      // ✅ ÉTAPE 3: Réponse de succès
      console.log(`🔄 Étape 3: Préparation de la réponse...`);
      const duration = Date.now() - startTime;

      const response = {
        message: 'POI approuvé avec succès',
        poi: {
          id: approvalResult.poi.id,
          name: approvalResult.poi.name,
          status: approvalResult.poi.status,
          approved_by: moderatorId
        },
        moderator: {
          id: moderatorId,
          name: req.user.name
        },
        comments: comments || null,
        timestamp: new Date().toISOString(),
        processing_time_ms: duration
      };

      console.log(`✅ Étape 3: Réponse préparée (${duration}ms)`);
      console.log(`🎉 Approbation POI ${id} terminée avec succès`);

      res.status(200).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ERREUR APPROBATION POI ${req.params.id} (${duration}ms):`);
      console.error(`Type: ${error.name}`);
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);

      // Identifier le type d'erreur pour une réponse appropriée
      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'POI non trouvé',
          status: 404,
          detail: error.message,
          debug_info: {
            poi_id: req.params.id,
            processing_time_ms: duration
          }
        });
      }

      if (error.message.includes('déjà approuvé')) {
        return res.status(409).json({
          type: 'https://httpstatuses.com/409',
          title: 'POI déjà approuvé',
          status: 409,
          detail: error.message,
          debug_info: {
            poi_id: req.params.id,
            processing_time_ms: duration
          }
        });
      }

      // Erreur générique 500
      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur interne',
        status: 500,
        detail:
          process.env.NODE_ENV === 'development'
            ? `Erreur lors de l'approbation: ${error.message}`
            : "Une erreur est survenue lors de l'approbation",
        debug_info:
          process.env.NODE_ENV === 'development'
            ? {
                error_type: error.name,
                error_message: error.message,
                poi_id: req.params.id,
                moderator_id: req.user?.id,
                processing_time_ms: duration
              }
            : undefined
      });
    }
  }

  // POST /api/poi/:id/reject - Rejeter un POI
  static async rejectPOI(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const moderatorId = req.user.id;

      const result = await ApprovalService.rejectPOI(parseInt(id), moderatorId, reason);

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

      const result = await ApprovalService.reapprovePOI(parseInt(id), moderatorId, comments);

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
        detail: "Une erreur est survenue lors de la récupération de l'historique"
      });
    }
  }

  // GET /api/moderation/stats - Statistiques de modération
  static async getModerationStats(req, res) {
    try {
      const { period = 'week', moderator_id } = req.query;

      // Si pas d'ID spécifié et pas admin, utiliser l'ID du modérateur connecté
      const targetModeratorId =
        moderator_id ||
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
