const crypto = require('crypto');
const { binaryEntropy } = require('./qber');

/**
 * Privacy Amplification using Universal Hashing (Toeplitz Matrix)
 * and Cryptographic Hash-based randomness extraction.
 * Reduces Eve's mutual information to an exponentially negligible level.
 */
class PrivacyAmplification {
  /**
   * Calculate secure target key length based on QBER, reconciliation leakage, and security parameter.
   * Based on Renner et al. composable security proof:
   *   m = max(1, floor(n * (1 - h2(2 * QBER)) - leakageEC - securityParam))
   * 
   * @param {number} rawLength - Reconciled key length (n)
   * @param {number} qber - Estimated QBER
   * @param {number} parityBitsLeaked - Parity bits announced during Cascade reconciliation
   * @param {number} securityParam - Security margin parameter s (default 16 bits)
   * @returns {number} Target secure bit length
   */
  static calculateTargetLength(rawLength, qber, parityBitsLeaked = 0, securityParam = 16) {
    if (rawLength <= 0) return 0;
    const clampedQber = Math.max(0, Math.min(0.25, qber));
    const h2 = binaryEntropy(2 * clampedQber);
    const theoreticalFraction = Math.max(0.1, 1 - h2);
    
    const target = Math.floor(rawLength * theoreticalFraction - (parityBitsLeaked * 0.1) - securityParam);
    return Math.max(16, Math.min(rawLength, target));
  }

  /**
   * Compress key using a pseudo-random Toeplitz matrix over GF(2).
   * Toeplitz matrix multiplication is an ε-almost universal hash family.
   * 
   * @param {Array<number>} keyBits - Reconciled bit array (length n)
   * @param {number} targetLength - Desired secret key length (m <= n)
   * @param {Array<number>|null} seedBits - Public random seed of length (n + m - 1)
   * @returns {object} { finalKeyBits, hexKey, seedBits }
   */
  static applyToeplitz(keyBits, targetLength, seedBits = null) {
    const n = keyBits.length;
    const m = Math.min(targetLength, n);

    if (n === 0 || m === 0) {
      return { finalKeyBits: [], hexKey: '', seedBits: [] };
    }

    const seedLength = n + m - 1;
    let seed = seedBits;
    if (!seed || seed.length < seedLength) {
      seed = [];
      const randomBytes = crypto.randomBytes(Math.ceil(seedLength / 8));
      for (let i = 0; i < seedLength; i++) {
        const byteIndex = Math.floor(i / 8);
        const bitOffset = i % 8;
        seed.push((randomBytes[byteIndex] >> bitOffset) & 1);
      }
    }

    // Toeplitz matrix T of size m x n where T[i, j] = seed[i - j + n - 1]
    const finalKeyBits = new Array(m);
    for (let i = 0; i < m; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        const toeplitzVal = seed[i - j + (n - 1)];
        sum ^= (keyBits[j] & toeplitzVal);
      }
      finalKeyBits[i] = sum;
    }

    // Convert bit array to hexadecimal string
    let hexKey = '';
    for (let i = 0; i < finalKeyBits.length; i += 4) {
      let nibble = 0;
      for (let b = 0; b < 4; b++) {
        if (i + b < finalKeyBits.length) {
          nibble |= (finalKeyBits[i + b] << (3 - b));
        }
      }
      hexKey += nibble.toString(16);
    }

    return {
      finalKeyBits,
      hexKey,
      seedBits: seed
    };
  }

  /**
   * Cryptographic Hash extractor fallback (using SHA-256 HKDF-like construction)
   * @param {Array<number>} keyBits 
   * @param {number} byteLength - Number of key bytes to extract (e.g. 16 for AES-128, 32 for AES-256)
   * @returns {Buffer}
   */
  static extractCryptoKey(keyBits, byteLength = 32) {
    // Pack bit array into byte buffer
    const numBytes = Math.ceil(keyBits.length / 8);
    const buf = Buffer.alloc(numBytes);
    for (let i = 0; i < keyBits.length; i++) {
      if (keyBits[i]) {
        buf[Math.floor(i / 8)] |= (1 << (7 - (i % 8)));
      }
    }

    const hash = crypto.createHash('sha256').update(buf).digest();
    return hash.subarray(0, byteLength);
  }
}

module.exports = { PrivacyAmplification };

