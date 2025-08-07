// src/routes/users.js
const express = require('express');
const UserManagementController = require('../controllers/userManagementController');
const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');
const userManagementValidator = require('../validators/userManagementValidator');

const {
  userManagementPermissionMiddleware,
  requireManagementRole,
  validateTargetRole,
  preventSelfManagement,
  logManagementAction
} = require('../middlewares/userManagementPermissionMiddleware');

const router = express.Router();

// Middleware global pour toutes les routes de gestion des utilisateurs
router.use(authMiddleware); // Authentification requise
router.use(userManagementPermissionMiddleware); // Permissions de gestion requises

// Routes pour la consultation des informations de gestion

/**
 * GET /api/users/roles - Obtenir les rôles gérables
 * Accessible à tous les gestionnaires d'utilisateurs
 */
router.get(
  '/roles',
  logManagementAction('get_manageable_roles'),
  UserManagementController.getManageableRoles
);

/**
 * GET /api/users/stats - Statistiques de gestion
 * Accessible à tous les gestionnaires d'utilisateurs
 */
router.get(
  '/stats',
  logManagementAction('get_management_stats'),
  UserManagementController.getStats
);

/**
 * GET /api/users - Lister les utilisateurs gérables
 * Accessible à tous les gestionnaires d'utilisateurs
 */
router.get(
  '/',
  validationMiddleware(userManagementValidator.searchFilters, 'query'),
  logManagementAction('list_users'),
  UserManagementController.getUsers
);

/**
 * GET /api/users/:id - Obtenir un utilisateur par ID
 * Accessible à tous les gestionnaires d'utilisateurs (selon leurs permissions)
 */
router.get(
  '/:id',
  validationMiddleware(userManagementValidator.params, 'params'),
  preventSelfManagement,
  logManagementAction('get_user'),
  UserManagementController.getUser
);

/**
 * GET /api/users/:id/history - Historique des modifications d'un utilisateur
 * Accessible à tous les gestionnaires d'utilisateurs (selon leurs permissions)
 */
router.get(
  '/:id/history',
  validationMiddleware(userManagementValidator.params, 'params'),
  preventSelfManagement,
  logManagementAction('get_user_history'),
  UserManagementController.getUserHistory
);

// Routes pour la gestion des utilisateurs

/**
 * POST /api/users - Créer un nouvel utilisateur
 * Accessible selon les permissions hiérarchiques
 */
router.post(
  '/',
  validationMiddleware(userManagementValidator.createUser),
  validateTargetRole,
  logManagementAction('create_user'),
  UserManagementController.createUser
);

/**
 * PUT /api/users/:id - Mettre à jour un utilisateur
 * Accessible selon les permissions hiérarchiques
 */
router.put(
  '/:id',
  validationMiddleware(userManagementValidator.params, 'params'),
  validationMiddleware(userManagementValidator.updateUser),
  preventSelfManagement,
  validateTargetRole,
  logManagementAction('update_user'),
  UserManagementController.updateUser
);

/**
 * DELETE /api/users/:id - Supprimer un utilisateur
 * Accessible selon les permissions hiérarchiques
 * Action critique nécessitant des permissions élevées
 */
router.delete(
  '/:id',
  validationMiddleware(userManagementValidator.params, 'params'),
  preventSelfManagement,
  requireManagementRole(['moderateur', 'admin', 'superadmin']), // Minimum modérateur pour supprimer
  logManagementAction('delete_user'),
  UserManagementController.deleteUser
);

/**
 * POST /api/users/:id/reset-password - Réinitialiser le mot de passe d'un utilisateur
 * Accessible selon les permissions hiérarchiques
 * Action sensible nécessitant une validation supplémentaire
 */
router.post(
  '/:id/reset-password',
  validationMiddleware(userManagementValidator.params, 'params'),
  validationMiddleware(userManagementValidator.resetPassword),
  preventSelfManagement,
  requireManagementRole(['moderateur', 'admin', 'superadmin']), // Minimum modérateur pour reset password
  logManagementAction('reset_user_password'),
  UserManagementController.resetPassword
);

// Route de documentation des permissions (utile pour le développement)
if (process.env.NODE_ENV === 'development') {
  /**
   * GET /api/users/dev/permissions - Documentation des permissions (développement uniquement)
   */
  router.get('/dev/permissions', (req, res) => {
    const UserManagementService = require('../services/userManagementService');

    res.json({
      message: 'Documentation des permissions de gestion des utilisateurs',
      user_info: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      role_hierarchy: UserManagementService.roleHierarchy,
      manageable_roles: UserManagementService.manageableRoles,
      current_user_permissions: {
        can_manage: UserManagementService.manageableRoles[req.user.role] || [],
        hierarchy_level: UserManagementService.roleHierarchy[req.user.role] || 0
      },
      routes_explanation: {
        'GET /api/users': 'Liste tous les utilisateurs gérables selon votre rôle',
        'GET /api/users/:id': 'Obtient un utilisateur spécifique (si vous pouvez le gérer)',
        'POST /api/users': 'Crée un utilisateur avec un rôle que vous pouvez gérer',
        'PUT /api/users/:id': 'Modifie un utilisateur que vous pouvez gérer',
        'DELETE /api/users/:id': 'Supprime un utilisateur (modérateur+ uniquement)',
        'POST /api/users/:id/reset-password': 'Reset le mot de passe (modérateur+ uniquement)',
        'GET /api/users/:id/history': "Historique des modifications d'un utilisateur",
        'GET /api/users/stats': 'Statistiques de vos utilisateurs gérables',
        'GET /api/users/roles': 'Liste des rôles que vous pouvez gérer'
      }
    });
  });
}

module.exports = router;
