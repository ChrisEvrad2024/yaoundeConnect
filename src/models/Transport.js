const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transport = sequelize.define(
    'Transport',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      tarif_jour: {
        type: DataTypes.DOUBLE(8, 2),
        allowNull: false
      },
      tarif_nuit: {
        type: DataTypes.DOUBLE(8, 2),
        allowNull: false
      },
      secteur: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      quartier1_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'quartiers',
          key: 'id'
        }
      },
      quartier2_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'quartiers',
          key: 'id'
        }
      }
    },
    {
      tableName: 'transports',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  Transport.associate = (models) => {
    Transport.belongsTo(models.Quartier, { foreignKey: 'quartier1_id', as: 'quartierDepart' });
    Transport.belongsTo(models.Quartier, { foreignKey: 'quartier2_id', as: 'quartierArrivee' });
  };

  return Transport;
};
