const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = 'OMGBa123!';
  const saltRounds = 12; // Conformément à votre AuthService

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Mot de passe haché à utiliser dans la requête SQL :');
    console.log(hashedPassword);
  } catch (error) {
    console.error('Erreur lors du hachage du mot de passe:', error);
  }
}

hashPassword();
