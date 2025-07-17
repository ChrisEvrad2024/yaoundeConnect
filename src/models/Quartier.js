const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Quartier = sequelize.define(
        'Quartier',
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
            arrondissement_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                references: {
                    model: 'arrondissements',
                    key: 'id'
                }
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            longitude: {
                type: DataTypes.DOUBLE,
                allowNull: false
            },
            latitude: {
                type: DataTypes.DOUBLE,
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
            town_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'towns',
                    key: 'id'
                }
            }
        },
        {
            tableName: 'quartiers',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

    Quartier.associate = (models) => {
        Quartier.belongsTo(models.Town, { foreignKey: 'town_id' });
        Quartier.belongsTo(models.Arrondissement, { foreignKey: 'arrondissement_id' });
        Quartier.hasMany(models.PointInterest, { foreignKey: 'quartier_id' });
        Quartier.hasMany(models.Transport, { foreignKey: 'quartier1_id', as: 'departureTransports' });
        Quartier.hasMany(models.Transport, { foreignKey: 'quartier2_id', as: 'arrivalTransports' });
    };

    return Quartier;
};
