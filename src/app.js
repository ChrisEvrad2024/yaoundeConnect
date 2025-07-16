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
        status: 'active',
        endpoints: {
            auth: '/api/auth',
            poi: '/api/poi',
            documentation: '/api/docs'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/poi', require('./routes/poi'));

// Route 404 - VERSION CORRIGÉE
app.all('*', (req, res) => {
    res.status(404).json({
        type: 'https://httpstatuses.com/404',
        title: 'Route non trouvée',
        status: 404,
        detail: `La route ${req.method} ${req.originalUrl} n'existe pas`
    });
});

// Middleware de gestion d'erreurs
app.use(errorHandler);

module.exports = app;