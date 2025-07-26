// src/utils/createSuperAdmin.js
require('dotenv').config();
const { User } = require('../models');
const AuthService = require('../services/authService');

async function createSuperAdmin() {
  try {
    console.log('🔧 Création du Super Admin...');

    // Vérifier si le super admin existe déjà
    const existingSuperAdmin = await User.findOne({
      where: { email: 'test@gmail.com' }
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Le Super Admin existe déjà!');
      console.log(`   Nom: ${existingSuperAdmin.name}`);
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Rôle: ${existingSuperAdmin.role}`);
      console.log(`   Email vérifié: ${existingSuperAdmin.is_email_verified}`);
      return existingSuperAdmin;
    }

    // Hacher le mot de passe
    const hashedPassword = await AuthService.hashPassword('passWord123!');

    // Créer le super admin
    const superAdmin = await User.create({
      name: 'TestAdmin',
      email: 'test@gmail.com',
      password: hashedPassword,
      role: 'superadmin',
      is_email_verified: true, // Déjà vérifié
      email_verification_token: null,
      email_verification_expires: null
    });

    console.log('✅ Super Admin créé avec succès!');
    console.log(`   ID: ${superAdmin.id}`);
    console.log(`   Nom: ${superAdmin.name}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Rôle: ${superAdmin.role}`);
    console.log(`   Email vérifié: ${superAdmin.is_email_verified}`);

    // Générer un token pour test
    const token = AuthService.generateToken({
      id: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role
    });

    console.log('\n🔑 Token de test généré:');
    console.log(token);

    console.log('\n📝 Informations de connexion:');
    console.log('   Email: test@gmail.com');
    console.log('   Mot de passe: passWord123!');

    return superAdmin;
  } catch (error) {
    console.error('❌ Erreur lors de la création du Super Admin:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createSuperAdmin()
    .then(() => {
      console.log('\n🎉 Script terminé avec succès!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script échoué:', error);
      process.exit(1);
    });
}

module.exports = createSuperAdmin;
