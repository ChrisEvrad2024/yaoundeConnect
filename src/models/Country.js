const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Country', {
    name: DataTypes.STRING,
    code: DataTypes.STRING(3)
  });
};
