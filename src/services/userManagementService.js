// src/services/userManagementService.js
const { User, AuditLog } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const AuthService = require('./authService');

class UserManagementService {
    // Hiérarchie des rôles avec niveaux
    static roleHierarchy= {
        'superadmin': 4,
        'admin': 3,
        'moderateur': 2,
        'collecteur': 1,
        'membre': 0
    };

    // Rôles gérables par chaque niveau
    static manageableRoles = {
        'superadmin': ['admin', 'moderateur', 'collecteur', 'membre'],
        'admin': ['moderateur', 'collecteur'],
        'moderateur': ['collecteur'],
        'collecteur': [],
        'membre': []
    };

    /**
     * Vérifier si un utilisateur peut gérer un rôle spécifique
     */
    static canManageRole(managerRole, targetRole) {
        const manageable = this.manageableRoles[managerRole] || [];
        return manageable.includes(targetRole);
    }

    /**
     * Vérifier si un utilisateur peut gérer un autre utilisateur
     */
    static canManageUser(manager, targetUser) {
        // Ne peut pas se gérer soi-même
        if (manager.id === targetUser.id) {
            return false;
        }

        // Vérifier la hiérarchie des rôles
        return this.canManageRole(manager.role, targetUser.role);
    }

    /**
     * Créer un nouvel utilisateur
     */
    static async createUser(userData, managerId) {
        const { name, email, password, role } = userData;
        const transaction = await sequelize.transaction();

        try {
            // Vérifier que le gestionnaire peut créer ce rôle
            const manager = await User.findByPk(managerId);
            if (!manager) {
                throw new Error('Gestionnaire non trouvé');
            }

            if (!this.canManageRole(manager.role, role)) {
                throw new Error(`Vous n'avez pas l'autorisation de créer un utilisateur avec le rôle "${role}"`);
            }

            // Vérifier si l'email existe déjà
            const existingUser = await User.findOne({ where: { email }, transaction });
            if (existingUser) {
                throw new Error('Un utilisateur avec cet email existe déjà');
            }

            // Hacher le mot de passe
            const hashedPassword = await AuthService.hashPassword(password);

            // Créer l'utilisateur
            const newUser = await User.create({
                name,
                email,
                password: hashedPassword,
                role,
                is_email_verified: true, // Auto-vérifier pour les utilisateurs créés par admin
                created_by: managerId
            }, { transaction });

            // Créer l'entrée d'audit
            await AuditLog.create({
                table_name: 'users',
                record_id: newUser.id,
                action: 'CREATE',
                old_values: null,
                new_values: {
                    name,
                    email,
                    role,
                    created_by: managerId
                },
                user_id: managerId
            }, { transaction });

            await transaction.commit();

            // Retourner sans le mot de passe
            const userResponse = newUser.toJSON();
            delete userResponse.password;
            delete userResponse.email_verification_token;

            return userResponse;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Lister les utilisateurs gérables
     */
    static async getUsersManageable(managerId, filters = {}) {
        const manager = await User.findByPk(managerId);
        if (!manager) {
            throw new Error('Gestionnaire non trouvé');
        }

        const manageableRoles = this.manageableRoles[manager.role] || [];
        if (manageableRoles.length === 0) {
            return { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
        }

        const {
            page = 1,
            limit = 20,
            search,
            role,
            is_email_verified,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = filters;

        const whereConditions = {
            role: { [Op.in]: manageableRoles },
            id: { [Op.ne]: managerId } // Exclure le gestionnaire lui-même
        };

        // Filtres additionnels
        if (search) {
            whereConditions[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        if (role && manageableRoles.includes(role)) {
            whereConditions.role = role;
        }

        if (is_email_verified !== undefined) {
            whereConditions.is_email_verified = is_email_verified;
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
            where: whereConditions,
            attributes: { exclude: ['password', 'email_verification_token'] },
            include: [
                {
                    model: User,
                    as: 'createdBy',
                    attributes: ['id', 'name', 'role'],
                    required: false
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

    /**
     * Obtenir un utilisateur par ID
     */
    static async getUserById(userId, managerId) {
        const manager = await User.findByPk(managerId);
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'email_verification_token'] },
            include: [
                {
                    model: User,
                    as: 'createdBy',
                    attributes: ['id', 'name', 'role'],
                    required: false
                }
            ]
        });

        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        // Vérifier les permissions
        if (!this.canManageUser(manager, user)) {
            throw new Error('Vous n\'avez pas l\'autorisation de consulter cet utilisateur');
        }

        return user;
    }

    /**
     * Mettre à jour un utilisateur
     */
    static async updateUser(userId, updateData, managerId) {
        const transaction = await sequelize.transaction();

        try {
            const manager = await User.findByPk(managerId);
            const user = await User.findByPk(userId, { transaction });

            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Vérifier les permissions
            if (!this.canManageUser(manager, user)) {
                throw new Error('Vous n\'avez pas l\'autorisation de modifier cet utilisateur');
            }

            // Sauvegarder les anciennes valeurs pour l'audit
            const oldValues = {
                name: user.name,
                email: user.email,
                role: user.role,
                is_email_verified: user.is_email_verified
            };

            const allowedFields = ['name', 'email', 'role', 'is_email_verified'];
            const updateFields = {};

            // Filtrer et valider les champs autorisés
            for (const field of allowedFields) {
                if (updateData.hasOwnProperty(field)) {
                    // Validation spéciale pour le rôle
                    if (field === 'role') {
                        if (!this.canManageRole(manager.role, updateData.role)) {
                            throw new Error(`Vous n'avez pas l'autorisation d'assigner le rôle "${updateData.role}"`);
                        }
                    }

                    // Validation spéciale pour l'email
                    if (field === 'email' && updateData.email !== user.email) {
                        const existingUser = await User.findOne({
                            where: {
                                email: updateData.email,
                                id: { [Op.ne]: userId }
                            },
                            transaction
                        });
                        if (existingUser) {
                            throw new Error('Un utilisateur avec cet email existe déjà');
                        }
                    }

                    updateFields[field] = updateData[field];
                }
            }

            if (Object.keys(updateFields).length === 0) {
                throw new Error('Aucun champ valide à mettre à jour');
            }

            // Mettre à jour l'utilisateur
            await user.update(updateFields, { transaction });

            // Créer l'entrée d'audit
            await AuditLog.create({
                table_name: 'users',
                record_id: userId,
                action: 'UPDATE',
                old_values: oldValues,
                new_values: updateFields,
                user_id: managerId
            }, { transaction });

            await transaction.commit();

            // Retourner l'utilisateur mis à jour
            return await this.getUserById(userId, managerId);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Supprimer un utilisateur
     */
    static async deleteUser(userId, managerId) {
        const transaction = await sequelize.transaction();

        try {
            const manager = await User.findByPk(managerId);
            const user = await User.findByPk(userId, { transaction });

            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Vérifier les permissions
            if (!this.canManageUser(manager, user)) {
                throw new Error('Vous n\'avez pas l\'autorisation de supprimer cet utilisateur');
            }

            // Sauvegarder les données pour l'audit
            const userData = {
                name: user.name,
                email: user.email,
                role: user.role
            };

            // Créer l'entrée d'audit avant suppression
            await AuditLog.create({
                table_name: 'users',
                record_id: userId,
                action: 'DELETE',
                old_values: userData,
                new_values: null,
                user_id: managerId
            }, { transaction });

            // Supprimer l'utilisateur
            await user.destroy({ transaction });

            await transaction.commit();

            return {
                id: userId,
                deleted: true,
                deleted_user: userData,
                deleted_by: managerId
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Réinitialiser le mot de passe d'un utilisateur
     */
    static async resetUserPassword(userId, newPassword, managerId) {
        const transaction = await sequelize.transaction();

        try {
            const manager = await User.findByPk(managerId);
            const user = await User.findByPk(userId, { transaction });

            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Vérifier les permissions
            if (!this.canManageUser(manager, user)) {
                throw new Error('Vous n\'avez pas l\'autorisation de réinitialiser le mot de passe de cet utilisateur');
            }

            // Hacher le nouveau mot de passe
            const hashedPassword = await AuthService.hashPassword(newPassword);

            // Mettre à jour le mot de passe
            await user.update({ password: hashedPassword }, { transaction });

            // Créer l'entrée d'audit
            await AuditLog.create({
                table_name: 'users',
                record_id: userId,
                action: 'PASSWORD_RESET',
                old_values: { password_reset_by: managerId },
                new_values: { password_reset: true },
                user_id: managerId
            }, { transaction });

            await transaction.commit();

            return {
                id: userId,
                password_reset: true,
                reset_by: managerId
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Obtenir l'historique des modifications d'un utilisateur
     */
    static async getUserAuditHistory(userId, managerId) {
        const manager = await User.findByPk(managerId);
        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        // Vérifier les permissions
        if (!this.canManageUser(manager, user)) {
            throw new Error('Vous n\'avez pas l\'autorisation de consulter l\'historique de cet utilisateur');
        }

        const history = await AuditLog.findAll({
            where: {
                table_name: 'users',
                record_id: userId
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'role']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return history.map((entry) => ({
            id: entry.id,
            action: entry.action,
            modified_by: entry.User ? {
                id: entry.User.id,
                name: entry.User.name,
                role: entry.User.role
            } : null,
            old_values: entry.old_values,
            new_values: entry.new_values,
            created_at: entry.created_at
        }));
    }

    /**
     * Statistiques de gestion des utilisateurs
     */
    static async getManagementStats(managerId) {
        const manager = await User.findByPk(managerId);
        if (!manager) {
            throw new Error('Gestionnaire non trouvé');
        }

        const manageableRoles = this.manageableRoles[manager.role] || [];
        if (manageableRoles.length === 0) {
            return { total: 0, by_role: {}, recent_activity: 0 };
        }

        // Statistiques par rôle
        const usersByRole = {};
        for (const role of manageableRoles) {
            const count = await User.count({
                where: {
                    role,
                    id: { [Op.ne]: managerId }
                }
            });
            usersByRole[role] = count;
        }

        // Total des utilisateurs gérables
        const totalUsers = Object.values(usersByRole).reduce((sum, count) => sum + count, 0);

        // Activité récente (7 derniers jours)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentActivity = await AuditLog.count({
            where: {
                table_name: 'users',
                user_id: managerId,
                created_at: { [Op.gte]: sevenDaysAgo }
            }
        });

        return {
            total: totalUsers,
            by_role: usersByRole,
            recent_activity: recentActivity,
            manageable_roles: manageableRoles
        };
    }
}

module.exports = UserManagementService;