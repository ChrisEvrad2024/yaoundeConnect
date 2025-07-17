const { sequelize } = require('../src/config/database');

// Configuration globale pour tous les tests
beforeAll(async () => {
    // Connecter à la base de données de test
    try {
        await sequelize.authenticate();
        console.log('🔗 Base de données de test connectée');
    } catch (error) {
        console.error('❌ Erreur connexion DB test:', error);
        throw error;
    }
});

afterAll(async () => {
    // Fermer les connexions
    await sequelize.close();
    console.log('🔌 Connexions fermées');
});

// Nettoyer après chaque test
afterEach(async () => {
    // Optionnel : nettoyer les données de test
    jest.clearAllMocks();
});

// Mocks globaux
jest.mock('../src/services/emailService', () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/services/notificationService', () => ({
    notifyPOICreated: jest.fn().mockResolvedValue(true),
    notifyPOIApproval: jest.fn().mockResolvedValue(true),
    notifyPOIRejection: jest.fn().mockResolvedValue(true),
    notifyCommentAdded: jest.fn().mockResolvedValue(true)
}));
