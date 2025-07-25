// src/utils/testEmailProvider.js
const emailProviderService = require('../services/emailProviderService');

const testEmails = [
  'test@gmail.com',
  'user@outlook.com',
  'client@yahoo.fr',
  'contact@orange.fr',
  'info@camtel.cm',
  'unknown@entreprise.com'
];

console.log('🧪 Test du service de détection des providers email\n');

testEmails.forEach((email) => {
  const provider = emailProviderService.getProviderInfo(email);
  const mailboxUrl = emailProviderService.getMailboxUrl(email);
  const searchUrl = emailProviderService.getSearchUrl(email);

  console.log(`📧 Email: ${email}`);
  console.log(`   Provider: ${provider?.name || 'Non reconnu'}`);
  console.log(`   Icon: ${provider?.icon}`);
  console.log(`   Mailbox URL: ${mailboxUrl || 'Non disponible'}`);
  console.log(`   Search URL: ${searchUrl || 'Non disponible'}`);
  console.log('---');
});
