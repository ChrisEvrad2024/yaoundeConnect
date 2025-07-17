const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../helpers/testHelpers');

describe('Integration - POI Endpoints', () => {
    let testEntities = [];

    afterEach(async () => {
        await TestHelpers.cleanupTestData(testEntities);
        testEntities = [];
    });

    describe('GET /api/poi', () => {
        test('devrait retourner la liste des POI', async () => {
            const response = await request(app)
                .get('/api/poi')
                .query({ limit: 5 })
                .expect(200);

            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.limit).toBe(5);
        });

        test('devrait filtrer par quartier', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI({
                status: 'approved'
            });
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const response = await request(app)
                .get('/api/poi')
                .query({
                    quartier_id: geoData.quartier.id,
                    status: 'approved'
                })
                .expect(200);

            if (response.body.data.length > 0) {
                expect(response.body.data[0].Quartier.id).toBe(geoData.quartier.id);
            }
        });

        test('devrait rechercher par nom', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI({
                name: 'Restaurant Recherche Test',
                status: 'approved'
            });
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const response = await request(app)
                .get('/api/poi')
                .query({
                    q: 'Recherche',
                    status: 'approved'
                })
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].name).toContain('Recherche');
        });
    });

    describe('GET /api/poi/nearby', () => {
        test('devrait trouver des POI à proximité', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI({
                latitude: 3.8480,
                longitude: 11.5021,
                status: 'approved'
            });
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const response = await request(app)
                .get('/api/poi/nearby')
                .query({
                    latitude: 3.8480,
                    longitude: 11.5021,
                    radius: 10
                })
                .expect(200);

            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.center.latitude).toBe(3.8480);
            expect(response.body.center.longitude).toBe(11.5021);
        });

        test('devrait valider les coordonnées', async () => {
            const response = await request(app)
                .get('/api/poi/nearby')
                .query({
                    latitude: 200, // Invalide
                    longitude: 500  // Invalide
                })
                .expect(400);

            expect(response.body.detail).toContain('Coordonnées');
        });
    });

    describe('POST /api/poi', () => {
        test('devrait créer un POI avec des données valides', async () => {
            const geoData = await TestHelpers.createTestGeoData();
            const user = await TestHelpers.createTestUser({ role: 'collecteur' });
            const token = TestHelpers.createTestToken(user.id, user.role);
            testEntities.push(geoData.country, geoData.town, geoData.quartier, geoData.category, user);

            const poiData = {
                name: 'Restaurant API Test',
                description: 'Restaurant créé via test d\'intégration API',
                adress: '123 Avenue API Test',
                latitude: 3.8480,
                longitude: 11.5021,
                quartier_id: geoData.quartier.id,
                category_id: geoData.category.id,
                is_restaurant: 1
            };

            const response = await request(app)
                .post('/api/poi')
                .set('Authorization', `Bearer ${token}`)
                .send(poiData)
                .expect(201);

            expect(response.body.data.name).toBe(poiData.name);
            expect(response.body.data.created_by).toBe(user.id);
            expect(response.body.data.status).toBe('pending');

            // Nettoyer
            const { PointInterest } = require('../../src/models');
            const poi = await PointInterest.findByPk(response.body.data.id);
            if (poi) testEntities.push(poi);
        });

        test('devrait rejeter sans authentification', async () => {
            const response = await request(app)
                .post('/api/poi')
                .send({
                    name: 'Test POI',
                    description: 'Test description'
                })
                .expect(401);

            expect(response.body.detail).toContain('Token d\'authentification manquant');
        });

        test('devrait rejeter avec un rôle insuffisant', async () => {
            const user = await TestHelpers.createTestUser({ role: 'membre' });
            const token = TestHelpers.createTestToken(user.id, user.role);
            testEntities.push(user);

            const response = await request(app)
                .post('/api/poi')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test POI',
                    description: 'Test description'
                })
                .expect(403);

            expect(response.body.detail).toContain('Rôle requis');
        });
    });

    describe('GET /api/poi/:id', () => {
        test('devrait récupérer un POI existant', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI();
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const response = await request(app)
                .get(`/api/poi/${poi.id}`)
                .expect(200);

            expect(response.body.data.id).toBe(poi.id);
            expect(response.body.data.name).toBe(poi.name);
            expect(response.body.data.Category).toBeDefined();
            expect(response.body.data.Quartier).toBeDefined();
        });

        test('devrait retourner 404 pour un POI inexistant', async () => {
            const response = await request(app)
                .get('/api/poi/999999')
                .expect(404);

            expect(response.body.detail).toContain('n\'existe pas');
        });
    });
});