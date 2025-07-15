const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import des middlewares personnalisés
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares de sécurité
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  })
);

// Middlewares de base
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: 'API yaoundeConnect',
    version: '1.0.0',
    status: 'active'
  });
});

// Routes API (à venir dans les prochains sprints)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/poi', require('./routes/poi'));

// Middleware de gestion d'erreurs
app.use(errorHandler);

module.exports = app;
