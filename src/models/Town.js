const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Town = sequelize.define('Town', {
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
        country_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'countries',
                key: 'id'
            }
        },
        translate_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true
        }
    }, {
        tableName: 'towns',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Town.associate = (models) => {
        Town.belongsTo(models.Country, { foreignKey: 'country_id' });
        Town.hasMany(models.Quartier, { foreignKey: 'town_id' });
    };

    return Town;
};