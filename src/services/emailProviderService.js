// src/services/emailProviderService.js
class EmailProviderService {
  constructor() {
    // Configuration des providers email populaires
    this.providers = [
      // Providers internationaux
      {
        name: 'Gmail',
        domains: ['gmail.com', 'googlemail.com'],
        webmailUrl: 'https://mail.google.com/mail/u/0/#inbox',
        searchUrl: 'https://mail.google.com/mail/u/0/#search/from:noreply@yaoundeconnect.com',
        icon: '📧',
        color: '#EA4335'
      },
      {
        name: 'Outlook',
        domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
        webmailUrl: 'https://outlook.live.com/mail/0/inbox',
        searchUrl: 'https://outlook.live.com/mail/0/inbox?searchTerm=yaoundeconnect',
        icon: '📮',
        color: '#0078D4'
      },
      {
        name: 'Yahoo Mail',
        domains: ['yahoo.com', 'yahoo.fr', 'ymail.com'],
        webmailUrl: 'https://mail.yahoo.com',
        searchUrl: 'https://mail.yahoo.com/d/search/keyword=yaoundeconnect',
        icon: '📬',
        color: '#6001D2'
      },
      {
        name: 'ProtonMail',
        domains: ['protonmail.com', 'proton.me', 'pm.me'],
        webmailUrl: 'https://mail.protonmail.com/inbox',
        icon: '🔒',
        color: '#8B89CC'
      },
      {
        name: 'iCloud Mail',
        domains: ['icloud.com', 'me.com', 'mac.com'],
        webmailUrl: 'https://www.icloud.com/mail',
        icon: '☁️',
        color: '#007AFF'
      },
      // Providers français
      {
        name: 'Orange',
        domains: ['orange.fr', 'wanadoo.fr'],
        webmailUrl: 'https://webmail.orange.fr/webmail/fr_FR/inbox.html',
        icon: '🟠',
        color: '#FF7900'
      },
      {
        name: 'Free',
        domains: ['free.fr'],
        webmailUrl: 'https://webmail.free.fr/',
        icon: '📧',
        color: '#CD1F2B'
      },
      {
        name: 'SFR',
        domains: ['sfr.fr', 'neuf.fr'],
        webmailUrl: 'https://webmail.sfr.fr/',
        icon: '📧',
        color: '#E2001A'
      },
      {
        name: 'La Poste',
        domains: ['laposte.net'],
        webmailUrl: 'https://webmail.laposte.net/',
        icon: '📮',
        color: '#F7E400'
      },
      // Providers africains/camerounais
      {
        name: 'Camtel',
        domains: ['camtel.cm'],
        webmailUrl: 'https://webmail.camtel.cm',
        icon: '🇨🇲',
        color: '#009639'
      },
      {
        name: 'Orange Cameroun',
        domains: ['orange.cm'],
        webmailUrl: 'https://webmail.orange.cm',
        icon: '🟠',
        color: '#FF7900'
      },
      {
        name: 'MTN Cameroun',
        domains: ['mtn.cm', 'mtncameroon.net'],
        webmailUrl: 'https://webmail.mtn.cm',
        icon: '📱',
        color: '#FFCB05'
      }
    ];
  }

  /**
   * Détecte le provider email à partir de l'adresse
   */
  detectProvider(email) {
    if (!email || !email.includes('@')) {
      return null;
    }

    const domain = email.split('@')[1].toLowerCase();

    // Recherche du provider correspondant
    for (const provider of this.providers) {
      if (provider.domains.some((d) => domain.endsWith(d))) {
        return provider;
      }
    }

    // Provider non reconnu
    return {
      name: 'Webmail',
      webmailUrl: null,
      icon: '📧',
      color: '#6B7280'
    };
  }

  /**
   * Génère l'URL pour accéder à la boîte mail
   */
  getMailboxUrl(email) {
    const provider = this.detectProvider(email);

    if (provider && provider.webmailUrl) {
      return provider.webmailUrl;
    }

    // Si provider non reconnu, retourner null
    return null;
  }

  /**
   * Génère l'URL pour rechercher les emails de yaoundeConnect
   */
  getSearchUrl(email) {
    const provider = this.detectProvider(email);

    if (provider && provider.searchUrl) {
      return provider.searchUrl;
    }

    // URL générique si provider non reconnu
    return provider?.webmailUrl || null;
  }

  /**
   * Obtient les informations complètes du provider
   */
  getProviderInfo(email) {
    return this.detectProvider(email);
  }
}

module.exports = new EmailProviderService();
