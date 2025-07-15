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
    User.hasMany(models.PointInterest, { foreignKey: 'user_id', as: 'createdPOIs' });
    User.hasMany(models.PointInterest, { foreignKey: 'created_by', as: 'authoredPOIs' });
    User.hasMany(models.PointInterest, { foreignKey: 'approved_by', as: 'approvedPOIs' });
    User.hasMany(models.Comment, { foreignKey: 'user_id' });
    User.hasMany(models.Rating, { foreignKey: 'user_id' });
    User.hasMany(models.Favorite, { foreignKey: 'user_id' });
    User.hasMany(models.AuditLog, { foreignKey: 'user_id' });

    // Relation many-to-many avec POI via favoris
    User.belongsToMany(models.PointInterest, {
      through: models.Favorite,
      foreignKey: 'user_id',
      otherKey: 'poi_id',
      as: 'favoritePOIs'
    });
  };

  return User;
};
