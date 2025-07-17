const authMiddleware = require('../../src/middlewares/authMiddleware');
const TestHelpers = require('../helpers/testHelpers');

describe('authMiddleware', () => {
    let testEntities = [];

    afterEach(async () => {
        await TestHelpers.cleanupTestData(testEntities);
        testEntities = [];
    });

    test('devrait authentifier avec un token valide', async () => {
        const user = await TestHelpers.createTestUser();
        testEntities.push(user);

        const token = TestHelpers.createTestToken(user.id, user.role);

        const req = TestHelpers.mockRequest({
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        const res = TestHelpers.mockResponse();
        const next = jest.fn();

        await authMiddleware(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(user.id);
        expect(next).toHaveBeenCalled();
    });

    test('devrait rejeter une requête sans token', async () => {
        const req = TestHelpers.mockRequest({
            headers: {}
        });
        const res = TestHelpers.mockResponse();
        const next = jest.fn();

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 401,
                detail: expect.stringContaining('Token d\'authentification manquant')
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('devrait rejeter un token invalide', async () => {
        const req = TestHelpers.mockRequest({
            headers: {
                authorization: 'Bearer invalid.token.here'
            }
        });
        const res = TestHelpers.mockResponse();
        const next = jest.fn();

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 401,
                detail: expect.stringContaining('invalide ou expiré')
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('devrait rejeter un utilisateur avec email non vérifié', async () => {
        const user = await TestHelpers.createTestUser({
            is_email_verified: false
        });
        testEntities.push(user);

        const token = TestHelpers.createTestToken(user.id, user.role);

        const req = TestHelpers.mockRequest({
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        const res = TestHelpers.mockResponse();
        const next = jest.fn();

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: expect.stringContaining('vérifier votre email')
            })
        );
    });
});
