// src/utils/createAdmin.js - SCRIPT DE CRÉATION D'ADMIN
require('dotenv').config();
const { User } = require('../models');
const AuthService = require('../services/authService');

async function createAdmin() {
  try {
    console.log('🔧 Début création Admin...');

    // Configuration de l'admin
    const ADMIN_CONFIG = {
      name: 'OMGBA_ADMIN',
      email: 'omgbaomgba79@gmail.com',
      password: 'passWord123!',
      role: 'admin'
    };

    console.log(`📧 Email cible: ${ADMIN_CONFIG.email}`);

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({
      where: { email: ADMIN_CONFIG.email }
    });

    if (existingAdmin) {
      console.log("⚠️  L'Admin existe déjà!");
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Nom: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Rôle: ${existingAdmin.role}`);
      console.log(`   Email vérifié: ${existingAdmin.is_email_verified}`);

      // Générer un token pour l'utilisateur existant
      const token = AuthService.generateToken({
        id: existingAdmin.id,
        email: existingAdmin.email,
        role: existingAdmin.role
      });

      console.log('\n🔑 Token pour utilisateur existant:');
      console.log(token);

      return existingAdmin;
    }

    console.log('👤 Aucun Admin trouvé, création en cours...');

    // Hacher le mot de passe
    console.log('🔒 Hachage du mot de passe...');
    const hashedPassword = await AuthService.hashPassword(ADMIN_CONFIG.password);
    console.log('✅ Mot de passe haché avec succès');

    // Créer l'admin
    console.log('💾 Création en base de données...');
    const admin = await User.create({
      name: ADMIN_CONFIG.name,
      email: ADMIN_CONFIG.email,
      password: hashedPassword,
      role: ADMIN_CONFIG.role,
      is_email_verified: true, // Déjà vérifié
      email_verification_token: null,
      email_verification_expires: null
    });

    console.log('✅ Admin créé avec succès!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Nom: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Rôle: ${admin.role}`);
    console.log(`   Email vérifié: ${admin.is_email_verified}`);

    // Générer un token pour test
    const token = AuthService.generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role
    });

    console.log('\n🔑 Token de test généré:');
    console.log(token);

    console.log('\n📝 Informations de connexion:');
    console.log(`   Email: ${ADMIN_CONFIG.email}`);
    console.log(`   Mot de passe: ${ADMIN_CONFIG.password}`);

    return admin;
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'Admin:", error);

    // Afficher plus de détails sur l'erreur
    if (error.name === 'SequelizeValidationError') {
      console.error('❌ Erreurs de validation:');
      error.errors.forEach((err) => {
        console.error(`   - ${err.path}: ${err.message}`);
      });
    }

    if (error.name === 'SequelizeConnectionError') {
      console.error('❌ Erreur de connexion à la base de données');
      console.error('   Vérifiez votre configuration DB dans .env');
    }

    throw error;
  }
}

// ====================================================================
// 🧪 SCRIPT DE DIAGNOSTIC COMPLET
// ====================================================================

async function runDiagnostics() {
  try {
    console.log('🔍 DÉBUT DU DIAGNOSTIC ADMIN');
    console.log('='.repeat(50));

    // 1. Test de connexion à la BD
    console.log('\n1. 📡 Test connexion base de données...');
    const { sequelize } = require('../config/database');
    await sequelize.authenticate();
    console.log('✅ Connexion BD réussie');

    // 2. Test du modèle User
    console.log('\n2. 👤 Test modèle User...');
    const userCount = await User.count();
    console.log(`✅ Modèle User fonctionnel (${userCount} utilisateurs en BD)`);

    // 3. Test du service Auth
    console.log('\n3. 🔒 Test service AuthService...');
    const testHash = await AuthService.hashPassword('test123');
    console.log('✅ Service AuthService fonctionnel');

    // 4. Vérifier si l'utilisateur existe déjà
    console.log('\n4. 🔍 Vérification utilisateur admin existant...');
    const existingUser = await User.findOne({
      where: { email: 'omgbaomgba79@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️  Utilisateur admin existe déjà:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Nom: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Rôle: ${existingUser.role}`);
      return existingUser;
    } else {
      console.log('✅ Aucun utilisateur avec cet email');
    }

    // 5. Test de création
    console.log('\n5. 🔧 Test création Admin...');
    const admin = await createAdmin();

    console.log('\n🎉 DIAGNOSTIC ADMIN TERMINÉ AVEC SUCCÈS');
    return admin;
  } catch (error) {
    console.error('\n❌ ERREUR DANS LE DIAGNOSTIC:');
    console.error('Type:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// ====================================================================
// 📋 SCRIPT DE NETTOYAGE (si nécessaire)
// ====================================================================

async function cleanupAndRecreate() {
  try {
    console.log('🧹 NETTOYAGE ET RECRÉATION ADMIN');

    // Supprimer l'utilisateur existant si nécessaire
    const deleted = await User.destroy({
      where: { email: 'omgbaomgba79@gmail.com' }
    });

    if (deleted > 0) {
      console.log(`✅ ${deleted} utilisateur(s) admin supprimé(s)`);
    } else {
      console.log('ℹ️  Aucun utilisateur admin à supprimer');
    }

    // Créer le nouvel admin
    const admin = await createAdmin();

    return admin;
  } catch (error) {
    console.error('❌ Erreur nettoyage admin:', error);
    throw error;
  }
}

// ====================================================================
// 🚀 FONCTIONS D'EXÉCUTION
// ====================================================================

// Fonction principale avec gestion d'erreurs améliorée
async function main() {
  try {
    console.log('🚀 CRÉATION ADMIN - VERSION COMPLÈTE');
    console.log('='.repeat(60));

    // Option 1: Diagnostic complet
    const result = await runDiagnostics();

    console.log('\n🎉 SUCCÈS ADMIN!');
    console.log(`Admin ID: ${result.id}`);
  } catch (error) {
    console.error('\n💥 ÉCHEC DE LA CRÉATION ADMIN');
    console.error('Erreur:', error.message);

    // Proposer des solutions
    console.log('\n🔧 SOLUTIONS POSSIBLES:');

    if (
      error.message.includes('already exists') ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      console.log("1. ✅ L'admin existe déjà - utilisez le token généré");
      console.log('2. 🧹 Ou exécutez: node src/utils/createAdmin.js --cleanup');
    }

    if (error.name === 'SequelizeConnectionError') {
      console.log('1. 🔧 Vérifiez votre fichier .env');
      console.log('2. 📡 Assurez-vous que MySQL est démarré');
      console.log('3. 🔗 Testez: npm run test:connection');
    }

    if (error.message.includes('User is not defined')) {
      console.log('1. 📁 Vérifiez que le modèle User existe');
      console.log('2. 🔗 Vérifiez src/models/index.js');
    }

    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--cleanup')) {
    cleanupAndRecreate()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (args.includes('--diagnostic')) {
    runDiagnostics()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    main();
  }
}

module.exports = { createAdmin, runDiagnostics, cleanupAndRecreate };
