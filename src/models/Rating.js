const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Rating = sequelize.define('Rating', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        rating: {
            type: DataTypes.TINYINT,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        poi_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'point_interests',
                key: 'id'
            }
        },
        user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'ratings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'poi_id'],
                name: 'unique_user_poi'
            }
        ]
    });

    Rating.associate = (models) => {
        Rating.belongsTo(models.PointInterest, { foreignKey: 'poi_id' });
        Rating.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return Rating;
};