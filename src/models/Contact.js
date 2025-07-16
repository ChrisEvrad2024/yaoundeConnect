const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Contact = sequelize.define('Contact', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        tel: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        whatsapp: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        url: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            }
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
        tableName: 'contacts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Contact.associate = (models) => {
        Contact.belongsTo(models.PointInterest, { foreignKey: 'pointinteret_id' });
    };

    return Contact;
};