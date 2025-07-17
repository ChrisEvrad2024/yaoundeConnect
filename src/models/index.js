const { sequelize } = require('../config/database');

// Import des modèles selon votre schéma
const User = require('./User')(sequelize);
const Country = require('./Country')(sequelize);
const Town = require('./Town')(sequelize);
const Arrondissement = require('./Arrondissement')(sequelize);
const Quartier = require('./Quartier')(sequelize);
const Category = require('./Category')(sequelize);
const PointInterest = require('./PointInterest')(sequelize);
const Service = require('./Service')(sequelize);
const Price = require('./Price')(sequelize);
const Contact = require('./Contact')(sequelize);
const Comment = require('./Comment')(sequelize);
const Rating = require('./Rating')(sequelize);
const Favorite = require('./Favorite')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const Transport = require('./Transport')(sequelize);

// Définir les associations
const models = {
    User,
    Country,
    Town,
    Arrondissement,
    Quartier,
    Category,
    PointInterest,
    Service,
    Price,
    Contact,
    Rating,
    Comment,
    CommentLike,
    CommentReport,
    Rating,
    Favorite,
    AuditLog,
    Transport
};

// Établir les associations
Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

module.exports = {
    sequelize,
    ...models
};
