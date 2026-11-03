/**
 * Quantum Bit Error Rate (QBER) Estimation & Security Thresholding
 */

/**
 * Binary Shannon Entropy function h2(p)
 * @param {number} p - Probability in [0, 1]
 * @returns {number} Entropy in bits
 */
function binaryEntropy(p) {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

/**
 * Estimate QBER by sacrificing a random sample of sifted bits.
 * The sacrificed bits are announced publicly over the classical channel.
 * 
 * @param {Array<number>} aliceSifted - Alice's sifted bits
 * @param {Array<number>} bobSifted - Bob's sifted bits
 * @param {number} sampleFraction - Fraction of bits to sacrifice (typically 0.20 to 0.30)
 * @param {number} threshold - Security abort threshold (default 0.11 for BB84)
 * @returns {object} QBER analysis and remaining raw keys
 */
function estimateQBER(aliceSifted, bobSifted, sampleFraction = 0.25, threshold = 0.11) {
  const n = aliceSifted.length;
  if (n === 0) {
    return {
      qber: 0,
      isSecure: false,
      sampleSize: 0,
      errorCount: 0,
      aliceKey: [],
      bobKey: [],
      reason: 'Sifted key is empty'
    };
  }

  // Determine sample size (at least 1 bit if available)
  const sampleSize = Math.max(1, Math.min(n, Math.round(n * sampleFraction)));

  // Generate unique random indices for the test sample
  const allIndices = Array.from({ length: n }, (_, i) => i);
  for (let i = allIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
  }

  const sampleIndices = new Set(allIndices.slice(0, sampleSize));

  let errorCount = 0;
  for (const idx of sampleIndices) {
    if (aliceSifted[idx] !== bobSifted[idx]) {
      errorCount++;
    }
  }

  const qber = errorCount / sampleSize;
  const isSecure = qber <= threshold;

  // Retain only unrevealed bits for key reconciliation
  const aliceKey = [];
  const bobKey = [];

  for (let i = 0; i < n; i++) {
    if (!sampleIndices.has(i)) {
      aliceKey.push(aliceSifted[i]);
      bobKey.push(bobSifted[i]);
    }
  }

  return {
    qber,
    isSecure,
    threshold,
    sampleSize,
    errorCount,
    aliceKey,
    bobKey,
    remainingLength: aliceKey.length,
    eveDetected: !isSecure
  };
}

module.exports = {
  estimateQBER,
  binaryEntropy
};

