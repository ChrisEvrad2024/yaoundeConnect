// src/utils/testAuthFlow.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.APP_URL || 'http://localhost:9999';

// Configuration du test
const testUser = {
  name: 'Test User Flow',
  email: `test.flow.${Date.now()}@example.com`,
  password: 'TestFlow123!'
};

class AuthFlowTester {
  constructor() {
    this.axios = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      validateStatus: () => true // Ne pas rejeter pour les codes d'erreur
    });
  }

  log(step, message, data = null) {
    console.log(`\n🔸 ${step}: ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async testCompleteFlow() {
    console.log("🚀 DÉBUT DU TEST DU FLOW D'AUTHENTIFICATION");
    console.log('='.repeat(60));

    try {
      // 1. Test de santé du serveur
      await this.testServerHealth();

      // 2. Test d'inscription
      const registrationResult = await this.testRegistration();

      // 3. Test de connexion (doit échouer - email non vérifié)
      await this.testLoginBeforeVerification();

      // 4. Simuler la vérification d'email
      await this.testEmailVerification(registrationResult.verificationToken);

      // 5. Test de connexion (doit réussir)
      const loginResult = await this.testLoginAfterVerification();

      // 6. Test d'accès aux ressources protégées
      await this.testProtectedRoute(loginResult.token);

      // 7. Test de récupération du profil
      await this.testGetProfile(loginResult.token);

      console.log('\n✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
      console.log("🎉 Le flow d'authentification fonctionne parfaitement.");
    } catch (error) {
      console.error('\n❌ ERREUR DANS LE FLOW:', error.message);
      throw error;
    }
  }

  async testServerHealth() {
    this.log('ÉTAPE 1', 'Test de santé du serveur');

    const response = await this.axios.get('/health');

    if (response.status === 200) {
      this.log('SUCCESS', 'Serveur opérationnel', response.data);
    } else {
      throw new Error(`Serveur non disponible: ${response.status}`);
    }
  }

  async testRegistration() {
    this.log('ÉTAPE 2', "Test d'inscription");

    const response = await this.axios.post('/api/auth/register', testUser);

    if (response.status === 201) {
      this.log('SUCCESS', 'Inscription réussie', {
        user: response.data.user,
        hasVerificationToken: !!response.data.dev_verification_token
      });

      return {
        user: response.data.user,
        verificationToken: response.data.dev_verification_token
      };
    } else {
      throw new Error(`Inscription échouée: ${response.status} - ${response.data?.detail}`);
    }
  }

  async testLoginBeforeVerification() {
    this.log('ÉTAPE 3', 'Test de connexion (email non vérifié - doit échouer)');

    const response = await this.axios.post('/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    if (response.status === 401 && response.data.detail?.includes('vérifier votre email')) {
      this.log('SUCCESS', 'Connexion bloquée comme attendu (email non vérifié)', response.data);
    } else {
      throw new Error(`Test échoué: La connexion devrait être bloquée. Status: ${response.status}`);
    }
  }

  async testEmailVerification(verificationToken) {
    if (!verificationToken) {
      throw new Error('Token de vérification manquant');
    }

    this.log('ÉTAPE 4', "Test de vérification d'email");

    const response = await this.axios.get(`/api/auth/verify-email?token=${verificationToken}`);

    if (response.status === 200 && response.data.user) {
      this.log('SUCCESS', 'Email vérifié avec succès', {
        user: response.data.user,
        redirectUrl: response.data.redirectUrl
      });
    } else {
      throw new Error(`Vérification email échouée: ${response.status} - ${response.data?.detail}`);
    }
  }

  async testLoginAfterVerification() {
    this.log('ÉTAPE 5', 'Test de connexion (après vérification - doit réussir)');

    const response = await this.axios.post('/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    if (response.status === 200 && response.data.token) {
      this.log('SUCCESS', 'Connexion réussie', {
        user: response.data.user,
        hasToken: !!response.data.token
      });

      return {
        user: response.data.user,
        token: response.data.token
      };
    } else {
      throw new Error(`Connexion échouée: ${response.status} - ${response.data?.detail}`);
    }
  }

  async testProtectedRoute(token) {
    this.log('ÉTAPE 6', "Test d'accès aux ressources protégées");

    // Test sans token (doit échouer)
    const responseWithoutToken = await this.axios.get('/api/auth/me');

    if (responseWithoutToken.status === 401) {
      this.log('SUCCESS', 'Accès bloqué sans token (comme attendu)');
    } else {
      throw new Error("L'accès devrait être bloqué sans token");
    }

    // Test avec token (doit réussir)
    const responseWithToken = await this.axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (responseWithToken.status === 200) {
      this.log('SUCCESS', 'Accès autorisé avec token valide');
    } else {
      throw new Error(`Accès refusé avec token valide: ${responseWithToken.status}`);
    }
  }

  async testGetProfile(token) {
    this.log('ÉTAPE 7', 'Test de récupération du profil utilisateur');

    const response = await this.axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200 && response.data.user) {
      this.log('SUCCESS', 'Profil récupéré avec succès', response.data.user);
    } else {
      throw new Error(`Récupération profil échouée: ${response.status}`);
    }
  }

  async testSuperAdminLogin() {
    this.log('BONUS', 'Test de connexion Super Admin');

    const response = await this.axios.post('/api/auth/login', {
      email: 'test@gmail.com',
      password: 'passWord123!'
    });

    if (response.status === 200 && response.data.user?.role === 'superadmin') {
      this.log('SUCCESS', 'Super Admin connecté avec succès', {
        user: response.data.user,
        hasToken: !!response.data.token
      });
    } else {
      console.log('⚠️  Super Admin non disponible ou erreur de connexion');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
    }
  }
}

// Fonction principale
async function runAuthFlowTest() {
  const tester = new AuthFlowTester();

  try {
    await tester.testCompleteFlow();

    // Test bonus du super admin
    console.log('\n' + '='.repeat(60));
    await tester.testSuperAdminLogin();
  } catch (error) {
    console.error('\n💥 TEST ÉCHOUÉ:', error.message);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  runAuthFlowTest()
    .then(() => {
      console.log('\n🏁 Test terminé avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test échoué:', error.message);
      process.exit(1);
    });
}

module.exports = { AuthFlowTester, runAuthFlowTest };
