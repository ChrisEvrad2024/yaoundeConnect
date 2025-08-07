// src/controllers/userManagementController.js
const UserManagementService = require('../services/userManagementService');

class UserManagementController {
  /**
   * POST /api/users - Créer un nouvel utilisateur
   */
  static async createUser(req, res) {
    try {
      const managerId = req.user.id;
      const userData = req.body;

      console.log(`🔧 Création utilisateur par ${req.user.name} (${req.user.role})`);
      console.log(`   Rôle demandé: ${userData.role}`);

      const newUser = await UserManagementService.createUser(userData, managerId);

      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        user: newUser,
        created_by: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('❌ Erreur création utilisateur:', error);

      if (error.message.includes('existe déjà')) {
        return res.status(409).json({
          type: 'https://httpstatuses.com/409',
          title: 'Utilisateur existant',
          status: 409,
          detail: error.message
        });
      }

      if (error.message.includes('autorisation')) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Permission refusée',
          status: 403,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de création',
        status: 500,
        detail: "Une erreur est survenue lors de la création de l'utilisateur"
      });
    }
  }

  /**
   * GET /api/users - Lister les utilisateurs gérables
   */
  static async getUsers(req, res) {
    try {
      const managerId = req.user.id;
      const filters = req.query;

      const result = await UserManagementService.getUsersManageable(managerId, filters);

      res.json({
        message: 'Utilisateurs récupérés avec succès',
        data: result.data,
        pagination: result.pagination,
        filters: filters
      });
    } catch (error) {
      console.error('❌ Erreur récupération utilisateurs:', error);

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de récupération',
        status: 500,
        detail: 'Une erreur est survenue lors de la récupération des utilisateurs'
      });
    }
  }

  /**
   * GET /api/users/:id - Obtenir un utilisateur par ID
   */
  static async getUser(req, res) {
    try {
      const { id } = req.params;
      const managerId = req.user.id;

      const user = await UserManagementService.getUserById(parseInt(id), managerId);

      res.json({
        message: 'Utilisateur récupéré avec succès',
        user
      });
    } catch (error) {
      console.error('❌ Erreur récupération utilisateur:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Utilisateur non trouvé',
          status: 404,
          detail: error.message
        });
      }

      if (error.message.includes('autorisation')) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Permission refusée',
          status: 403,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de récupération',
        status: 500,
        detail: "Une erreur est survenue lors de la récupération de l'utilisateur"
      });
    }
  }

  /**
   * PUT /api/users/:id - Mettre à jour un utilisateur
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const managerId = req.user.id;
      const updateData = req.body;

      console.log(`🔧 Modification utilisateur ${id} par ${req.user.name}`);
      console.log(`   Champs à modifier:`, Object.keys(updateData));

      const updatedUser = await UserManagementService.updateUser(
        parseInt(id),
        updateData,
        managerId
      );

      res.json({
        message: 'Utilisateur mis à jour avec succès',
        user: updatedUser,
        modified_by: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('❌ Erreur modification utilisateur:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Utilisateur non trouvé',
          status: 404,
          detail: error.message
        });
      }

      if (error.message.includes('autorisation')) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Permission refusée',
          status: 403,
          detail: error.message
        });
      }

      if (error.message.includes('existe déjà')) {
        return res.status(409).json({
          type: 'https://httpstatuses.com/409',
          title: 'Conflit de données',
          status: 409,
          detail: error.message
        });
      }

      if (error.message.includes('Aucun champ')) {
        return res.status(400).json({
          type: 'https://httpstatuses.com/400',
          title: 'Données invalides',
          status: 400,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de modification',
        status: 500,
        detail: "Une erreur est survenue lors de la modification de l'utilisateur"
      });
    }
  }

  /**
   * DELETE /api/users/:id - Supprimer un utilisateur
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const managerId = req.user.id;

      console.log(`🔧 Suppression utilisateur ${id} par ${req.user.name}`);

      const result = await UserManagementService.deleteUser(parseInt(id), managerId);

      res.json({
        message: 'Utilisateur supprimé avec succès',
        result,
        deleted_by: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('❌ Erreur suppression utilisateur:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Utilisateur non trouvé',
          status: 404,
          detail: error.message
        });
      }

      if (error.message.includes('autorisation')) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Permission refusée',
          status: 403,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de suppression',
        status: 500,
        detail: "Une erreur est survenue lors de la suppression de l'utilisateur"
      });
    }
  }

  /**
   * POST /api/users/:id/reset-password - Réinitialiser le mot de passe
   */
  static async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { new_password } = req.body;
      const managerId = req.user.id;

      console.log(`🔧 Réinitialisation mot de passe utilisateur ${id} par ${req.user.name}`);

      const result = await UserManagementService.resetUserPassword(
        parseInt(id),
        new_password,
        managerId
      );

      res.json({
        message: 'Mot de passe réinitialisé avec succès',
        result,
        reset_by: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('❌ Erreur réinitialisation mot de passe:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Utilisateur non trouvé',
          status: 404,
          detail: error.message
        });
      }

      if (error.message.includes('autorisation')) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Permission refusée',
          status: 403,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de réinitialisation',
        status: 500,
        detail: 'Une erreur est survenue lors de la réinitialisation du mot de passe'
      });
    }
  }

  /**
   * GET /api/users/:id/history - Historique des modifications
   */
  static async getUserHistory(req, res) {
    try {
      const { id } = req.params;
      const managerId = req.user.id;

      const history = await UserManagementService.getUserAuditHistory(parseInt(id), managerId);

      res.json({
        message: 'Historique récupéré avec succès',
        data: {
          user_id: parseInt(id),
          history
        }
      });
    } catch (error) {
      console.error('❌ Erreur historique utilisateur:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Utilisateur non trouvé',
          status: 404,
          detail: error.message
        });
      }

      if (error.message.includes('autorisation')) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Permission refusée',
          status: 403,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur historique',
        status: 500,
        detail: "Une erreur est survenue lors de la récupération de l'historique"
      });
    }
  }

  /**
   * GET /api/users/stats - Statistiques de gestion
   */
  static async getStats(req, res) {
    try {
      const managerId = req.user.id;

      const stats = await UserManagementService.getManagementStats(managerId);

      res.json({
        message: 'Statistiques récupérées avec succès',
        data: {
          manager: {
            id: req.user.id,
            name: req.user.name,
            role: req.user.role
          },
          stats
        }
      });
    } catch (error) {
      console.error('❌ Erreur statistiques:', error);

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur statistiques',
        status: 500,
        detail: 'Une erreur est survenue lors du calcul des statistiques'
      });
    }
  }

  /**
   * GET /api/users/roles - Obtenir les rôles gérables
   */
  static async getManageableRoles(req, res) {
    try {
      const managerRole = req.user.role;
      const manageableRoles = UserManagementService.manageableRoles[managerRole] || [];

      res.json({
        message: 'Rôles gérables récupérés',
        data: {
          manager_role: managerRole,
          manageable_roles: manageableRoles,
          role_hierarchy: UserManagementService.roleHierarchy
        }
      });
    } catch (error) {
      console.error('❌ Erreur rôles gérables:', error);

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur rôles',
        status: 500,
        detail: 'Une erreur est survenue lors de la récupération des rôles'
      });
    }
  }
}

module.exports = UserManagementController;
