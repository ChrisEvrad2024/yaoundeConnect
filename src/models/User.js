// src/models/User.js (mise à jour avec votre structure)
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [2, 255]
        }
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('membre', 'collecteur', 'moderateur', 'admin', 'superadmin'),
        defaultValue: 'membre'
      },
      is_email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      email_verification_expires: {
        type: DataTypes.DATE,
        allowNull: true
      },
      created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: "ID de l'utilisateur qui a créé cet utilisateur (pour la gestion administrative)"
      }
    },
    {
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  User.associate = (models) => {
    // Relations existantes (conservées)
    User.hasMany(models.PointInterest, { foreignKey: 'user_id', as: 'createdPOIs' });
    User.hasMany(models.PointInterest, { foreignKey: 'created_by', as: 'authoredPOIs' });
    User.hasMany(models.PointInterest, { foreignKey: 'approved_by', as: 'approvedPOIs' });
    User.hasMany(models.Comment, { foreignKey: 'user_id' });
    User.hasMany(models.Rating, { foreignKey: 'user_id' });
    User.hasMany(models.Favorite, { foreignKey: 'user_id' });
    User.hasMany(models.AuditLog, { foreignKey: 'user_id' });

    User.belongsToMany(models.PointInterest, {
      through: models.Favorite,
      foreignKey: 'user_id',
      otherKey: 'poi_id',
      as: 'favoritePOIs'
    });

    // Nouvelles relations pour la gestion des utilisateurs
    User.belongsTo(User, {
      foreignKey: 'created_by',
      as: 'createdBy',
      allowNull: true
    });

    User.hasMany(User, {
      foreignKey: 'created_by',
      as: 'createdUsers'
    });
  };

  // Méthodes d'instance
  User.prototype.toPublicJSON = function () {
    const user = this.toJSON();
    delete user.password;
    delete user.email_verification_token;
    return user;
  };

  // Méthodes de classe pour la gestion des utilisateurs
  User.getRoleHierarchy = function () {
    return {
      superadmin: 4,
      admin: 3,
      moderateur: 2,
      collecteur: 1,
      membre: 0
    };
  };

  User.canManageRole = function (managerRole, targetRole) {
    const hierarchy = this.getRoleHierarchy();
    return hierarchy[managerRole] > hierarchy[targetRole];
  };

  return User;
};
