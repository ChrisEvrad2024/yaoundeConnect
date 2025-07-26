require('dotenv').config();

const emailConfig = {
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT || 587,
  secure: false, // true pour 465, false pour autres ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },

  // Configuration des templates
  from: {
    name: process.env.APP_NAME || 'yaoundeConnect',
    address: process.env.MAIL_USER
  },

  // URLs pour les emails
  baseUrl: process.env.APP_URL || 'http://localhost:9999'
};

// Validation de la configuration
if (!emailConfig.auth.user || !emailConfig.auth.pass) {
  console.warn('⚠️  Configuration email incomplète. Les emails ne pourront pas être envoyés.');
}

module.exports = emailConfig;
