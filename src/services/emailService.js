// src/services/emailService.js - Version améliorée
const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');
const emailProviderService = require('./emailProviderService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.initTransporter();
  }

  // Initialiser le transporteur
  async initTransporter() {
    try {
      // En développement, utiliser un transporteur factice
      if (this.isDevelopment) {
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true
        });
        console.log('📧 Service email initialisé (mode développement - simulation)');
        return;
      }

      // En production, utiliser la vraie configuration
      this.transporter = nodemailer.createTransport(emailConfig);

      // Vérifier seulement en production
      await this.transporter.verify();
      console.log('📧 Service email initialisé (mode production)');
    } catch (error) {
      console.warn('⚠️  Erreur initialisation email:', error.message);

      // Fallback vers le mode simulation si échec
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
      console.log('📧 Service email initialisé (mode simulation - fallback)');
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.transporter) {
      throw new Error('Service email non initialisé');
    }

    const mailOptions = {
      from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
      to,
      subject,
      html,
      text: text || this.htmlToText(html)
    };

    try {
      if (this.isDevelopment) {
        // En développement, simuler l'envoi
        console.log('📧 [SIMULATION] Email qui serait envoyé:');
        console.log(`   Destinataire: ${to}`);
        console.log(`   Sujet: ${subject}`);
        console.log(`   Contenu: ${text || 'Version HTML disponible'}`);

        // Retourner un objet simulé
        return {
          messageId: `simulated-${Date.now()}@yaoundeconnect.local`,
          accepted: [to],
          rejected: [],
          pending: [],
          response: 'Email simulé en mode développement'
        };
      }

      // En production, envoyer réellement
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email envoyé à ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);

      // En développement, ne pas faire échouer
      if (this.isDevelopment) {
        console.log('📧 [SIMULATION] Email envoyé (erreur ignorée en dev)');
        return {
          messageId: `simulated-error-${Date.now()}@yaoundeconnect.local`,
          accepted: [to],
          rejected: [],
          pending: [],
          response: 'Email simulé après erreur'
        };
      }

      throw new Error("Erreur lors de l'envoi de l'email");
    }
  }

  // Envoyer un email de vérification AMÉLIORÉ
  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${emailConfig.baseUrl}/api/auth/verify-email?token=${verificationToken}`;
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:10000'}/auth/login`;

    // Obtenir les infos du provider email
    const providerInfo = emailProviderService.getProviderInfo(user.email);
    const mailboxUrl = emailProviderService.getMailboxUrl(user.email);

    const subject = `🔐 Vérifiez votre compte ${emailConfig.from.name}`;

    // Version texte simple pour le développement
    const text = `
Bonjour ${user.name},

Merci de vous être inscrit sur ${emailConfig.from.name} !

ÉTAPE IMPORTANTE : Vérifiez votre email
Pour activer votre compte, cliquez sur ce lien :
${verificationUrl}

Après vérification, vous serez automatiquement redirigé vers la page de connexion.

ℹ️ Ce lien expire dans 24 heures.

Si vous n'arrivez pas à cliquer sur le lien, copiez-le et collez-le dans votre navigateur.

Besoin d'aide ? Répondez simplement à cet email.

--
Équipe ${emailConfig.from.name}
Votre guide pour explorer Yaoundé
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .email-container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1);
            }
            
            .header {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            
            .header-emoji {
              font-size: 64px;
              margin-bottom: 16px;
              display: block;
            }
            
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            
            .content {
              padding: 40px 30px;
            }
            
            .welcome-message {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 30px;
              line-height: 1.6;
            }
            
            .verification-section {
              background: #eff6ff;
              border: 2px solid #dbeafe;
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            
            .verification-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            
            .verification-title {
              font-size: 20px;
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 16px;
            }
            
            .verification-button {
              display: inline-block;
              background: #2563eb;
              color: white !important;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              margin: 20px 0;
              box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
              transition: all 0.3s ease;
            }
            
            .verification-button:hover {
              background: #1d4ed8;
              transform: translateY(-1px);
            }
            
            .steps-list {
              background: #f9fafb;
              border-radius: 8px;
              padding: 24px;
              margin: 30px 0;
            }
            
            .step {
              display: flex;
              align-items: center;
              margin-bottom: 16px;
              font-size: 14px;
              color: #4b5563;
            }
            
            .step:last-child {
              margin-bottom: 0;
            }
            
            .step-number {
              background: #2563eb;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 600;
              margin-right: 12px;
              flex-shrink: 0;
            }
            
            .info-box {
              background: #fef3c7;
              border: 1px solid #fbbf24;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
              font-size: 14px;
              color: #92400e;
            }
            
            .mailbox-tip {
              background: #f0f9ff;
              border: 1px solid #0ea5e9;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
              text-align: center;
            }
            
            .mailbox-button {
              display: inline-block;
              background: ${providerInfo?.color || '#6b7280'};
              color: white !important;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 6px;
              font-size: 14px;
              margin-top: 10px;
            }
            
            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            
            .footer-logo {
              font-size: 24px;
              color: #2563eb;
              font-weight: 700;
              margin-bottom: 8px;
            }
            
            .footer-tagline {
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 16px;
            }
            
            .footer-contact {
              color: #9ca3af;
              font-size: 12px;
            }
            
            .link-fallback {
              word-break: break-all;
              color: #2563eb;
              font-size: 12px;
              margin-top: 16px;
              padding: 12px;
              background: #f8fafc;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <span class="header-emoji">🗺️</span>
              <h1>Bienvenue sur ${emailConfig.from.name} !</h1>
            </div>
            
            <div class="content">
              <div class="welcome-message">
                <strong>Bonjour ${user.name},</strong><br><br>
                Merci de vous être inscrit sur <strong>${emailConfig.from.name}</strong>, votre guide pour explorer Yaoundé ! 🌟
              </div>
              
              <div class="verification-section">
                <div class="verification-icon">🔐</div>
                <div class="verification-title">Vérification requise</div>
                <p style="color: #6b7280; margin-bottom: 24px;">
                  Pour activer votre compte et commencer l'exploration, cliquez sur le bouton ci-dessous :
                </p>
                
                <a href="${verificationUrl}" class="verification-button">
                  ✅ Vérifier mon email
                </a>
                
                <div class="link-fallback">
                  <strong>Lien de secours :</strong><br>
                  ${verificationUrl}
                </div>
              </div>
              
              <div class="steps-list">
                <h3 style="margin-top: 0; color: #1f2937; font-size: 16px;">Que se passe-t-il après ?</h3>
                <div class="step">
                  <div class="step-number">1</div>
                  <span>Cliquez sur le bouton de vérification</span>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <span>Votre email sera automatiquement vérifié</span>
                </div>
                <div class="step">
                  <div class="step-number">3</div>
                  <span>Vous serez redirigé vers la page de connexion</span>
                </div>
                <div class="step">
                  <div class="step-number">4</div>
                  <span>Connectez-vous et commencez à explorer ! 🚀</span>
                </div>
              </div>
              
              <div class="info-box">
                <strong>⏰ Important :</strong> Ce lien expire dans 24 heures. Si vous ne recevez pas cet email dans votre boîte de réception, vérifiez vos spams.
              </div>
              
              ${
                mailboxUrl
                  ? `
              <div class="mailbox-tip">
                <p style="margin: 0 0 10px 0; color: #0369a1; font-weight: 600;">
                  💡 Accès rapide à votre boîte mail
                </p>
                <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
                  Pour retrouver facilement nos emails
                </p>
                <a href="${mailboxUrl}" class="mailbox-button" target="_blank">
                  ${providerInfo?.icon || '📧'} Ouvrir ${providerInfo?.name || 'Ma boîte mail'}
                </a>
              </div>
              `
                  : ''
              }
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Des questions ? Répondez simplement à cet email, nous sommes là pour vous aider ! 😊
              </p>
            </div>
            
            <div class="footer">
              <div class="footer-logo">${emailConfig.from.name}</div>
              <div class="footer-tagline">Votre guide pour explorer Yaoundé</div>
              <div class="footer-contact">
                © 2025 ${emailConfig.from.name} - ${emailConfig.from.address}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // En développement, afficher le lien de vérification
    if (this.isDevelopment) {
      console.log('\n🔗 [DEV] Lien de vérification email:');
      console.log(`   ${verificationUrl}`);
      console.log('\n💡 Après vérification, redirection vers:');
      console.log(`   ${loginUrl}?verified=true`);
      console.log("\n📧 Utilisez ce lien pour vérifier l'email manuellement");
    }

    return await this.sendEmail(user.email, subject, html, text);
  }

  // Email de bienvenue amélioré (après vérification)
  async sendWelcomeEmail(user) {
    const providerInfo = emailProviderService.getProviderInfo(user.email);
    const mailboxUrl = emailProviderService.getMailboxUrl(user.email);
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:10000'}/auth/login`;

    const subject = `🎉 Bienvenue sur ${emailConfig.from.name} - Votre compte est activé !`;

    const text = `
Félicitations ${user.name} !

Votre compte ${emailConfig.from.name} est maintenant activé et prêt à l'emploi ! 🚀

CONNECTEZ-VOUS MAINTENANT :
${loginUrl}

Que pouvez-vous faire maintenant ?
✅ Explorer les POI de Yaoundé
✅ Ajouter vos lieux favoris
✅ Commenter et noter les lieux
✅ Contribuer en ajoutant de nouveaux POI

Votre rôle : ${user.role}

Commencez votre exploration dès maintenant : ${emailConfig.baseUrl}

--
Équipe ${emailConfig.from.name}
Votre guide pour explorer Yaoundé
  `;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Mêmes styles que l'email de vérification */
          body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          
          .celebration-emoji {
            font-size: 72px;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
          
          .feature-card {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 20px 0;
            border-left: 4px solid #059669;
            transition: transform 0.2s ease;
          }
          
          .feature-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
          }
          
          .feature-icon {
            margin-right: 8px;
            font-size: 20px;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white !important;
            padding: 18px 36px;
            text-decoration: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: 600;
            margin: 30px 0;
            box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
            transition: all 0.3s ease;
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(5, 150, 105, 0.5);
          }
          
          .user-role {
            background: #eff6ff;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            margin: 25px 0;
          }
          
          .role-badge {
            background: #3b82f6;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="celebration-emoji">🎉</div>
            <h1>Compte activé avec succès !</h1>
            <p style="margin: 16px 0 0 0; opacity: 0.9; font-size: 16px;">
              Prêt à explorer Yaoundé ? 🗺️
            </p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px; text-align: center;">
              Félicitations ${user.name} ! 🌟
            </h2>
            
            <p style="font-size: 16px; color: #6b7280; line-height: 1.6; text-align: center; margin-bottom: 30px;">
              Votre compte ${emailConfig.from.name} est maintenant <strong style="color: #059669;">100% activé</strong> ! 
              Vous avez accès à toutes nos fonctionnalités.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${loginUrl}" class="cta-button">
                🚀 Me connecter maintenant
              </a>
            </div>
            
            <div class="user-role">
              <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: 600;">
                Votre statut sur la plateforme
              </p>
              <span class="role-badge">${user.role.toUpperCase()}</span>
            </div>
            
            <h3 style="margin-top: 40px; color: #1f2937; text-align: center;">
              🎯 Que pouvez-vous faire maintenant ?
            </h3>
            
            <div class="feature-card">
              <div class="feature-title">
                <span class="feature-icon">🗺️</span>
                Explorer les POI
              </div>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Découvrez restaurants, hôtels, attractions et services à Yaoundé
              </p>
            </div>
            
            <div class="feature-card">
              <div class="feature-title">
                <span class="feature-icon">❤️</span>
                Créer votre liste de favoris
              </div>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Sauvegardez vos lieux préférés pour les retrouver rapidement
              </p>
            </div>
            
            <div class="feature-card">
              <div class="feature-title">
                <span class="feature-icon">💬</span>
                Commenter et noter
              </div>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Partagez vos expériences et aidez la communauté
              </p>
            </div>
            
            <div class="feature-card">
              <div class="feature-title">
                <span class="feature-icon">➕</span>
                Contribuer à la plateforme
              </div>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Ajoutez de nouveaux lieux et enrichissez notre base de données
              </p>
            </div>
            
            <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <p style="margin: 0 0 15px 0; color: #1e40af; font-weight: 600;">
                💡 Conseil : Ajoutez notre email à vos contacts
              </p>
              <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
                Pour ne manquer aucune notification importante
              </p>
              ${
                mailboxUrl
                  ? `
              <a href="${mailboxUrl}" 
                 style="display: inline-block; background: ${providerInfo.color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;"
                 target="_blank">
                ${providerInfo.icon} Ouvrir ${providerInfo.name}
              </a>
              `
                  : ''
              }
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
                Des questions ? Notre équipe est là pour vous aider ! 😊
              </p>
              <p style="color: #9ca3af; font-size: 12px;">
                Répondez à cet email ou visitez notre centre d'aide
              </p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <div style="font-size: 24px; color: #059669; font-weight: 700; margin-bottom: 8px;">
              ${emailConfig.from.name}
            </div>
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
              Votre guide pour explorer Yaoundé 🇨🇲
            </div>
            <div style="color: #9ca3af; font-size: 12px;">
              © 2025 ${emailConfig.from.name} - ${emailConfig.from.address}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

    return await this.sendEmail(user.email, subject, html, text);
  }

  // Convertir HTML basique en texte
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Instance singleton
const emailService = new EmailService();
module.exports = emailService;
