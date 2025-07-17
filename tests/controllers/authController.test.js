const AuthController = require('../../src/controllers/authController');
const TestHelpers = require('../helpers/testHelpers');

describe('AuthController', () => {
    let testEntities = [];

    afterEach(async () => {
        await TestHelpers.cleanupTestData(testEntities);
        testEntities = [];
    });

    describe('register', () => {
        test('devrait traiter une inscription valide', async () => {
            const req = TestHelpers.mockRequest({
                body: {
                    name: 'Test User Controller',
                    email: `test${Date.now()}@example.com`,
                    password: 'TestPassword123!',
                    role: 'collecteur'
                }
            });
            const res = TestHelpers.mockResponse();

            await AuthController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Inscription réussie'),
                    user: expect.objectContaining({
                        email: req.body.email,
                        role: req.body.role
                    })
                })
            );

            // Nettoyer l'utilisateur créé
            const jsonCall = res.json.mock.calls[0][0];
            if (jsonCall.user) {
                const { User } = require('../../src/models');
                const user = await User.findByPk(jsonCall.user.id);
                if (user) testEntities.push(user);
            }
        });

        test('devrait gérer les erreurs de validation', async () => {
            const req = TestHelpers.mockRequest({
                body: {
                    name: '', // Nom vide
                    email: 'email-invalide',
                    password: '123' // Trop court
                }
            });
            const res = TestHelpers.mockResponse();

            await AuthController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: expect.stringContaining('500'),
                    title: expect.stringContaining('Erreur')
                })
            );
        });
    });

    describe('login', () => {
        test('devrait traiter une connexion valide', async () => {
            const user = await TestHelpers.createTestUser();
            testEntities.push(user);

            const req = TestHelpers.mockRequest({
                body: {
                    email: user.email,
                    password: 'TestPassword123!'
                }
            });
            const res = TestHelpers.mockResponse();

            await AuthController.login(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Connexion réussie',
                    user: expect.objectContaining({
                        id: user.id,
                        email: user.email
                    }),
                    token: expect.any(String)
                })
            );
        });

        test('devrait rejeter des identifiants invalides', async () => {
            const req = TestHelpers.mockRequest({
                body: {
                    email: 'inexistant@example.com',
                    password: 'password'
                }
            });
            const res = TestHelpers.mockResponse();

            await AuthController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 401,
                    detail: 'Email ou mot de passe incorrect'
                })
            );
        });
    });

    describe('getProfile', () => {
        test('devrait retourner le profil utilisateur', async () => {
            const user = await TestHelpers.createTestUser();
            testEntities.push(user);

            const req = TestHelpers.mockRequest({
                user: user
            });
            const res = TestHelpers.mockResponse();

            await AuthController.getProfile(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: expect.objectContaining({
                        id: user.id,
                        email: user.email,
                        name: user.name
                    })
                })
            );
        });
    });
});
