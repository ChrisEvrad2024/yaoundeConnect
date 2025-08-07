// src/utils/createModerator.js - SCRIPT DE CRÉATION DE MODÉRATEUR
require('dotenv').config();
const { User } = require('../models');
const AuthService = require('../services/authService');

async function createModerator() {
  try {
    console.log('🔧 Début création Modérateur...');

    // Configuration du modérateur
    const MODERATOR_CONFIG = {
      name: 'Moderateur',
      email: 'moderateur@gmail.com',
      password: 'passWord123!',
      role: 'moderator'
    };

    console.log(`📧 Email cible: ${MODERATOR_CONFIG.email}`);

    // Vérifier si le modérateur existe déjà
    const existingModerator = await User.findOne({
      where: { email: MODERATOR_CONFIG.email }
    });

    if (existingModerator) {
      console.log("⚠️  Le Modérateur existe déjà!");
      console.log(`   ID: ${existingModerator.id}`);
      console.log(`   Nom: ${existingModerator.name}`);
      console.log(`   Email: ${existingModerator.email}`);
      console.log(`   Rôle: ${existingModerator.role}`);
      console.log(`   Email vérifié: ${existingModerator.is_email_verified}`);

      // Générer un token pour l'utilisateur existant
      const token = AuthService.generateToken({
        id: existingModerator.id,
        email: existingModerator.email,
        role: existingModerator.role
      });

      console.log('\n🔑 Token pour utilisateur existant:');
      console.log(token);

      return existingModerator;
    }

    console.log('👤 Aucun Modérateur trouvé, création en cours...');

    // Hacher le mot de passe
    console.log('🔒 Hachage du mot de passe...');
    const hashedPassword = await AuthService.hashPassword(MODERATOR_CONFIG.password);
    console.log('✅ Mot de passe haché avec succès');

    // Créer le modérateur
    console.log('💾 Création en base de données...');
    const moderator = await User.create({
      name: MODERATOR_CONFIG.name,
      email: MODERATOR_CONFIG.email,
      password: hashedPassword,
      role: MODERATOR_CONFIG.role,
      is_email_verified: true, // Déjà vérifié
      email_verification_token: null,
      email_verification_expires: null
    });

    console.log('✅ Modérateur créé avec succès!');
    console.log(`   ID: ${moderator.id}`);
    console.log(`   Nom: ${moderator.name}`);
    console.log(`   Email: ${moderator.email}`);
    console.log(`   Rôle: ${moderator.role}`);
    console.log(`   Email vérifié: ${moderator.is_email_verified}`);

    // Générer un token pour test
    const token = AuthService.generateToken({
      id: moderator.id,
      email: moderator.email,
      role: moderator.role
    });

    console.log('\n🔑 Token de test généré:');
    console.log(token);

    console.log('\n📝 Informations de connexion:');
    console.log(`   Email: ${MODERATOR_CONFIG.email}`);
    console.log(`   Mot de passe: ${MODERATOR_CONFIG.password}`);

    return moderator;
  } catch (error) {
    console.error("❌ Erreur lors de la création du Modérateur:", error);

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
    console.log('🔍 DÉBUT DU DIAGNOSTIC MODÉRATEUR');
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
    console.log('\n4. 🔍 Vérification utilisateur modérateur existant...');
    const existingUser = await User.findOne({
      where: { email: 'moderateur@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️  Utilisateur modérateur existe déjà:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Nom: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Rôle: ${existingUser.role}`);
      return existingUser;
    } else {
      console.log('✅ Aucun utilisateur avec cet email');
    }

    // 5. Test de création
    console.log('\n5. 🔧 Test création Modérateur...');
    const moderator = await createModerator();

    console.log('\n🎉 DIAGNOSTIC MODÉRATEUR TERMINÉ AVEC SUCCÈS');
    return moderator;
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
    console.log('🧹 NETTOYAGE ET RECRÉATION MODÉRATEUR');

    // Supprimer l'utilisateur existant si nécessaire
    const deleted = await User.destroy({
      where: { email: 'moderateur@gmail.com' }
    });

    if (deleted > 0) {
      console.log(`✅ ${deleted} utilisateur(s) modérateur supprimé(s)`);
    } else {
      console.log('ℹ️  Aucun utilisateur modérateur à supprimer');
    }

    // Créer le nouveau modérateur
    const moderator = await createModerator();

    return moderator;
  } catch (error) {
    console.error('❌ Erreur nettoyage modérateur:', error);
    throw error;
  }
}

// ====================================================================
// 🚀 FONCTIONS D'EXÉCUTION
// ====================================================================

// Fonction principale avec gestion d'erreurs améliorée
async function main() {
  try {
    console.log('🚀 CRÉATION MODÉRATEUR - VERSION COMPLÈTE');
    console.log('='.repeat(60));

    // Option 1: Diagnostic complet
    const result = await runDiagnostics();

    console.log('\n🎉 SUCCÈS MODÉRATEUR!');
    console.log(`Modérateur ID: ${result.id}`);
  } catch (error) {
    console.error('\n💥 ÉCHEC DE LA CRÉATION MODÉRATEUR');
    console.error('Erreur:', error.message);

    // Proposer des solutions
    console.log('\n🔧 SOLUTIONS POSSIBLES:');

    if (
      error.message.includes('already exists') ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      console.log("1. ✅ Le modérateur existe déjà - utilisez le token généré");
      console.log('2. 🧹 Ou exécutez: node src/utils/createModerator.js --cleanup');
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

module.exports = { createModerator, runDiagnostics, cleanupAndRecreate };