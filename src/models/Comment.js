const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Comment = sequelize.define('Comment', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                len: [5, 2000] // Minimum 5 caractères, maximum 2000
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
        },
        parent_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            references: {
                model: 'comments',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
            defaultValue: 'approved' // Auto-approuvé par défaut, modération a posteriori
        },
        moderated_by: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        is_edited: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        edited_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        likes_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        reports_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            }
        }
    }, {
        tableName: 'comments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['poi_id', 'status'] },
            { fields: ['user_id'] },
            { fields: ['parent_id'] },
            { fields: ['created_at'] }
        ]
    });

    Comment.associate = (models) => {
        Comment.belongsTo(models.PointInterest, { foreignKey: 'poi_id' });
        Comment.belongsTo(models.User, { foreignKey: 'user_id', as: 'author' });
        Comment.belongsTo(models.User, { foreignKey: 'moderated_by', as: 'moderator' });

        // Auto-relation pour les réponses
        Comment.belongsTo(models.Comment, { foreignKey: 'parent_id', as: 'parent' });
        Comment.hasMany(models.Comment, { foreignKey: 'parent_id', as: 'replies' });

        // Relations avec les likes et reports
        Comment.hasMany(models.CommentLike, { foreignKey: 'comment_id' });
        Comment.hasMany(models.CommentReport, { foreignKey: 'comment_id' });
    };

    return Comment;
};