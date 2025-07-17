const POIController = require('../../src/controllers/poiController');
const TestHelpers = require('../helpers/testHelpers');

describe('POIController', () => {
    let testEntities = [];

    afterEach(async () => {
        await TestHelpers.cleanupTestData(testEntities);
        testEntities = [];
    });

    describe('createPOI', () => {
        test('devrait créer un POI avec des données valides', async () => {
            const geoData = await TestHelpers.createTestGeoData();
            const user = await TestHelpers.createTestUser({ role: 'collecteur' });
            testEntities.push(geoData.country, geoData.town, geoData.quartier, geoData.category, user);

            const req = TestHelpers.mockRequest({
                user: user,
                body: {
                    name: 'Restaurant Controller Test',
                    description: 'Description du restaurant de test',
                    adress: '123 Avenue Controller',
                    latitude: 3.8480,
                    longitude: 11.5021,
                    quartier_id: geoData.quartier.id,
                    category_id: geoData.category.id,
                    is_restaurant: 1
                },
                files: []
            });
            const res = TestHelpers.mockResponse();

            await POIController.createPOI(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('créé avec succès'),
                    data: expect.objectContaining({
                        name: req.body.name,
                        created_by: user.id
                    })
                })
            );

            // Nettoyer le POI créé
            const jsonCall = res.json.mock.calls[0][0];
            if (jsonCall.data) {
                const { PointInterest } = require('../../src/models');
                const poi = await PointInterest.findByPk(jsonCall.data.id);
                if (poi) testEntities.push(poi);
            }
        });

        test('devrait rejeter des données invalides', async () => {
            const user = await TestHelpers.createTestUser({ role: 'collecteur' });
            testEntities.push(user);

            const req = TestHelpers.mockRequest({
                user: user,
                body: {
                    name: 'Test',
                    // Données incomplètes
                },
                files: []
            });
            const res = TestHelpers.mockResponse();

            await POIController.createPOI(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 404,
                    detail: expect.stringContaining('non trouvé')
                })
            );
        });
    });

    describe('getPOI', () => {
        test('devrait récupérer un POI existant', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI();
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const req = TestHelpers.mockRequest({
                params: { id: poi.id.toString() }
            });
            const res = TestHelpers.mockResponse();

            await POIController.getPOI(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        id: poi.id,
                        name: poi.name
                    })
                })
            );
        });

        test('devrait retourner 404 pour un POI inexistant', async () => {
            const req = TestHelpers.mockRequest({
                params: { id: '99999' }
            });
            const res = TestHelpers.mockResponse();

            await POIController.getPOI(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('updatePOI', () => {
        test('devrait permettre au créateur de modifier', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI();
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const req = TestHelpers.mockRequest({
                params: { id: poi.id.toString() },
                user: user,
                body: {
                    name: 'Nom modifié',
                    description: 'Description modifiée'
                }
            });
            const res = TestHelpers.mockResponse();

            await POIController.updatePOI(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('mis à jour'),
                    data: expect.objectContaining({
                        name: 'Nom modifié'
                    })
                })
            );
        });
    });

    describe('searchPOI', () => {
        test('devrait rechercher des POI', async () => {
            const req = TestHelpers.mockRequest({
                query: {
                    page: '1',
                    limit: '10'
                }
            });
            const res = TestHelpers.mockResponse();

            await POIController.searchPOI(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('succès'),
                    data: expect.any(Array),
                    pagination: expect.objectContaining({
                        page: 1,
                        limit: 10
                    })
                })
            );
        });
    });
});
