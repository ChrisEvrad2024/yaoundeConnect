const { User } = require('../models');
const AuthService = require('../services/authService');

const setupTestUser = async () => {
  try {
    console.log('🔧 Configuration utilisateur de test...');

    // Supprimer les utilisateurs existants
    await User.destroy({
      where: {
        email: [
          'test.postman@example.com',
          'chrisomgba04@gmail.com',
          'moderator.postman@example.com'
        ]
      }
    });

    // Créer utilisateur collecteur
    const hashedPassword = await AuthService.hashPassword('TestPassword123!');

    const user = await User.create({
      name: 'Test User Postman',
      email: 'test.postman@example.com',
      password: hashedPassword,
      role: 'collecteur',
      is_email_verified: true // ← Pré-vérifié pour éviter les emails
    });

    // Créer modérateur de test
    const moderator = await User.create({
      name: 'Moderator Postman',
      email: 'moderator.postman@example.com',
      password: hashedPassword,
      role: 'moderateur',
      is_email_verified: true
    });

    console.log('✅ Utilisateurs de test créés et vérifiés');
    console.log('\n📋 Identifiants pour Postman:');
    console.log('👤 Collecteur:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Mot de passe: TestPassword123!`);
    console.log(`   ID: ${user.id}`);
    console.log('\n🛡️ Modérateur:');
    console.log(`   Email: ${moderator.email}`);
    console.log(`   Mot de passe: TestPassword123!`);
    console.log(`   ID: ${moderator.id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur setup:', error);
    process.exit(1);
  }
};

setupTestUser();
