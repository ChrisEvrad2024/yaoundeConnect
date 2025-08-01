const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Country = sequelize.define('Country', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        code: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        continent_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        flag: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        langue: {
            type: DataTypes.STRING(250),
            defaultValue: 'fr'
        },
        is_translate: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        translate_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true
        }
    }, {
        tableName: 'countries',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Country.associate = (models) => {
        Country.hasMany(models.Town, { foreignKey: 'country_id' });
    };

    return Country;
};