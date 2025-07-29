const CommentService = require('../services/commentService');

class CommentController {
  // POST /api/comments - Créer un commentaire
  static async createComment(req, res) {
    try {
      const userId = req.user.id;
      const commentData = req.body;

      const comment = await CommentService.createComment(commentData, userId);

      res.status(201).json({
        message: 'Commentaire créé avec succès',
        data: comment
      });
    } catch (error) {
      console.error('Erreur création commentaire:', error);

      if (error.message.includes('non trouvé') || error.message.includes('non approuvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'POI non trouvé',
          status: 404,
          detail: error.message
        });
      }

      if (error.message.includes('attendre') || error.message.includes('récemment')) {
        return res.status(429).json({
          type: 'https://httpstatuses.com/429',
          title: 'Trop de requêtes',
          status: 429,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de création',
        status: 500,
        detail: 'Une erreur est survenue lors de la création du commentaire'
      });
    }
  }

  // GET /api/comments/:id - Obtenir un commentaire
  static async getComment(req, res) {
    try {
      const { id } = req.params;
      const { include_replies = 'true' } = req.query;

      const comment = await CommentService.getCommentById(parseInt(id), include_replies === 'true');

      res.json({
        data: comment
      });
    } catch (error) {
      console.error('Erreur récupération commentaire:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Commentaire non trouvé',
          status: 404,
          detail: "Le commentaire demandé n'existe pas"
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de récupération',
        status: 500,
        detail: 'Une erreur est survenue lors de la récupération'
      });
    }
  }

  // GET /api/poi/:poiId/comments - Lister les commentaires d'un POI
  static async getCommentsByPOI(req, res) {
    try {
      const { poiId } = req.params;
      const options = req.query;

      const result = await CommentService.getCommentsByPOI(parseInt(poiId), options);

      res.json({
        message: 'Commentaires récupérés avec succès',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Erreur récupération commentaires POI:', error);

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de récupération',
        status: 500,
        detail: 'Une erreur est survenue lors de la récupération des commentaires'
      });
    }
  }

  // PUT /api/comments/:id - Mettre à jour un commentaire
  static async updateComment(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const updatedComment = await CommentService.updateComment(
        parseInt(id),
        content,
        userId,
        userRole
      );

      res.json({
        message: 'Commentaire mis à jour avec succès',
        data: updatedComment
      });
    } catch (error) {
      console.error('Erreur mise à jour commentaire:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Commentaire non trouvé',
          status: 404,
          detail: error.message
        });
      }

      if (error.message.includes('permission') || error.message.includes('délai')) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Accès refusé',
          status: 403,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de mise à jour',
        status: 500,
        detail: 'Une erreur est survenue lors de la mise à jour'
      });
    }
  }

  // DELETE /api/comments/:id - Supprimer un commentaire
  static async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const result = await CommentService.deleteComment(parseInt(id), userId, userRole);

      res.json(result);
    } catch (error) {
      console.error('Erreur suppression commentaire:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Commentaire non trouvé',
          status: 404,
          detail: error.message
        });
      }

      if (error.message.includes('permission')) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Accès refusé',
          status: 403,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de suppression',
        status: 500,
        detail: 'Une erreur est survenue lors de la suppression'
      });
    }
  }

  // POST /api/comments/:id/like - Liker/unliker un commentaire
  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await CommentService.toggleCommentLike(parseInt(id), userId);

      res.json({
        message: `Commentaire ${result.action}`,
        data: result
      });
    } catch (error) {
      console.error('Erreur toggle like:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Commentaire non trouvé',
          status: 404,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur like',
        status: 500,
        detail: 'Une erreur est survenue lors du like'
      });
    }
  }

  // POST /api/comments/:id/report - Signaler un commentaire
  static async reportComment(req, res) {
    try {
      const { id } = req.params;
      const { reason, description } = req.body;
      const userId = req.user.id;

      const result = await CommentService.reportComment(parseInt(id), userId, reason, description);

      res.json(result);
    } catch (error) {
      console.error('Erreur signalement commentaire:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Commentaire non trouvé',
          status: 404,
          detail: error.message
        });
      }

      if (error.message.includes('déjà signalé')) {
        return res.status(409).json({
          type: 'https://httpstatuses.com/409',
          title: 'Déjà signalé',
          status: 409,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur signalement',
        status: 500,
        detail: 'Une erreur est survenue lors du signalement'
      });
    }
  }

  // GET /api/poi/:poiId/comments/stats - Statistiques commentaires d'un POI
  static async getCommentStats(req, res) {
    try {
      const { poiId } = req.params;
      const stats = await CommentService.getCommentStats(parseInt(poiId));

      res.json({
        data: stats
      });
    } catch (error) {
      console.error('Erreur stats commentaires:', error);

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur statistiques',
        status: 500,
        detail: 'Une erreur est survenue lors du calcul des statistiques'
      });
    }
  }
}

module.exports = CommentController;
