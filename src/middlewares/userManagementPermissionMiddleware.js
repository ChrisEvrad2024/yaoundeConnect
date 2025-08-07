// src/middlewares/userManagementPermissionMiddleware.js
const UserManagementService = require('../services/userManagementService');

/**
 * Middleware pour vérifier les permissions de gestion des utilisateurs
 * Ce middleware vérifie si l'utilisateur connecté a le droit de gérer d'autres utilisateurs
 */
const userManagementPermissionMiddleware = (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        type: 'https://httpstatuses.com/401',
        title: 'Authentification requise',
        status: 401,
        detail: 'Vous devez être connecté pour accéder à cette ressource'
      });
    }

    const userRole = req.user.role;

    // Vérifier que l'utilisateur a des permissions de gestion
    const manageableRoles = UserManagementService.manageableRoles[userRole] || [];

    if (manageableRoles.length === 0) {
      return res.status(403).json({
        type: 'https://httpstatuses.com/403',
        title: 'Permissions insuffisantes',
        status: 403,
        detail: "Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs"
      });
    }

    // Ajouter les informations de permissions dans la requête pour utilisation ultérieure
    req.managementPermissions = {
      managerRole: userRole,
      manageableRoles: manageableRoles,
      roleHierarchy: UserManagementService.roleHierarchy
    };

    next();
  } catch (error) {
    console.error('Erreur middleware permissions utilisateurs:', error);
    return res.status(500).json({
      type: 'https://httpstatuses.com/500',
      title: 'Erreur interne',
      status: 500,
      detail: 'Erreur lors de la vérification des permissions'
    });
  }
};

/**
 * Middleware pour vérifier les permissions spécifiques à un rôle
 * @param {string|array} allowedRoles - Rôle(s) autorisé(s) à utiliser cette route
 */
const requireManagementRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          type: 'https://httpstatuses.com/401',
          title: 'Authentification requise',
          status: 401,
          detail: 'Vous devez être connecté pour accéder à cette ressource'
        });
      }

      const userRole = req.user.role;

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Rôle insuffisant',
          status: 403,
          detail: `Cette action nécessite l'un des rôles suivants: ${roles.join(', ')}. Votre rôle: ${userRole}`
        });
      }

      next();
    } catch (error) {
      console.error('Erreur middleware rôle de gestion:', error);
      return res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur interne',
        status: 500,
        detail: 'Erreur lors de la vérification du rôle'
      });
    }
  };
};

/**
 * Middleware pour valider qu'un rôle peut être géré par l'utilisateur connecté
 * Utilisé dans les routes de création/modification où un rôle est spécifié
 */
const validateTargetRole = (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role) {
      return next(); // Si pas de rôle spécifié, passer au suivant
    }

    const userRole = req.user.role;
    const manageableRoles = UserManagementService.manageableRoles[userRole] || [];

    if (!manageableRoles.includes(role)) {
      return res.status(403).json({
        type: 'https://httpstatuses.com/403',
        title: 'Rôle non autorisé',
        status: 403,
        detail: `Vous ne pouvez pas créer/modifier un utilisateur avec le rôle "${role}". Rôles autorisés: ${manageableRoles.join(', ')}`
      });
    }

    next();
  } catch (error) {
    console.error('Erreur validation rôle cible:', error);
    return res.status(500).json({
      type: 'https://httpstatuses.com/500',
      title: 'Erreur interne',
      status: 500,
      detail: 'Erreur lors de la validation du rôle cible'
    });
  }
};

/**
 * Middleware pour s'assurer qu'un utilisateur ne peut pas se modifier lui-même
 * via les routes de gestion (sauf pour certaines actions spécifiques)
 */
const preventSelfManagement = (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        type: 'https://httpstatuses.com/400',
        title: 'Auto-gestion interdite',
        status: 400,
        detail:
          'Vous ne pouvez pas vous gérer vous-même via ces routes. Utilisez les routes de profil appropriées.'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur middleware auto-gestion:', error);
    return res.status(500).json({
      type: 'https://httpstatuses.com/500',
      title: 'Erreur interne',
      status: 500,
      detail: "Erreur lors de la vérification d'auto-gestion"
    });
  }
};

/**
 * Middleware de logging des actions de gestion
 * Enregistre les actions importantes pour audit
 */
const logManagementAction = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      // Logger uniquement si la requête a réussi (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`📋 [GESTION_UTILISATEURS] ${action.toUpperCase()}`);
        console.log(`   Manager: ${req.user.name} (${req.user.role})`);
        console.log(`   Timestamp: ${new Date().toISOString()}`);

        if (req.params.id) {
          console.log(`   Utilisateur cible: ID ${req.params.id}`);
        }

        if (req.body.role) {
          console.log(`   Rôle cible: ${req.body.role}`);
        }
      }

      // Appeler la méthode send originale
      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  userManagementPermissionMiddleware,
  requireManagementRole,
  validateTargetRole,
  preventSelfManagement,
  logManagementAction
};
