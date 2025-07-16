const AuthService = require('../services/authService');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                type: 'https://httpstatuses.com/401',
                title: 'Authentification requise',
                status: 401,
                detail: 'Token d\'authentification manquant'
            });
        }

        const token = authHeader.substring(7);
        const decoded = AuthService.verifyToken(token);

        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password', 'email_verification_token'] }
        });

        if (!user) {
            return res.status(401).json({
                type: 'https://httpstatuses.com/401',
                title: 'Utilisateur non trouvé',
                status: 401,
                detail: 'L\'utilisateur associé à ce token n\'existe plus'
            });
        }

        if (!user.is_email_verified) {
            return res.status(401).json({
                type: 'https://httpstatuses.com/401',
                title: 'Email non vérifié',
                status: 401,
                detail: 'Veuillez vérifier votre email avant de continuer'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        if (error.message === 'Token invalide') {
            return res.status(401).json({
                type: 'https://httpstatuses.com/401',
                title: 'Token invalide',
                status: 401,
                detail: 'Le token d\'authentification est invalide ou expiré'
            });
        }

        console.error('Erreur middleware auth:', error);
        return res.status(500).json({
            type: 'https://httpstatuses.com/500',
            title: 'Erreur interne',
            status: 500,
            detail: 'Erreur lors de la vérification de l\'authentification'
        });
    }
};

module.exports = authMiddleware;