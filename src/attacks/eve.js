const { getRandomBasis } = require('../core/basis');
const { Qubit } = require('../core/qubit');

/**
 * Eavesdropper Eve implementation.
 * Simulates active quantum channel interception attacks.
 */
class Eavesdropper {
  /**
   * @param {object} options
   * @param {number} options.interceptRate - Probability [0.0 - 1.0] that Eve intercepts a photon
   * @param {string} options.strategy - 'intercept-resend' (standard)
   */
  constructor(options = {}) {
    this.interceptRate = options.interceptRate !== undefined ? options.interceptRate : 0.0;
    this.strategy = options.strategy || 'intercept-resend';
    this.interceptedCount = 0;
    this.knownBits = []; // Eve's stolen bits: array of { index, basis, bit }
  }

  /**
   * Intercept a qubit transmitted over the quantum channel.
   * If Eve decides to intercept (with probability interceptRate),
   * she measures it in a random basis and re-prepares a qubit to send to Bob.
   * 
   * @param {Qubit} qubit - Transmitted qubit
   * @param {number} index - Position index of the qubit in the pulse train
   * @returns {Qubit} Qubit to forward to Bob
   */
  intercept(qubit, index) {
    if (Math.random() >= this.interceptRate) {
      // Eve does not intercept this photon; it passes undisturbed
      return qubit;
    }

    this.interceptedCount++;

    if (this.strategy === 'intercept-resend') {
      // Eve guesses a measurement basis at random
      const eveBasis = getRandomBasis();
      
      // Eve measures the qubit (causing state collapse!)
      const measuredBit = qubit.measure(eveBasis);

      this.knownBits.push({
        index,
        basis: eveBasis,
        bit: measuredBit
      });

      // Eve prepares a new qubit in her measurement basis and sends it along to Bob
      return Qubit.prepare(measuredBit, eveBasis);
    }

    return qubit;
  }

  /**
   * Calculate mutual information I(A; E) known to Eve after sifting
   * @param {Array<number>} aliceSiftedIndices - Sifted bit indices agreed upon by Alice & Bob
   * @param {Array<number>} aliceSiftedBits - Alice's actual sifted bits
   * @returns {object} Statistics on Eve's captured knowledge
   */
  analyzeCapturedKnowledge(aliceSiftedIndices, aliceSiftedBits) {
    let correctlyGuessed = 0;
    let interceptedInSifted = 0;

    const eveMap = new Map();
    for (const item of this.knownBits) {
      eveMap.set(item.index, item);
    }

    for (let i = 0; i < aliceSiftedIndices.length; i++) {
      const idx = aliceSiftedIndices[i];
      if (eveMap.has(idx)) {
        interceptedInSifted++;
        const eveRecord = eveMap.get(idx);
        if (eveRecord.bit === aliceSiftedBits[i]) {
          correctlyGuessed++;
        }
      }
    }

    return {
      totalIntercepted: this.interceptedCount,
      interceptedInSifted,
      correctlyGuessed,
      leakageRatio: aliceSiftedBits.length > 0 ? (correctlyGuessed / aliceSiftedBits.length) : 0
    };
  }
}

module.exports = { Eavesdropper };

