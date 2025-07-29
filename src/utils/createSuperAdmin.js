// src/utils/createSuperAdmin.js - VERSION CORRIGÉE
require('dotenv').config();
const { User } = require('../models');
const AuthService = require('../services/authService');

async function createSuperAdmin() {
  try {
    console.log('🔧 Début création Super Admin...');

    // Configuration du super admin
    const SUPER_ADMIN_CONFIG = {
      name: 'OMGBA_SUPER_ADMIN',
      email: 'chrisomgba04@gmail.com', // ✅ Email cohérent
      password: 'passWord123!',
      role: 'superadmin'
    };

    console.log(`📧 Email cible: ${SUPER_ADMIN_CONFIG.email}`);

    // ✅ CORRECTION: Vérifier le bon email
    const existingSuperAdmin = await User.findOne({
      where: { email: SUPER_ADMIN_CONFIG.email } // ✅ Email cohérent
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Le Super Admin existe déjà!');
      console.log(`   ID: ${existingSuperAdmin.id}`);
      console.log(`   Nom: ${existingSuperAdmin.name}`);
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Rôle: ${existingSuperAdmin.role}`);
      console.log(`   Email vérifié: ${existingSuperAdmin.is_email_verified}`);

      // Générer un token pour l'utilisateur existant
      const token = AuthService.generateToken({
        id: existingSuperAdmin.id,
        email: existingSuperAdmin.email,
        role: existingSuperAdmin.role
      });

      console.log('\n🔑 Token pour utilisateur existant:');
      console.log(token);

      return existingSuperAdmin;
    }

    console.log('👤 Aucun Super Admin trouvé, création en cours...');

    // Hacher le mot de passe
    console.log('🔒 Hachage du mot de passe...');
    const hashedPassword = await AuthService.hashPassword(SUPER_ADMIN_CONFIG.password);
    console.log('✅ Mot de passe haché avec succès');

    // Créer le super admin
    console.log('💾 Création en base de données...');
    const superAdmin = await User.create({
      name: SUPER_ADMIN_CONFIG.name,
      email: SUPER_ADMIN_CONFIG.email,
      password: hashedPassword,
      role: SUPER_ADMIN_CONFIG.role,
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
    console.log(`   Email: ${SUPER_ADMIN_CONFIG.email}`); // ✅ Email cohérent
    console.log(`   Mot de passe: ${SUPER_ADMIN_CONFIG.password}`);

    return superAdmin;
  } catch (error) {
    console.error('❌ Erreur lors de la création du Super Admin:', error);

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
    console.log('🔍 DÉBUT DU DIAGNOSTIC');
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
    console.log('\n4. 🔍 Vérification utilisateur existant...');
    const existingUser = await User.findOne({
      where: { email: 'chrisomgba04@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️  Utilisateur existe déjà:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Nom: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Rôle: ${existingUser.role}`);
      return existingUser;
    } else {
      console.log('✅ Aucun utilisateur avec cet email');
    }

    // 5. Test de création
    console.log('\n5. 🔧 Test création Super Admin...');
    const superAdmin = await createSuperAdmin();

    console.log('\n🎉 DIAGNOSTIC TERMINÉ AVEC SUCCÈS');
    return superAdmin;
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
    console.log('🧹 NETTOYAGE ET RECRÉATION');

    // Supprimer l'utilisateur existant si nécessaire
    const deleted = await User.destroy({
      where: { email: 'chrisomgba04@gmail.com' }
    });

    if (deleted > 0) {
      console.log(`✅ ${deleted} utilisateur(s) supprimé(s)`);
    } else {
      console.log('ℹ️  Aucun utilisateur à supprimer');
    }

    // Créer le nouveau super admin
    const superAdmin = await createSuperAdmin();

    return superAdmin;
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
    throw error;
  }
}

// ====================================================================
// 🚀 FONCTIONS D'EXÉCUTION
// ====================================================================

// Fonction principale avec gestion d'erreurs améliorée
async function main() {
  try {
    console.log('🚀 CRÉATION SUPER ADMIN - VERSION AMÉLIORÉE');
    console.log('='.repeat(60));

    // Option 1: Diagnostic complet
    const result = await runDiagnostics();

    console.log('\n🎉 SUCCÈS!');
    console.log(`Super Admin ID: ${result.id}`);
  } catch (error) {
    console.error('\n💥 ÉCHEC DE LA CRÉATION');
    console.error('Erreur:', error.message);

    // Proposer des solutions
    console.log('\n🔧 SOLUTIONS POSSIBLES:');

    if (
      error.message.includes('already exists') ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      console.log("1. ✅ L'utilisateur existe déjà - utilisez le token généré");
      console.log('2. 🧹 Ou exécutez: npm run cleanup:superadmin');
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

module.exports = { createSuperAdmin, runDiagnostics, cleanupAndRecreate };
