const { Op } = require('sequelize');

class PaginationService {

    // Pagination cursor-based pour performance optimale
    static async cursorPaginate(model, options = {}) {
        const {
            cursor = null,           // ID du dernier élément de la page précédente
            limit = 20,              // Nombre d'éléments par page
            cursorField = 'id',      // Champ utilisé pour le cursor (doit être ordonnable)
            direction = 'ASC',       // ASC ou DESC
            where = {},              // Conditions WHERE
            include = [],            // Relations à inclure
            attributes = undefined,   // Attributs à sélectionner
            order = []               // Ordre supplémentaire
        } = options;

        // Construire les conditions WHERE
        const whereConditions = { ...where };

        // Ajouter la condition cursor si fournie
        if (cursor) {
            const operator = direction === 'ASC' ? Op.gt : Op.lt;
            whereConditions[cursorField] = { [operator]: cursor };
        }

        // Construire l'ordre
        const orderConditions = [[cursorField, direction], ...order];

        try {
            // Récupérer limit + 1 pour savoir s'il y a une page suivante
            const results = await model.findAll({
                where: whereConditions,
                include,
                attributes,
                order: orderConditions,
                limit: parseInt(limit) + 1,
                raw: false
            });

            // Déterminer s'il y a une page suivante
            const hasNext = results.length > limit;
            const data = hasNext ? results.slice(0, limit) : results;

            // Déterminer les cursors
            const startCursor = data.length > 0 ? data[0][cursorField] : null;
            const endCursor = data.length > 0 ? data[data.length - 1][cursorField] : null;

            return {
                data,
                pagination: {
                    limit: parseInt(limit),
                    hasNext,
                    hasPrev: cursor !== null,
                    startCursor,
                    endCursor,
                    nextCursor: hasNext ? endCursor : null,
                    count: data.length
                }
            };

        } catch (error) {
            console.error(' Erreur pagination cursor:', error);
            throw new Error('Erreur lors de la pagination');
        }
    }

    // Pagination offset classique avec optimisations
    static async offsetPaginate(model, options = {}) {
        const {
            page = 1,
            limit = 20,
            where = {},
            include = [],
            attributes = undefined,
            order = [['created_at', 'DESC']],
            distinct = false
        } = options;

        const offset = (page - 1) * limit;

        try {
            // Pour de gros datasets, utiliser une requête optimisée
            if (offset > 10000) {
                console.warn('⚠️ Pagination offset importante détectée, considérez cursor-based');
            }

            const { count, rows } = await model.findAndCountAll({
                where,
                include,
                attributes,
                order,
                limit: parseInt(limit),
                offset,
                distinct
            });

            const totalPages = Math.ceil(count / limit);

            return {
                data: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    nextPage: page < totalPages ? page + 1 : null,
                    prevPage: page > 1 ? page - 1 : null
                }
            };

        } catch (error) {
            console.error('❌ Erreur pagination offset:', error);
            throw new Error('Erreur lors de la pagination');
        }
    }

    // Pagination hybride : cursor pour performance, offset pour navigation
    static async hybridPaginate(model, options = {}) {
        const { useCursor = true, ...otherOptions } = options;

        // Utiliser cursor-based sauf si explicitement demandé autrement
        if (useCursor && !otherOptions.page) {
            return this.cursorPaginate(model, otherOptions);
        } else {
            return this.offsetPaginate(model, otherOptions);
        }
    }
}

module.exports = PaginationService;
