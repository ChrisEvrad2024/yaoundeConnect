// src/models/CommentReport.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CommentReport = sequelize.define('CommentReport', {
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
        },
        reason: {
            type: DataTypes.ENUM('spam', 'inappropriate', 'harassment', 'misinformation', 'other'),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'reviewed', 'dismissed'),
            defaultValue: 'pending'
        },
        reviewed_by: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'comment_reports',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['comment_id', 'status'] },
            { fields: ['user_id'] },
            { fields: ['status'] }
        ]
    });

    CommentReport.associate = (models) => {
        CommentReport.belongsTo(models.Comment, { foreignKey: 'comment_id' });
        CommentReport.belongsTo(models.User, { foreignKey: 'user_id', as: 'reporter' });
        CommentReport.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewer' });
    };

    return CommentReport;
};