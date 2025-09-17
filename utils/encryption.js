const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_IV = process.env.ENCRYPTION_IV;

if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
  throw new Error('Encryption key and IV must be set in environment variables');
}

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('Encryption key must be 32 characters long');
}

if (ENCRYPTION_IV.length !== 16) {
  throw new Error('Encryption IV must be 16 characters long');
}

function encrypt(text) {
  if (!text) return null;

  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText) {
  if (!encryptedText) return null;

  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function hashPassword(password) {
  const bcrypt = require('bcryptjs');
  return bcrypt.hashSync(password, 12);
}

function comparePassword(password, hash) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compareSync(password, hash);
}

function generateSecureId() {
  return crypto.randomUUID();
}

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  comparePassword,
  generateSecureId
};