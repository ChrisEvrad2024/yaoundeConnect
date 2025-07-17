const POIService = require('../../src/services/poiService');
const TestHelpers = require('../helpers/testHelpers');

describe('POIService', () => {
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

            const poiData = {
                name: 'Restaurant Test Service',
                description: 'Description complète du restaurant',
                adress: '123 Avenue Test',
                latitude: 3.8480,
                longitude: 11.5021,
                quartier_id: geoData.quartier.id,
                category_id: geoData.category.id,
                is_restaurant: 1
            };

            const poi = await POIService.createPOI(poiData, user.id);

            expect(poi.name).toBe(poiData.name);
            expect(poi.description).toBe(poiData.description);
            expect(poi.created_by).toBe(user.id);
            expect(poi.status).toBe('pending');
            expect(poi.Category).toBeDefined();
            expect(poi.Quartier).toBeDefined();

            testEntities.push(poi);
        });

        test('devrait rejeter des coordonnées invalides', async () => {
            const geoData = await TestHelpers.createTestGeoData();
            const user = await TestHelpers.createTestUser({ role: 'collecteur' });
            testEntities.push(geoData.country, geoData.town, geoData.quartier, geoData.category, user);

            const poiData = {
                name: 'Restaurant Test',
                description: 'Description test',
                adress: '123 Avenue Test',
                latitude: 200, // Invalide
                longitude: 500, // Invalide
                quartier_id: geoData.quartier.id,
                category_id: geoData.category.id
            };

            await expect(POIService.createPOI(poiData, user.id))
                .rejects.toThrow('Latitude doit être entre -90 et 90');
        });

        test('devrait rejeter un quartier inexistant', async () => {
            const geoData = await TestHelpers.createTestGeoData();
            const user = await TestHelpers.createTestUser({ role: 'collecteur' });
            testEntities.push(geoData.country, geoData.town, geoData.quartier, geoData.category, user);

            const poiData = {
                name: 'Restaurant Test',
                description: 'Description test',
                adress: '123 Avenue Test',
                latitude: 3.8480,
                longitude: 11.5021,
                quartier_id: 99999, // Inexistant
                category_id: geoData.category.id
            };

            await expect(POIService.createPOI(poiData, user.id))
                .rejects.toThrow('Quartier non trouvé');
        });
    });

    describe('getPOIById', () => {
        test('devrait récupérer un POI avec ses relations', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI();
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const result = await POIService.getPOIById(poi.id, true);

            expect(result.id).toBe(poi.id);
            expect(result.name).toBe(poi.name);
            expect(result.Category).toBeDefined();
            expect(result.Quartier).toBeDefined();
            expect(result.creator).toBeDefined();
            expect(result.creator.id).toBe(user.id);
        });

        test('devrait rejeter un POI inexistant', async () => {
            await expect(POIService.getPOIById(99999))
                .rejects.toThrow('Point d\'intérêt non trouvé');
        });
    });

    describe('updatePOI', () => {
        test('devrait permettre au créateur de modifier son POI', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI();
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const updateData = {
                name: 'Nom modifié',
                description: 'Description modifiée'
            };

            const updatedPOI = await POIService.updatePOI(
                poi.id,
                updateData,
                user.id,
                user.role
            );

            expect(updatedPOI.name).toBe(updateData.name);
            expect(updatedPOI.description).toBe(updateData.description);
        });

        test('devrait rejeter la modification par un autre utilisateur', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI();
            const otherUser = await TestHelpers.createTestUser();
            testEntities.push(poi, user, otherUser, geoData.country, geoData.town, geoData.quartier, geoData.category);

            await expect(POIService.updatePOI(
                poi.id,
                { name: 'Tentative modification' },
                otherUser.id,
                otherUser.role
            )).rejects.toThrow('Vous n\'avez pas la permission');
        });

        test('devrait permettre à un modérateur de modifier', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI();
            const moderator = await TestHelpers.createTestUser({ role: 'moderateur' });
            testEntities.push(poi, user, moderator, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const updateData = { name: 'Modifié par modérateur' };

            const updatedPOI = await POIService.updatePOI(
                poi.id,
                updateData,
                moderator.id,
                moderator.role
            );

            expect(updatedPOI.name).toBe(updateData.name);
        });
    });

    describe('searchPOI', () => {
        test('devrait rechercher des POI par nom', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI({
                name: 'Restaurant Unique Test',
                status: 'approved'
            });
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const result = await POIService.searchPOI({
                q: 'Unique',
                status: 'approved'
            });

            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toContain('Unique');
            expect(result.pagination.total).toBe(1);
        });

        test('devrait filtrer par catégorie', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI({
                status: 'approved'
            });
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const result = await POIService.searchPOI({
                category_id: geoData.category.id,
                status: 'approved'
            });

            expect(result.data.length).toBeGreaterThan(0);
            expect(result.data[0].Category.id).toBe(geoData.category.id);
        });

        test('devrait paginer les résultats', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI({
                status: 'approved'
            });
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const result = await POIService.searchPOI({
                page: 1,
                limit: 5,
                status: 'approved'
            });

            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(5);
            expect(result.data.length).toBeLessThanOrEqual(5);
        });
    });

    describe('findNearbyPOI', () => {
        test('devrait trouver des POI à proximité', async () => {
            const { poi, user, geoData } = await TestHelpers.createTestPOI({
                latitude: 3.8480,
                longitude: 11.5021,
                status: 'approved'
            });
            testEntities.push(poi, user, geoData.country, geoData.town, geoData.quartier, geoData.category);

            const result = await POIService.findNearbyPOI(
                3.8480, // Centre de recherche
                11.5021,
                10, // Rayon 10km
                20  // Limite 20 résultats
            );

            expect(result).toBeInstanceOf(Array);
            if (result.length > 0) {
                expect(result[0].distance).toBeDefined();
                expect(result[0].distance).toBeGreaterThanOrEqual(0);
            }
        });

        test('devrait rejeter des coordonnées invalides', async () => {
            await expect(POIService.findNearbyPOI(200, 500, 5, 10))
                .rejects.toThrow('Latitude doit être entre -90 et 90');
        });
    });
});
