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

  // Envoyer un email de vérification
  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${emailConfig.baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    const subject = `Vérifiez votre compte ${emailConfig.from.name}`;

    // Version texte simple pour le développement
    const text = `
Bonjour ${user.name},

Merci de vous être inscrit sur ${emailConfig.from.name}.

Pour vérifier votre email, cliquez sur ce lien :
${verificationUrl}

Ce lien expire dans 24 heures.

--
Équipe ${emailConfig.from.name}
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              background: #2563eb; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue sur ${emailConfig.from.name}!</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${user.name},</h2>
              <p>Merci de vous être inscrit sur ${emailConfig.from.name}. Pour compléter votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Vérifier mon email</a>
              </div>
              
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
              
              <p><strong>Ce lien expire dans 24 heures.</strong></p>
              
              <p>Si vous n'avez pas créé de compte, ignorez simplement cet email.</p>
            </div>
            <div class="footer">
              <p>© 2025 ${emailConfig.from.name}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // En développement, afficher le lien de vérification
    if (this.isDevelopment) {
      console.log('🔗 [DEV] Lien de vérification email:');
      console.log(`   ${verificationUrl}`);
      console.log("💡 Utilisez ce lien pour vérifier l'email manuellement");
    }

    return await this.sendEmail(user.email, subject, html, text);
  }

  // Envoyer un email de bienvenue
  async sendWelcomeEmail(user) {
    const providerInfo = emailProviderService.getProviderInfo(user.email);
    const mailboxUrl = emailProviderService.getMailboxUrl(user.email);

    const subject = `Bienvenue sur ${emailConfig.from.name}!`;

    const text = `
Félicitations ${user.name}!

Votre compte ${emailConfig.from.name} est maintenant activé.

Que pouvez-vous faire maintenant ?
- Explorer les POI de Yaoundé
- Ajouter vos lieux favoris
- Commenter et noter les lieux
- Contribuer en ajoutant de nouveaux POI

Commencez l'exploration : ${emailConfig.baseUrl}

Pour accéder rapidement à vos futurs emails de notre part :
${mailboxUrl ? `Ouvrir ${providerInfo.name} : ${mailboxUrl}` : 'Consultez votre boîte mail'}

--
Équipe ${emailConfig.from.name}
  `;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Mêmes styles que précédemment */
          body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            font-family: Arial, sans-serif;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          
          .header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          
          .celebration-emoji {
            font-size: 72px;
            margin-bottom: 20px;
          }
          
          .feature-card {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
            border-left: 4px solid #2563eb;
          }
          
          .feature-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
          }
          
          .cta-button {
            display: inline-block;
            background: #059669;
            color: white !important;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
          }
          
          .mailbox-tip {
            background: #eff6ff;
            border: 1px solid #dbeafe;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="celebration-emoji">🎉</div>
            <h1>Email vérifié avec succès!</h1>
          </div>
          
          <div class="content" style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">
              Félicitations ${user.name}!
            </h2>
            
            <p style="font-size: 16px; color: #6b7280; line-height: 1.6;">
              Votre compte ${emailConfig.from.name} est maintenant activé. 
              Vous avez accès à toutes les fonctionnalités de notre plateforme!
            </p>
            
            <h3 style="margin-top: 30px; color: #1f2937;">
              🚀 Que pouvez-vous faire maintenant ?
            </h3>
            
            <div class="feature-card">
              <div class="feature-title">🗺️ Explorer les POI</div>
              <p style="color: #6b7280; margin: 0;">
                Découvrez tous les points d'intérêt de Yaoundé et ses environs
              </p>
            </div>
            
            <div class="feature-card">
              <div class="feature-title">❤️ Ajouter aux favoris</div>
              <p style="color: #6b7280; margin: 0;">
                Sauvegardez vos lieux préférés pour les retrouver facilement
              </p>
            </div>
            
            <div class="feature-card">
              <div class="feature-title">💬 Commenter et noter</div>
              <p style="color: #6b7280; margin: 0;">
                Partagez votre expérience et aidez la communauté
              </p>
            </div>
            
            <div class="feature-card">
              <div class="feature-title">➕ Contribuer</div>
              <p style="color: #6b7280; margin: 0;">
                Ajoutez de nouveaux points d'intérêt et enrichissez la plateforme
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${emailConfig.baseUrl}" class="cta-button">
                Commencer l'exploration
              </a>
            </div>
            
            ${mailboxUrl
        ? `
            <div class="mailbox-tip">
              <p style="margin: 0 0 15px 0; color: #1e40af; font-weight: 600;">
                💡 Astuce : Ajoutez-nous à vos contacts!
              </p>
              <p style="margin: 0 0 15px 0; color: #6b7280;">
                Pour ne manquer aucune notification importante
              </p>
              <a href="${mailboxUrl}" 
                 style="display: inline-block; background: ${providerInfo.color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;"
                 target="_blank">
                ${providerInfo.icon} Ouvrir ${providerInfo.name}
              </a>
            </div>
            `
        : ''
      }
          </div>
          
          <div class="footer" style="background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>© 2025 ${emailConfig.from.name}. Tous droits réservés.</p>
            <p style="margin-top: 10px;">
              Notre adresse email : ${emailConfig.from.address}
            </p>
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