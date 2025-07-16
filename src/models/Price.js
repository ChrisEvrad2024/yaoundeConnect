const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Price = sequelize.define('Price', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        price_name: {
            type: DataTypes.STRING(255),
            allowNull: false
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
    }, {
        tableName: 'prices',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Price.associate = (models) => {
        Price.belongsTo(models.PointInterest, { foreignKey: 'pointinteret_id' });
    };

    return Price;
};