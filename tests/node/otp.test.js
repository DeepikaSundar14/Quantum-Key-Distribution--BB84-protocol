const test = require('node:test');
const assert = require('node:assert');
const { OneTimePad } = require('../../src/crypto/otp');

test('OneTimePad: Perfect encryption and decryption', () => {
  const message = 'Hello, Quantum World 2026!';
  const messageBits = Buffer.from(message).length * 8;
  const keyBits = Array.from({ length: messageBits }, () => Math.random() < 0.5 ? 1 : 0);

  const encrypted = OneTimePad.encrypt(message, keyBits);
  const decrypted = OneTimePad.decrypt(encrypted.ciphertextHex, keyBits);

  assert.strictEqual(decrypted, message, 'Decrypted text must match plaintext');
  assert.notStrictEqual(encrypted.ciphertextHex, message, 'Ciphertext must be scrambled');
});

test('OneTimePad: Incomplete key throws error', () => {
  const message = 'A longer message that needs more key bits';
  const shortKey = [1, 0, 1, 1, 0];

  assert.throws(() => {
    OneTimePad.encrypt(message, shortKey);
  }, /Insufficient QKD key length/);
});

test('OneTimePad: AES-256-GCM authenticated session encryption', () => {
  const secretData = 'Confidential payload with arbitrary length.';
  const keyBits = Array.from({ length: 256 }, () => Math.random() < 0.5 ? 1 : 0);

  const encrypted = OneTimePad.encryptAES(secretData, keyBits);
  const decrypted = OneTimePad.decryptAES(encrypted.ciphertext, encrypted.iv, encrypted.authTag, keyBits);

  assert.strictEqual(decrypted, secretData, 'AES decrypted text must match original');
});

