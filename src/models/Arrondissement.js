const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Arrondissement = sequelize.define(
    'Arrondissement',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      }
    },
    {
      tableName: 'arrondissements',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  Arrondissement.associate = (models) => {
    Arrondissement.hasMany(models.Quartier, { foreignKey: 'arrondissement_id' });
  };

  return Arrondissement;
};
