// src/utils/testEmailService.js
require('dotenv').config();
const emailService = require('../services/emailService');
const emailProviderService = require('../services/emailProviderService');

class EmailServiceTester {
  constructor() {
    this.testEmails = [
      'test@gmail.com',
      'user@outlook.com',
      'example@yahoo.fr',
      'demo@orange.fr',
      'test@protonmail.com',
      'user@camtel.cm'
    ];
  }

  log(step, message, data = null) {
    console.log(`\n🔸 ${step}: ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async testEmailProviderDetection() {
    this.log('TEST 1', 'Détection des providers email');

    this.testEmails.forEach((email) => {
      const provider = emailProviderService.getProviderInfo(email);
      const mailboxUrl = emailProviderService.getMailboxUrl(email);

      console.log(`\n   📧 ${email}:`);
      console.log(`      Provider: ${provider?.name || 'Non reconnu'}`);
      console.log(`      Icon: ${provider?.icon || 'N/A'}`);
      console.log(`      URL boîte mail: ${mailboxUrl || 'N/A'}`);
    });
  }

  async testEmailTemplates() {
    this.log('TEST 2', "Test des templates d'email");

    // Utilisateur de test
    const testUser = {
      id: 1,
      name: 'Jean Dupont',
      email: 'jean.dupont@gmail.com',
      role: 'membre',
      is_email_verified: false
    };

    const verificationToken = 'test-token-' + Date.now();

    try {
      // Test email de vérification
      console.log('\n   📧 Test email de vérification...');
      const verificationResult = await emailService.sendVerificationEmail(
        testUser,
        verificationToken
      );
      console.log(`      ✅ Email de vérification: ${verificationResult.messageId}`);

      // Test email de bienvenue
      console.log('\n   📧 Test email de bienvenue...');
      testUser.is_email_verified = true;
      const welcomeResult = await emailService.sendWelcomeEmail(testUser);
      console.log(`      ✅ Email de bienvenue: ${welcomeResult.messageId}`);
    } catch (error) {
      console.error(`      ❌ Erreur: ${error.message}`);
    }
  }

  async testEmailConfiguration() {
    this.log('TEST 3', 'Vérification de la configuration email');

    const config = require('../config/email');

    console.log('   Configuration actuelle:');
    console.log(`      Host: ${config.host}`);
    console.log(`      Port: ${config.port}`);
    console.log(`      Secure: ${config.secure}`);
    console.log(`      From Name: ${config.from.name}`);
    console.log(`      From Address: ${config.from.address}`);
    console.log(`      Base URL: ${config.baseUrl}`);

    // Vérifier les variables d'environnement
    const requiredEnvVars = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS'];
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      console.log(`\n   ⚠️  Variables manquantes: ${missingVars.join(', ')}`);
    } else {
      console.log("   ✅ Toutes les variables d'environnement sont présentes");
    }
  }

  async testEmailService() {
    this.log('TEST 4', 'Test de base du service email');

    try {
      // Test d'envoi simple
      const result = await emailService.sendEmail(
        'test@example.com',
        'Test yaoundeConnect',
        '<h1>Email de test</h1><p>Ceci est un test du service email.</p>',
        'Email de test - Ceci est un test du service email.'
      );

      console.log('   ✅ Service email opérationnel');
      console.log(`      Message ID: ${result.messageId}`);
      console.log(`      Statut: ${result.response}`);
    } catch (error) {
      console.error(`   ❌ Erreur service email: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🧪 DÉBUT DES TESTS DU SERVICE EMAIL');
    console.log('='.repeat(50));

    try {
      await this.testEmailConfiguration();
      await this.testEmailProviderDetection();
      await this.testEmailService();
      await this.testEmailTemplates();

      console.log('\n✅ TOUS LES TESTS EMAIL TERMINÉS');

      if (process.env.NODE_ENV === 'development') {
        console.log('\n💡 Note: En mode développement, les emails sont simulés');
        console.log('   Les "vrais" emails ne sont pas envoyés');
      }
    } catch (error) {
      console.error('\n❌ ERREUR DANS LES TESTS EMAIL:', error.message);
      throw error;
    }
  }
}

// Fonction utilitaire pour tester un email spécifique
async function testSpecificEmail(email) {
  console.log(`🔍 Test spécifique pour: ${email}`);

  const provider = emailProviderService.getProviderInfo(email);
  const mailboxUrl = emailProviderService.getMailboxUrl(email);

  console.log(`Provider détecté: ${provider?.name || 'Non reconnu'}`);
  console.log(`URL boîte mail: ${mailboxUrl || 'N/A'}`);

  if (mailboxUrl) {
    console.log(`Lien direct: ${mailboxUrl}`);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  const tester = new EmailServiceTester();

  // Vérifier s'il y a un argument email spécifique
  const specificEmail = process.argv[2];

  if (specificEmail) {
    testSpecificEmail(specificEmail)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Erreur:', error.message);
        process.exit(1);
      });
  } else {
    tester
      .runAllTests()
      .then(() => {
        console.log('\n🏁 Tests email terminés !');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Tests email échoués:', error.message);
        process.exit(1);
      });
  }
}

module.exports = { EmailServiceTester, testSpecificEmail };
