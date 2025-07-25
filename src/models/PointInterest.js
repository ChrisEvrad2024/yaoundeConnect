const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PointInterest = sequelize.define(
    'PointInterest',
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
      etoile: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      adress: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      longitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
          min: -180,
          max: 180
        }
      },
      latitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
          min: -90,
          max: 90
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      is_booking: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_verify: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_restaurant: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_transport: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_stadium: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_recommand: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      langue: {
        type: DataTypes.STRING(45),
        defaultValue: 'fr'
      },
      is_translate: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      translate_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      category_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        }
      },
      quartier_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'quartiers',
          key: 'id'
        }
      },
      created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      approved_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      rating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 0.0,
        validate: {
          min: 0,
          max: 5
        }
      },
      rating_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
      }
    },
    {
      tableName: 'point_interests',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  PointInterest.associate = (models) => {
    PointInterest.belongsTo(models.Quartier, { foreignKey: 'quartier_id' });
    PointInterest.belongsTo(models.Category, {
      foreignKey: 'category_id'
      // targetKey: 'translate_id'  // Référence translate_id au lieu de id
    });
    PointInterest.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    PointInterest.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    PointInterest.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
    PointInterest.hasMany(models.Service, { foreignKey: 'pointinteret_id' });
    PointInterest.hasMany(models.Price, { foreignKey: 'pointinteret_id' });
    PointInterest.hasMany(models.Contact, { foreignKey: 'pointinteret_id' });
    PointInterest.hasMany(models.Comment, { foreignKey: 'poi_id' });
    PointInterest.hasMany(models.Rating, { foreignKey: 'poi_id' });
    PointInterest.hasMany(models.Favorite, { foreignKey: 'poi_id' });

    // Relation many-to-many avec User via favoris
    PointInterest.belongsToMany(models.User, {
      through: models.Favorite,
      foreignKey: 'poi_id',
      otherKey: 'user_id',
      as: 'favoriteUsers'
    });
  };

  return PointInterest;
};
