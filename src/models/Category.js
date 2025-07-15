const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define(
    'Category',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(45),
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      langue: {
        type: DataTypes.STRING(45),
        defaultValue: 'fr'
      },
      icon: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      is_translate: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      translate_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      parent_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      }
    },
    {
      tableName: 'categories',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  Category.associate = (models) => {
    Category.hasMany(models.PointInterest, { foreignKey: 'category_id' });
    Category.belongsTo(models.Category, { foreignKey: 'parent_id', as: 'parent' });
    Category.hasMany(models.Category, { foreignKey: 'parent_id', as: 'children' });
  };

  return Category;
};
