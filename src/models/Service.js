const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Service = sequelize.define(
    'Service',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      amount: {
        type: DataTypes.DOUBLE(8, 2),
        allowNull: false
      },
      langue: {
        type: DataTypes.STRING(45),
        defaultValue: 'fr'
      },
      is_translate: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      translate_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      pointinteret_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'point_interests',
          key: 'id'
        }
      }
    },
    {
      tableName: 'services',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  Service.associate = (models) => {
    Service.belongsTo(models.PointInterest, { foreignKey: 'pointinteret_id' });
  };

  return Service;
};
