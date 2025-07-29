const { Comment, CommentLike, CommentReport, User, PointInterest } = require('../models');
const { Op, sequelize } = require('sequelize');
const notificationService = require('./notificationService');
const PaginationService = require('./paginationService');

class CommentService {
  // Créer un commentaire
  static async createComment(data, userId) {
    const transaction = await sequelize.transaction();

    try {
      const { content, poi_id, parent_id = null } = data;

      // Vérifier que le POI existe et est approuvé
      const poi = await PointInterest.findOne({
        where: {
          id: poi_id,
          status: 'approved'
        },
        transaction
      });

      if (!poi) {
        throw new Error('POI non trouvé ou non approuvé');
      }

      // Si c'est une réponse, vérifier que le commentaire parent existe
      if (parent_id) {
        const parentComment = await Comment.findOne({
          where: {
            id: parent_id,
            poi_id,
            status: 'approved'
          },
          transaction
        });

        if (!parentComment) {
          throw new Error('Commentaire parent non trouvé');
        }
      }

      // Vérifier si l'utilisateur n'a pas déjà commenté récemment (anti-spam)
      const recentComment = await Comment.findOne({
        where: {
          user_id: userId,
          poi_id,
          created_at: {
            [Op.gte]: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes
          }
        },
        transaction
      });

      if (recentComment) {
        throw new Error('Veuillez attendre avant de poster un autre commentaire');
      }

      // Créer le commentaire
      const comment = await Comment.create(
        {
          content,
          poi_id,
          parent_id,
          user_id: userId,
          status: 'approved' // Auto-approuvé, modération a posteriori
        },
        { transaction }
      );

      await transaction.commit();

      // Récupérer le commentaire complet avec relations
      const fullComment = await this.getCommentById(comment.id, true);

      // Notification asynchrone
      this.notifyNewComment(fullComment, poi).catch((err) => {
        console.error('Erreur notification commentaire:', err);
      });

      return fullComment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Obtenir un commentaire par ID
  static async getCommentById(id, includeReplies = false) {
    const includeOptions = [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'role']
      }
    ];

    if (includeReplies) {
      includeOptions.push({
        model: Comment,
        as: 'replies',
        where: { status: 'approved' },
        required: false,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'role']
          }
        ],
        order: [['created_at', 'ASC']]
      });
    }

    const comment = await Comment.findByPk(id, {
      include: includeOptions
    });

    if (!comment) {
      throw new Error('Commentaire non trouvé');
    }

    return comment;
  }

  // Lister les commentaires d'un POI
  static async getCommentsByPOI(poiId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
      status = 'approved',
      include_replies = true
    } = options;

    const whereConditions = {
      poi_id: poiId,
      parent_id: null, // Seulement les commentaires racine
      status
    };

    const includeOptions = [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'role']
      }
    ];

    if (include_replies) {
      includeOptions.push({
        model: Comment,
        as: 'replies',
        where: { status: 'approved' },
        required: false,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'role']
          }
        ],
        order: [['created_at', 'ASC']],
        limit: 5 // Limiter les réponses par commentaire
      });
    }

    return await PaginationService.offsetPaginate(Comment, {
      page,
      limit,
      where: whereConditions,
      include: includeOptions,
      order: [[sort_by, sort_order.toUpperCase()]],
      distinct: true
    });
  }

  // Mettre à jour un commentaire
  static async updateComment(id, content, userId, userRole) {
    const transaction = await sequelize.transaction();

    try {
      const comment = await Comment.findByPk(id, { transaction });

      if (!comment) {
        throw new Error('Commentaire non trouvé');
      }

      // Vérifier les permissions
      const canEdit =
        comment.user_id === userId || ['admin', 'superadmin', 'moderateur'].includes(userRole);

      if (!canEdit) {
        throw new Error("Vous n'avez pas la permission de modifier ce commentaire");
      }

      // Vérifier le délai de modification (24h pour l'auteur)
      if (comment.user_id === userId && !['admin', 'superadmin'].includes(userRole)) {
        const hoursSinceCreation = (Date.now() - comment.created_at.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreation > 24) {
          throw new Error('Vous ne pouvez plus modifier ce commentaire (délai de 24h dépassé)');
        }
      }

      // Mettre à jour
      await comment.update(
        {
          content,
          is_edited: true,
          edited_at: new Date()
        },
        { transaction }
      );

      await transaction.commit();

      return await this.getCommentById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Supprimer un commentaire
  static async deleteComment(id, userId, userRole) {
    const transaction = await sequelize.transaction();

    try {
      const comment = await Comment.findByPk(id, { transaction });

      if (!comment) {
        throw new Error('Commentaire non trouvé');
      }

      // Vérifier les permissions
      const canDelete =
        comment.user_id === userId || ['admin', 'superadmin', 'moderateur'].includes(userRole);

      if (!canDelete) {
        throw new Error("Vous n'avez pas la permission de supprimer ce commentaire");
      }

      // Supprimer les réponses en cascade
      await Comment.destroy({
        where: { parent_id: id },
        transaction
      });

      // Supprimer le commentaire
      await comment.destroy({ transaction });

      await transaction.commit();

      return { success: true, message: 'Commentaire supprimé avec succès' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Liker/Unliker un commentaire
  static async toggleCommentLike(commentId, userId) {
    const transaction = await sequelize.transaction();

    try {
      const comment = await Comment.findByPk(commentId, { transaction });
      if (!comment) {
        throw new Error('Commentaire non trouvé');
      }

      // Vérifier si l'utilisateur a déjà liké
      const existingLike = await CommentLike.findOne({
        where: { comment_id: commentId, user_id: userId },
        transaction
      });

      let action;
      if (existingLike) {
        // Supprimer le like
        await existingLike.destroy({ transaction });
        await comment.decrement('likes_count', { transaction });
        action = 'unliked';
      } else {
        // Ajouter le like
        await CommentLike.create(
          {
            comment_id: commentId,
            user_id: userId
          },
          { transaction }
        );
        await comment.increment('likes_count', { transaction });
        action = 'liked';
      }

      await transaction.commit();

      // Récupérer le commentaire mis à jour
      const updatedComment = await Comment.findByPk(commentId);

      return {
        action,
        likes_count: updatedComment.likes_count,
        user_liked: action === 'liked'
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Signaler un commentaire
  static async reportComment(commentId, userId, reason, description = null) {
    const transaction = await sequelize.transaction();

    try {
      const comment = await Comment.findByPk(commentId, { transaction });
      if (!comment) {
        throw new Error('Commentaire non trouvé');
      }

      // Vérifier si l'utilisateur n'a pas déjà signalé ce commentaire
      const existingReport = await CommentReport.findOne({
        where: { comment_id: commentId, user_id: userId },
        transaction
      });

      if (existingReport) {
        throw new Error('Vous avez déjà signalé ce commentaire');
      }

      // Créer le signalement
      const report = await CommentReport.create(
        {
          comment_id: commentId,
          user_id: userId,
          reason,
          description
        },
        { transaction }
      );

      // Incrémenter le compteur de signalements
      await comment.increment('reports_count', { transaction });

      // Vérifier si le commentaire doit être automatiquement masqué
      const updatedComment = await Comment.findByPk(commentId, { transaction });
      if (updatedComment.reports_count >= 5) {
        await updatedComment.update({ status: 'flagged' }, { transaction });
      }

      await transaction.commit();

      // Notifier les modérateurs si nécessaire
      if (updatedComment.reports_count >= 3) {
        this.notifyModeratorsCommentReported(updatedComment, report).catch((err) => {
          console.error('Erreur notification signalement:', err);
        });
      }

      return {
        success: true,
        message: 'Commentaire signalé avec succès',
        reports_count: updatedComment.reports_count
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Statistiques des commentaires d'un POI
  static async getCommentStats(poiId) {
    const stats = await Comment.findOne({
      where: { poi_id: poiId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_comments'],
        [
          sequelize.fn('COUNT', sequelize.literal('CASE WHEN parent_id IS NULL THEN 1 END')),
          'root_comments'
        ],
        [
          sequelize.fn('COUNT', sequelize.literal('CASE WHEN parent_id IS NOT NULL THEN 1 END')),
          'replies'
        ],
        [sequelize.fn('AVG', sequelize.col('likes_count')), 'avg_likes'],
        [sequelize.fn('MAX', sequelize.col('created_at')), 'latest_comment']
      ]
    });

    return {
      poi_id: poiId,
      total_comments: parseInt(stats?.dataValues?.total_comments || 0),
      root_comments: parseInt(stats?.dataValues?.root_comments || 0),
      replies: parseInt(stats?.dataValues?.replies || 0),
      avg_likes: parseFloat(stats?.dataValues?.avg_likes || 0).toFixed(1),
      latest_comment: stats?.dataValues?.latest_comment
    };
  }

  // Notifications privées
  static async notifyNewComment(comment, poi) {
    try {
      // Notifier le propriétaire du POI si ce n'est pas lui qui commente
      if (poi.created_by !== comment.user_id) {
        await notificationService.notifyCommentAdded(comment, poi);
      }

      // Si c'est une réponse, notifier l'auteur du commentaire parent
      if (comment.parent_id) {
        const parentComment = await Comment.findByPk(comment.parent_id, {
          include: [{ model: User, as: 'author' }]
        });

        if (parentComment && parentComment.user_id !== comment.user_id) {
          await notificationService.notifyCommentReply(comment, parentComment);
        }
      }
    } catch (error) {
      console.error('Erreur notifications commentaire:', error);
    }
  }

  static async notifyModeratorsCommentReported(comment, report) {
    try {
      await notificationService.notifyCommentReported(comment, report);
    } catch (error) {
      console.error('Erreur notification signalement:', error);
    }
  }
}

module.exports = CommentService;
