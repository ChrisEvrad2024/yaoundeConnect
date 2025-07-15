const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Initialiser la base de données et démarrer le serveur
const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    await testConnection();

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(` Serveur démarré sur le port ${PORT}`);
      console.log(` URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(' Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
