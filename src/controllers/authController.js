const AuthService = require('../services/authService');
const emailService = require('../services/emailService');

class AuthController {
  // POST /api/auth/register - Inscription utilisateur
  static async register(req, res) {
    try {
      const { name, email, password, role } = req.body; // Extraire d'abord
      const { user, emailVerificationToken } = await AuthService.registerUser({
        name,
        email,
        password,
        role
      });

      // Obtenir les infos du provider email
      const emailProviderService = require('../services/emailProviderService');
      const providerInfo = emailProviderService.getProviderInfo(email);
      const mailboxUrl = emailProviderService.getMailboxUrl(email);

      // Envoyer l'email de vérification
      try {
        await emailService.sendVerificationEmail(user, emailVerificationToken);
        console.log(`📧 Email de vérification envoyé à ${user.email}`);
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError.message);
      }

      res.status(201).json({
        message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_email_verified: user.is_email_verified
        },
        // Inclure les infos du provider email
        emailProvider: providerInfo
          ? {
              name: providerInfo.name,
              icon: providerInfo.icon,
              mailboxUrl: mailboxUrl
            }
          : null,
        // En développement, inclure le token
        ...(process.env.NODE_ENV === 'development' && {
          dev_verification_token: emailVerificationToken,
          dev_verification_url: `${process.env.CLIENT_URL || 'http://localhost:10000'}/auth/verify-email?token=${emailVerificationToken}`
        })
      });
    } catch (error) {
      console.error('Erreur inscription:', error);

      if (error.message.includes('existe déjà')) {
        return res.status(409).json({
          type: 'https://httpstatuses.com/409',
          title: 'Conflit de données',
          status: 409,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: "Erreur d'inscription",
        status: 500,
        detail: "Une erreur est survenue lors de l'inscription"
      });
    }
  }

  // POST /api/auth/login - Connexion utilisateur
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Authentifier l'utilisateur
      const { user, token } = await AuthService.loginUser(email, password);

      res.json({
        message: 'Connexion réussie',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_email_verified: user.is_email_verified
        },
        token
      });
    } catch (error) {
      console.error('Erreur connexion:', error);

      if (error.message.includes('Email ou mot de passe incorrect')) {
        return res.status(401).json({
          type: 'https://httpstatuses.com/401',
          title: 'Identifiants invalides',
          status: 401,
          detail: 'Email ou mot de passe incorrect'
        });
      }

      if (error.message.includes('vérifier votre email')) {
        return res.status(401).json({
          type: 'https://httpstatuses.com/401',
          title: 'Email non vérifié',
          status: 401,
          detail: 'Veuillez vérifier votre email avant de vous connecter'
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de connexion',
        status: 500,
        detail: 'Une erreur est survenue lors de la connexion'
      });
    }
  }

  // GET /api/auth/verify-email - Vérification email
  static async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          type: 'https://httpstatuses.com/400',
          title: 'Token manquant',
          status: 400,
          detail: 'Le token de vérification est requis'
        });
      }

      // Vérifier l'email
      const user = await AuthService.verifyEmail(token);

      // Envoyer un email de bienvenue
      try {
        await emailService.sendWelcomeEmail(user);
      } catch (emailError) {
        console.error('Erreur envoi email bienvenue:', emailError.message);
      }

      // Redirection vers une page de succès ou retour JSON
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        // Si c'est une requête depuis un navigateur, rediriger
        res.redirect(
          `${process.env.CLIENT_URL || 'http://localhost:3000'}/email-verified?success=true`
        );
      } else {
        // Si c'est une API call, retourner JSON
        res.json({
          message: 'Email vérifié avec succès. Votre compte est maintenant actif.',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            is_email_verified: user.is_email_verified
          }
        });
      }
    } catch (error) {
      console.error('Erreur vérification email:', error);

      if (error.message.includes('invalide ou expiré')) {
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
          res.redirect(
            `${process.env.CLIENT_URL || 'http://localhost:3000'}/email-verified?error=token_invalid`
          );
        } else {
          return res.status(400).json({
            type: 'https://httpstatuses.com/400',
            title: 'Token invalide',
            status: 400,
            detail: 'Le token de vérification est invalide ou expiré'
          });
        }
      } else {
        res.status(500).json({
          type: 'https://httpstatuses.com/500',
          title: 'Erreur de vérification',
          status: 500,
          detail: 'Une erreur est survenue lors de la vérification'
        });
      }
    }
  }

  // POST /api/auth/resend-verification - Renvoyer email de vérification
  static async resendVerification(req, res) {
    try {
      const { email } = req.body;

      // Renvoyer l'email de vérification
      const { user, emailVerificationToken } = await AuthService.resendVerificationEmail(email);

      // Envoyer l'email
      try {
        await emailService.sendVerificationEmail(user, emailVerificationToken);
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError.message);
        return res.status(500).json({
          type: 'https://httpstatuses.com/500',
          title: "Erreur d'envoi",
          status: 500,
          detail: "Impossible d'envoyer l'email de vérification"
        });
      }

      res.json({
        message: 'Email de vérification renvoyé avec succès'
      });
    } catch (error) {
      console.error('Erreur resend verification:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Utilisateur non trouvé',
          status: 404,
          detail: 'Aucun utilisateur trouvé avec cet email'
        });
      }

      if (error.message.includes('déjà vérifié')) {
        return res.status(400).json({
          type: 'https://httpstatuses.com/400',
          title: 'Email déjà vérifié',
          status: 400,
          detail: 'Cet email est déjà vérifié'
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de renvoi',
        status: 500,
        detail: 'Une erreur est survenue lors du renvoi'
      });
    }
  }

  // GET /api/auth/me - Profil utilisateur connecté
  static async getProfile(req, res) {
    try {
      // L'utilisateur est disponible via req.user grâce au middleware d'auth
      res.json({
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          is_email_verified: req.user.is_email_verified,
          created_at: req.user.created_at,
          updated_at: req.user.updated_at
        }
      });
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de profil',
        status: 500,
        detail: 'Impossible de récupérer le profil utilisateur'
      });
    }
  }

  // POST /api/auth/logout - Déconnexion (optionnel)
  static async logout(req, res) {
    try {
      // Avec JWT, la déconnexion côté serveur est optionnelle
      // Le client doit simplement supprimer le token
      res.json({
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de déconnexion',
        status: 500,
        detail: 'Une erreur est survenue lors de la déconnexion'
      });
    }
  }
}

module.exports = AuthController;
