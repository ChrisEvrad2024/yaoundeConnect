const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../../src/config/jwt');

class TestHelpers {

    // Créer un utilisateur de test
    static async createTestUser(userData = {}) {
        const models = require('../../src/models');
        const defaultData = {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: await bcrypt.hash('TestPassword123!', 12),
            role: 'membre',
            is_email_verified: true
        };

        return await models.User.create({ ...defaultData, ...userData });
    }

    // Créer un token JWT de test
    static createTestToken(userId, role = 'membre') {
        return jwt.sign(
            { id: userId, role },
            jwtConfig.secret,
            { expiresIn: '1h' }
        );
    }

    // Créer des données géographiques de test
    static async createTestGeoData() {
        const models = require('../../src/models');

        const country = await models.Country.create({
            code: 237,
            name: 'Cameroun Test',
            continent_name: 'Afrique',
            flag: 'cm.png'
        });
        await country.update({ translate_id: country.id });

        const town = await models.Town.create({
            name: 'Yaoundé Test',
            description: 'Ville test',
            longitude: 11.5021,
            latitude: 3.8480,
            country_id: country.id
        });
        await town.update({ translate_id: town.id });

        const quartier = await models.Quartier.create({
            name: 'Centre Test',
            description: 'Quartier test',
            longitude: 11.5021,
            latitude: 3.8480,
            town_id: town.id
        });
        await quartier.update({ translate_id: quartier.id });

        const category = await models.Category.create({
            name: 'Restaurant Test',
            slug: 'restaurant-test'
        });
        await category.update({ translate_id: category.id });

        return { country, town, quartier, category };
    }

    // Créer un POI de test
    static async createTestPOI(overrides = {}) {
        const models = require('../../src/models');
        const geoData = await this.createTestGeoData();
        const user = await this.createTestUser({ role: 'collecteur' });

        const defaultData = {
            name: 'Restaurant Test',
            description: 'Un excellent restaurant de test',
            adress: '123 Rue Test',
            latitude: 3.8480,
            longitude: 11.5021,
            quartier_id: geoData.quartier.id,
            category_id: geoData.category.id,
            user_id: user.id,
            created_by: user.id,
            status: 'pending'
        };

        const poi = await models.PointInterest.create({ ...defaultData, ...overrides });
        return { poi, user, geoData };
    }

    // Nettoyer les données de test
    static async cleanupTestData(entities = []) {
        const models = require('../../src/models');

        for (const entity of entities.reverse()) {
            try {
                if (entity && entity.id) {
                    await models[entity.constructor.name].destroy({
                        where: { id: entity.id },
                        force: true
                    });
                }
            } catch (error) {
                console.warn(`Erreur nettoyage ${entity.constructor.name}:`, error.message);
            }
        }
    }

    // Mock d'une requête Express
    static mockRequest(options = {}) {
        return {
            body: {},
            params: {},
            query: {},
            headers: {},
            user: null,
            files: null,
            ...options
        };
    }

    // Mock d'une réponse Express
    static mockResponse() {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.send = jest.fn().mockReturnValue(res);
        res.redirect = jest.fn().mockReturnValue(res);
        return res;
    }
}

module.exports = TestHelpers;
