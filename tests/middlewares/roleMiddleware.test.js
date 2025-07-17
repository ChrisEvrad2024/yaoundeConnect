const roleMiddleware = require('../../src/middlewares/roleMiddleware');
const TestHelpers = require('../helpers/testHelpers');

describe('roleMiddleware', () => {
    test('devrait autoriser un rôle correct', () => {
        const user = { id: 1, role: 'moderateur' };
        const middleware = roleMiddleware.moderateur;

        const req = TestHelpers.mockRequest({ user });
        const res = TestHelpers.mockResponse();
        const next = jest.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('devrait rejeter un rôle insuffisant', () => {
        const user = { id: 1, role: 'membre' };
        const middleware = roleMiddleware.moderateur;

        const req = TestHelpers.mockRequest({ user });
        const res = TestHelpers.mockResponse();
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 403,
                detail: expect.stringContaining('Rôle requis')
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('devrait rejeter sans utilisateur', () => {
        const middleware = roleMiddleware.moderateur;

        const req = TestHelpers.mockRequest({ user: null });
        const res = TestHelpers.mockResponse();
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('devrait accepter plusieurs rôles', () => {
        const adminUser = { id: 1, role: 'admin' };
        const superadminUser = { id: 2, role: 'superadmin' };
        const middleware = roleMiddleware.admin;

        // Test admin
        const req1 = TestHelpers.mockRequest({ user: adminUser });
        const res1 = TestHelpers.mockResponse();
        const next1 = jest.fn();

        middleware(req1, res1, next1);
        expect(next1).toHaveBeenCalled();

        // Test superadmin (inclus dans admin)
        const req2 = TestHelpers.mockRequest({ user: superadminUser });
        const res2 = TestHelpers.mockResponse();
        const next2 = jest.fn();

        middleware(req2, res2, next2);
        expect(next2).toHaveBeenCalled();
    });
});
