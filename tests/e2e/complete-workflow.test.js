const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../helpers/testHelpers');

describe('E2E - Complete Workflow', () => {
    let testEntities = [];
    let authTokens = {};

    beforeAll(async () => {
        // Créer les données géographiques de base
        const geoData = await TestHelpers.createTestGeoData();
        testEntities.push(geoData.country, geoData.town, geoData.quartier, geoData.category);
    });

    afterAll(async () => {
        await TestHelpers.cleanupTestData(testEntities);
    });

    test('Workflow complet : Inscription → Création POI → Modération → Commentaires', async () => {
        // 1. Inscription collecteur
        const collecteurData = {
            name: 'Collecteur E2E',
            email: `collecteur.e2e.${Date.now()}@example.com`,
            password: 'TestPassword123!',
            role: 'collecteur'
        };

        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(collecteurData)
            .expect(201);

        const collecteur = registerResponse.body.user;
        testEntities.push(collecteur);

        // Simuler vérification email
        const { User } = require('../../src/models');
        await User.update(
            { is_email_verified: true },
            { where: { id: collecteur.id } }
        );

        // 2. Connexion collecteur
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: collecteurData.email,
                password: collecteurData.password
            })
            .expect(200);

        authTokens.collecteur = loginResponse.body.token;

        // 3. Création POI
        const poiData = {
            name: 'Restaurant E2E Test',
            description: 'Restaurant créé dans le test E2E complet',
            adress: '123 Avenue E2E Test',
            latitude: 3.8480,
            longitude: 11.5021,
            quartier_id: testEntities.find(e => e.constructor.name === 'Quartier').id,
            category_id: testEntities.find(e => e.constructor.name === 'Category').id,
            is_restaurant: 1
        };

        const createPOIResponse = await request(app)
            .post('/api/poi')
            .set('Authorization', `Bearer ${authTokens.collecteur}`)
            .send(poiData)
            .expect(201);

        const poi = createPOIResponse.body.data;
        testEntities.push(poi);

        expect(poi.status).toBe('pending');

        // 4. Inscription modérateur
        const moderateurData = {
            name: 'Moderateur E2E',
            email: `moderateur.e2e.${Date.now()}@example.com`,
            password: 'TestPassword123!',
            role: 'moderateur'
        };

        const registerModResponse = await request(app)
            .post('/api/auth/register')
            .send(moderateurData)
            .expect(201);

        const moderateur = registerModResponse.body.user;
        testEntities.push(moderateur);

        // Simuler vérification email modérateur
        await User.update(
            { is_email_verified: true },
            { where: { id: moderateur.id } }
        );

        // 5. Connexion modérateur
        const loginModResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: moderateurData.email,
                password: moderateurData.password
            })
            .expect(200);

        authTokens.moderateur = loginModResponse.body.token;

        // 6. Liste POI en attente
        const pendingResponse = await request(app)
            .get('/api/moderation/pending')
            .set('Authorization', `Bearer ${authTokens.moderateur}`)
            .expect(200);

        expect(pendingResponse.body.data).toContainEqual(
            expect.objectContaining({ id: poi.id })
        );

        // 7. Approbation POI
        const approveResponse = await request(app)
            .post(`/api/moderation/poi/${poi.id}/approve`)
            .set('Authorization', `Bearer ${authTokens.moderateur}`)
            .send({
                comments: 'POI validé dans le test E2E'
            })
            .expect(200);

        expect(approveResponse.body.data.status).toBe('approved');

        // 8. Vérification POI approuvé
        const poiResponse = await request(app)
            .get(`/api/poi/${poi.id}`)
            .expect(200);

        expect(poiResponse.body.data.status).toBe('approved');

        // 9. Ajout commentaire
        const commentResponse = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${authTokens.collecteur}`)
            .send({
                content: 'Excellent restaurant testé dans le workflow E2E !',
                poi_id: poi.id
            })
            .expect(201);

        const comment = commentResponse.body.data;
        testEntities.push(comment);

        // 10. Notation POI
        const ratingResponse = await request(app)
            .post(`/api/ratings/poi/${poi.id}/rate`)
            .set('Authorization', `Bearer ${authTokens.collecteur}`)
            .send({
                rating: 5
            })
            .expect(200);

        expect(ratingResponse.body.data.new_rating).toBe(5);

        // 11. Vérification stats finales
        const statsResponse = await request(app)
            .get('/api/moderation/stats')
            .set('Authorization', `Bearer ${authTokens.moderateur}`)
            .expect(200);

        expect(statsResponse.body.data.approvals).toBeGreaterThan(0);

        console.log('✅ Workflow E2E complet terminé avec succès !');
    });
});
