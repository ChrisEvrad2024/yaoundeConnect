const AuthService = require('../../src/services/authService');
const { User } = require('../../src/models');
const TestHelpers = require('../helpers/testHelpers');

describe('AuthService', () => {
    let testEntities = [];

    afterEach(async () => {
        await TestHelpers.cleanupTestData(testEntities);
        testEntities = [];
    });

    describe('registerUser', () => {
        test('devrait créer un utilisateur avec des données valides', async () => {
            const userData = {
                name: 'Test User',
                email: `test${Date.now()}@example.com`,
                password: 'TestPassword123!',
                role: 'membre'
            };

            const result = await AuthService.registerUser(userData);

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe(userData.email);
            expect(result.user.name).toBe(userData.name);
            expect(result.user.role).toBe(userData.role);
            expect(result.user.is_email_verified).toBe(false);
            expect(result.emailVerificationToken).toBeDefined();
            expect(result.user.password).toBeUndefined(); // Mot de passe masqué

            testEntities.push(result.user);
        });

        test('devrait rejeter un email déjà utilisé', async () => {
            const email = `duplicate${Date.now()}@example.com`;

            const user1 = await TestHelpers.createTestUser({ email });
            testEntities.push(user1);

            await expect(AuthService.registerUser({
                name: 'Test User 2',
                email,
                password: 'TestPassword123!',
                role: 'membre'
            })).rejects.toThrow('Un utilisateur avec cet email existe déjà');
        });

        test('devrait hacher le mot de passe', async () => {
            const userData = {
                name: 'Test User',
                email: `test${Date.now()}@example.com`,
                password: 'TestPassword123!',
                role: 'membre'
            };

            const result = await AuthService.registerUser(userData);

            // Vérifier en base que le mot de passe est haché
            const userInDB = await User.findByPk(result.user.id);
            expect(userInDB.password).not.toBe(userData.password);
            expect(userInDB.password.length).toBeGreaterThan(50); // Hash bcrypt

            testEntities.push(result.user);
        });
    });

    describe('loginUser', () => {
        test('devrait connecter un utilisateur avec des identifiants valides', async () => {
            const password = 'TestPassword123!';
            const user = await TestHelpers.createTestUser({
                password: await AuthService.hashPassword(password)
            });
            testEntities.push(user);

            const result = await AuthService.loginUser(user.email, password);

            expect(result.user).toBeDefined();
            expect(result.user.id).toBe(user.id);
            expect(result.user.email).toBe(user.email);
            expect(result.token).toBeDefined();
            expect(result.user.password).toBeUndefined();
        });

        test('devrait rejeter un email incorrect', async () => {
            await expect(AuthService.loginUser(
                'inexistant@example.com',
                'password'
            )).rejects.toThrow('Email ou mot de passe incorrect');
        });

        test('devrait rejeter un mot de passe incorrect', async () => {
            const user = await TestHelpers.createTestUser();
            testEntities.push(user);

            await expect(AuthService.loginUser(
                user.email,
                'mauvais_password'
            )).rejects.toThrow('Email ou mot de passe incorrect');
        });

        test('devrait rejeter un utilisateur non vérifié', async () => {
            const user = await TestHelpers.createTestUser({
                is_email_verified: false
            });
            testEntities.push(user);

            await expect(AuthService.loginUser(
                user.email,
                'TestPassword123!'
            )).rejects.toThrow('Veuillez vérifier votre email');
        });
    });

    describe('verifyToken', () => {
        test('devrait vérifier un token valide', () => {
            const payload = { id: 1, email: 'test@example.com', role: 'membre' };
            const token = AuthService.generateToken(payload);

            const decoded = AuthService.verifyToken(token);

            expect(decoded.id).toBe(payload.id);
            expect(decoded.email).toBe(payload.email);
            expect(decoded.role).toBe(payload.role);
        });

        test('devrait rejeter un token invalide', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => {
                AuthService.verifyToken(invalidToken);
            }).toThrow('Token invalide');
        });
    });

    describe('verifyEmail', () => {
        test('devrait vérifier un email avec un token valide', async () => {
            const token = 'valid_verification_token';
            const user = await TestHelpers.createTestUser({
                is_email_verified: false,
                email_verification_token: token,
                email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
            testEntities.push(user);

            const result = await AuthService.verifyEmail(token);

            expect(result.id).toBe(user.id);
            expect(result.is_email_verified).toBe(true);
            expect(result.email_verification_token).toBeNull();
        });

        test('devrait rejeter un token expiré', async () => {
            const token = 'expired_token';
            const user = await TestHelpers.createTestUser({
                is_email_verified: false,
                email_verification_token: token,
                email_verification_expires: new Date(Date.now() - 1000) // Expiré
            });
            testEntities.push(user);

            await expect(AuthService.verifyEmail(token))
                .rejects.toThrow('Token de vérification invalide ou expiré');
        });
    });
});
