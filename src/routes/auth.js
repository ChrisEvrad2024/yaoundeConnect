const express = require('express');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');
const authValidator = require('../validators/authValidator');

const router = express.Router();

// Routes publiques (sans authentification)

app.get('/health', (req, res) => {
    // Cette route renvoie simplement un statut 200 OK pour indiquer que l'API est en vie.
    res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

// POST /api/auth/register - Inscription
router.post('/register',
    validationMiddleware(authValidator.register),
    AuthController.register
);

// POST /api/auth/login - Connexion
router.post('/login',
    validationMiddleware(authValidator.login),
    AuthController.login
);

// GET /api/auth/verify-email - Vérification email (lien depuis email)
router.get('/verify-email',
    validationMiddleware(authValidator.verifyEmail, 'query'),
    AuthController.verifyEmail
);

// POST /api/auth/resend-verification - Renvoyer email de vérification
router.post('/resend-verification',
    validationMiddleware(authValidator.resendVerification),
    AuthController.resendVerification
);

// Routes protégées (authentification requise)

// GET /api/auth/me - Profil utilisateur connecté
router.get('/me',
    authMiddleware,
    AuthController.getProfile
);

// POST /api/auth/logout - Déconnexion
router.post('/logout',
    authMiddleware,
    AuthController.logout
);

module.exports = router;