// server-test.js - Fichier de test pour identifier le problème
const express = require('express');
const app = express();

// Middleware basique
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Serveur de test fonctionnel!' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8000
  });
});

// Configuration du serveur
const PORT = process.env.PORT || 8000;
const HOST = '127.0.0.1'; // Utiliser l'adresse de bouclage locale

app.listen(PORT, HOST, (err) => {
  if (err) {
    console.error('❌ Erreur démarrage:', err);
    return;
  }
  console.log(`✅ Serveur de test démarré sur http://${HOST}:${PORT}`);
  console.log(`🧪 Testez: http://${HOST}:${PORT}/health`);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
  console.error('❌ Exception non gérée:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Promesse rejetée:', err);
  process.exit(1);
});
