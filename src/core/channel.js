const { Qubit } = require('./qubit');
const { getRandomBasis } = require('./basis');

/**
 * Quantum Channel simulating physical optical fiber or free-space transmission.
 * Supports depolarizing channel noise, attenuation, and eavesdropper integration.
 */
class QuantumChannel {
  /**
   * @param {object} options
   * @param {number} options.noiseRate - Depolarization noise probability (0.0 to 1.0)
   * @param {number} options.lossRate - Photon loss / attenuation probability (0.0 to 1.0)
   * @param {object|null} options.eavesdropper - Optional Eavesdropper instance attached to line
   */
  constructor(options = {}) {
    this.noiseRate = options.noiseRate !== undefined ? options.noiseRate : 0.0;
    this.lossRate = options.lossRate !== undefined ? options.lossRate : 0.0;
    this.eavesdropper = options.eavesdropper || null;
  }

  /**
   * Transmit a qubit through the quantum channel.
   * @param {Qubit} qubit - The emitted qubit from Alice
   * @param {number} index - Index of the pulse in sequence
   * @returns {Qubit|null} Delivered qubit to Bob, or null if lost to attenuation
   */
  transmit(qubit, index) {
    // 1. Physical attenuation / photon loss check
    if (this.lossRate > 0 && Math.random() < this.lossRate) {
      return null; // Photon lost in optical fiber
    }

    let flyingQubit = qubit;

    // 2. Eavesdropper interception (if Eve is tapping the channel)
    if (this.eavesdropper) {
      flyingQubit = this.eavesdropper.intercept(flyingQubit, index);
    }

    // 3. Environmental depolarizing channel noise
    if (this.noiseRate > 0 && Math.random() < this.noiseRate) {
      // Depolarizing noise introduces random state perturbation
      const randomBasis = getRandomBasis();
      const randomBit = Math.random() < 0.5 ? 0 : 1;
      flyingQubit = Qubit.prepare(randomBit, randomBasis);
    }

    return flyingQubit;
  }
}

module.exports = { QuantumChannel };

