const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../helpers/testHelpers');

describe('Integration - Auth Endpoints', () => {
    let testEntities = [];

    afterEach(async () => {
        await TestHelpers.cleanupTestData(testEntities);
        testEntities = [];
    });

    describe('POST /api/auth/register', () => {
        test('devrait créer un utilisateur valide', async () => {
            const userData = {
                name: 'Test Integration',
                email: `integration${Date.now()}@example.com`,
                password: 'TestPassword123!',
                role: 'collecteur'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.role).toBe(userData.role);
            expect(response.body.user.password).toBeUndefined();

            // Nettoyer
            const { User } = require('../../src/models');
            const user = await User.findByPk(response.body.user.id);
            if (user) testEntities.push(user);
        });

        test('devrait valider les données d\'entrée', async () => {
            const invalidData = {
                name: '', // Vide
                email: 'invalid-email',
                password: '123' // Trop court
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidData)
                .expect(400);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.length).toBeGreaterThan(0);
        });

        test('devrait rejeter un email en double', async () => {
            const email = `duplicate${Date.now()}@example.com`;

            // Première inscription
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'First User',
                    email,
                    password: 'TestPassword123!',
                    role: 'membre'
                })
                .expect(201);

            // Deuxième inscription (devrait échouer)
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Second User',
                    email,
                    password: 'TestPassword123!',
                    role: 'membre'
                })
                .expect(409);

            expect(response.body.detail).toContain('existe déjà');

            // Nettoyer
            const { User } = require('../../src/models');
            const user = await User.findOne({ where: { email } });
            if (user) testEntities.push(user);
        });
    });

    describe('POST /api/auth/login', () => {
        test('devrait connecter un utilisateur valide', async () => {
            const user = await TestHelpers.createTestUser();
            testEntities.push(user);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user.email,
                    password: 'TestPassword123!'
                })
                .expect(200);

            expect(response.body.token).toBeDefined();
            expect(response.body.user.id).toBe(user.id);
            expect(response.body.user.password).toBeUndefined();
        });

        test('devrait rejeter des identifiants invalides', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'inexistant@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.detail).toContain('Email ou mot de passe incorrect');
        });

        test('devrait rejeter un utilisateur non vérifié', async () => {
            const user = await TestHelpers.createTestUser({
                is_email_verified: false
            });
            testEntities.push(user);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user.email,
                    password: 'TestPassword123!'
                })
                .expect(401);

            expect(response.body.detail).toContain('vérifier votre email');
        });
    });

    describe('GET /api/auth/me', () => {
        test('devrait retourner le profil avec un token valide', async () => {
            const user = await TestHelpers.createTestUser();
            const token = TestHelpers.createTestToken(user.id, user.role);
            testEntities.push(user);

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.user.id).toBe(user.id);
            expect(response.body.user.email).toBe(user.email);
        });

        test('devrait rejeter sans token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body.detail).toContain('Token d\'authentification manquant');
        });
    });
});
