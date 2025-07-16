const express = require('express');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');
const authValidator = require('../validators/authValidator');

const router = express.Router();

// Routes publiques
router.post('/register',
    validationMiddleware(authValidator.register),
    AuthController.register
);

router.post('/login',
    validationMiddleware(authValidator.login),
    AuthController.login
);

router.get('/verify-email',
    validationMiddleware(authValidator.verifyEmail, 'query'),
    AuthController.verifyEmail
);

router.post('/resend-verification',
    validationMiddleware(authValidator.resendVerification),
    AuthController.resendVerification
);

// Routes protégées
router.get('/me',
    authMiddleware,
    AuthController.getProfile
);

router.post('/logout',
    authMiddleware,
    AuthController.logout
);

module.exports = router;