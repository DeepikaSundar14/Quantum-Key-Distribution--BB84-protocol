/**
 * Sifting Phase:
 * Alice and Bob announce their chosen bases over an authenticated classical channel.
 * Bits where bases match are retained; all others are discarded.
 */

/**
 * Reconcile bases between Alice and Bob
 * @param {Array<string>} aliceBases - Bases used by Alice to prepare qubits
 * @param {Array<string|null>} bobBases - Bases used by Bob (null if photon was lost)
 * @param {Array<number>} aliceBits - Original bits prepared by Alice
 * @param {Array<number|null>} bobBits - Bits measured by Bob
 * @returns {object} Sifted results
 */
function siftKeys(aliceBases, bobBases, aliceBits, bobBits) {
  const siftedIndices = [];
  const aliceSifted = [];
  const bobSifted = [];

  const length = Math.min(aliceBases.length, bobBases.length);

  for (let i = 0; i < length; i++) {
    // If Bob did not receive a photon (channel loss), skip
    if (bobBases[i] === null || bobBits[i] === null) {
      continue;
    }

    // Keep bit only when Alice and Bob measured in the identical basis
    if (aliceBases[i] === bobBases[i]) {
      siftedIndices.push(i);
      aliceSifted.push(aliceBits[i]);
      bobSifted.push(bobBits[i]);
    }
  }

  const siftingEfficiency = length > 0 ? (siftedIndices.length / length) : 0;

  return {
    siftedIndices,
    aliceSifted,
    bobSifted,
    siftingEfficiency,
    siftedLength: siftedIndices.length
  };
}

module.exports = { siftKeys };

