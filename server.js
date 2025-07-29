const app = require('./src/app');
const { testConnection } = require('./src/config/database');
const notificationService = require('./src/services/notificationService');
const socketService = require('./src/services/socketService');

const http = require('http');

const PORT = process.env.PORT || 3000;

// Initialiser la base de données et démarrer le serveur
const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    await testConnection();

    // Créer le serveur HTTP
    const server = http.createServer(app);
    socketService.init(server);

    // Initialiser les notifications Socket.IO
    notificationService.init(server);

    // Démarrer le serveur
    server.listen(PORT, () => {
      console.log(` Serveur démarré sur le port ${PORT}`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` Socket.IO activé`);
    });
  } catch (error) {
    console.error(' Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
