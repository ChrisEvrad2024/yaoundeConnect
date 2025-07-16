const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AuditLog = sequelize.define('AuditLog', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        table_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        record_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false
        },
        action: {
            type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
            allowNull: false
        },
        old_values: {
            type: DataTypes.JSON,
            allowNull: true
        },
        new_values: {
            type: DataTypes.JSON,
            allowNull: true
        },
        user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'audit_logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    AuditLog.associate = (models) => {
        AuditLog.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return AuditLog;
};