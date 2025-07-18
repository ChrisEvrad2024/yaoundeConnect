const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

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
      this.transporter = nodemailer.createTransporter(emailConfig);

      // Vérifier seulement en production
      await this.transporter.verify();
      console.log('📧 Service email initialisé (mode production)');
    } catch (error) {
      console.warn('⚠️  Erreur initialisation email:', error.message);

      // Fallback vers le mode simulation si échec
      this.transporter = nodemailer.createTransporter({
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
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .feature { padding: 15px; margin: 10px 0; background: white; border-radius: 8px; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Email vérifié avec succès!</h1>
            </div>
            <div class="content">
              <h2>Félicitations ${user.name}!</h2>
              <p>Votre compte ${emailConfig.from.name} est maintenant activé. Vous pouvez explorer tous nos points d'intérêt et contribuer à la communauté.</p>
              
              <h3>Que pouvez-vous faire maintenant ?</h3>
              
              <div class="feature">
                <h4>🗺️ Explorer les POI</h4>
                <p>Découvrez tous les points d'intérêt de Yaoundé et ses environs.</p>
              </div>
              
              <div class="feature">
                <h4>❤️ Ajouter aux favoris</h4>
                <p>Sauvegardez vos lieux préférés pour les retrouver facilement.</p>
              </div>
              
              <div class="feature">
                <h4>💬 Commenter et noter</h4>
                <p>Partagez votre expérience et aidez la communauté.</p>
              </div>
              
              <div class="feature">
                <h4>➕ Contribuer</h4>
                <p>Ajoutez de nouveaux points d'intérêt et enrichissez la plateforme.</p>
              </div>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${emailConfig.baseUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  Commencer l'exploration
                </a>
              </p>
            </div>
            <div class="footer">
              <p>© 2025 ${emailConfig.from.name}. Tous droits réservés.</p>
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
