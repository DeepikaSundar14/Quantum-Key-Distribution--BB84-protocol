const crypto = require('crypto');

/**
 * One-Time Pad (OTP / Vernam Cipher) & Symmetric Quantum-Secured Cryptography
 */
class OneTimePad {
  /**
   * Encrypt plaintext string using key bit array via One-Time Pad (XOR)
   * @param {string} plaintext - ASCII or UTF-8 text
   * @param {Array<number>} keyBits - Secret key bits from QKD pipeline
   * @returns {object} { ciphertextHex, keyUsedBits, plaintextLength }
   */
  static encrypt(plaintext, keyBits) {
    const textBuffer = Buffer.from(plaintext, 'utf-8');
    const requiredBits = textBuffer.length * 8;

    if (keyBits.length < requiredBits) {
      throw new Error(
        `Insufficient QKD key length: Message requires ${requiredBits} bits, but only ${keyBits.length} bits available.`
      );
    }

    const cipherBuffer = Buffer.alloc(textBuffer.length);

    for (let byteIdx = 0; byteIdx < textBuffer.length; byteIdx++) {
      let keyByte = 0;
      for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
        const bit = keyBits[byteIdx * 8 + bitIdx];
        keyByte |= (bit << (7 - bitIdx));
      }
      cipherBuffer[byteIdx] = textBuffer[byteIdx] ^ keyByte;
    }

    return {
      plaintext,
      ciphertextHex: cipherBuffer.toString('hex'),
      keyUsedBits: requiredBits,
      bytesLength: textBuffer.length
    };
  }

  /**
   * Decrypt ciphertext hex string using identical key bit array
   * @param {string} ciphertextHex - Hex-encoded ciphertext
   * @param {Array<number>} keyBits - Bob's secret key bits
   * @returns {string} Recovered plaintext
   */
  static decrypt(ciphertextHex, keyBits) {
    const cipherBuffer = Buffer.from(ciphertextHex, 'hex');
    const requiredBits = cipherBuffer.length * 8;

    if (keyBits.length < requiredBits) {
      throw new Error(`Insufficient key length for decryption.`);
    }

    const plainBuffer = Buffer.alloc(cipherBuffer.length);

    for (let byteIdx = 0; byteIdx < cipherBuffer.length; byteIdx++) {
      let keyByte = 0;
      for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
        const bit = keyBits[byteIdx * 8 + bitIdx];
        keyByte |= (bit << (7 - bitIdx));
      }
      plainBuffer[byteIdx] = cipherBuffer[byteIdx] ^ keyByte;
    }

    return plainBuffer.toString('utf-8');
  }

  /**
   * Hybrid Post-Quantum AES-256-GCM encryption using QKD-derived key
   * @param {string} plaintext 
   * @param {Array<number>} keyBits 
   * @returns {object} { ciphertext, iv, authTag }
   */
  static encryptAES(plaintext, keyBits) {
    // Derive 256-bit key from QKD bit array
    const keyBuf = crypto.createHash('sha256').update(Buffer.from(keyBits)).digest();
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag
    };
  }

  /**
   * Hybrid AES-256-GCM decryption
   */
  static decryptAES(ciphertextHex, ivHex, authTagHex, keyBits) {
    const keyBuf = crypto.createHash('sha256').update(Buffer.from(keyBits)).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

module.exports = { OneTimePad };

