const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CommentLike = sequelize.define('CommentLike', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        comment_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'comments',
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
        tableName: 'comment_likes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['comment_id', 'user_id'],
                name: 'unique_comment_user_like'
            }
        ]
    });

    CommentLike.associate = (models) => {
        CommentLike.belongsTo(models.Comment, { foreignKey: 'comment_id' });
        CommentLike.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return CommentLike;
};
