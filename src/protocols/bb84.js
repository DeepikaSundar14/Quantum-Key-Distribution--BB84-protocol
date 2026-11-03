const { getRandomBasis } = require('../core/basis');
const { Qubit } = require('../core/qubit');
const { QuantumChannel } = require('../core/channel');
const { Eavesdropper } = require('../attacks/eve');
const { siftKeys } = require('../postprocessing/sifting');
const { estimateQBER } = require('../postprocessing/qber');
const { CascadeReconciliation } = require('../postprocessing/cascade');
const { PrivacyAmplification } = require('../postprocessing/privacy');

/**
 * BB84 Quantum Key Distribution Protocol (Bennett & Brassard 1984)
 */
class BB84Simulation {
  /**
   * Run a complete end-to-end BB84 simulation
   * @param {object} options
   * @param {number} options.qubits - Total number of qubits emitted by Alice
   * @param {number} options.noiseRate - Depolarizing channel noise [0.0 - 1.0]
   * @param {number} options.lossRate - Channel attenuation / photon loss [0.0 - 1.0]
   * @param {number} options.eveInterceptRate - Eve's interception rate [0.0 - 1.0]
   * @param {number} options.sampleFraction - Portion of sifted key sacrificed for QBER
   * @param {number} options.qberThreshold - Security abort limit (default 0.11)
   * @param {boolean} options.enableErrorCorrection - Run Cascade reconciliation
   * @param {boolean} options.enablePrivacyAmplification - Run universal hashing compression
   * @returns {object} Full simulation report and keys
   */
  static run(options = {}) {
    const numQubits = options.qubits || 1000;
    const noiseRate = options.noiseRate || 0.0;
    const lossRate = options.lossRate || 0.0;
    const eveInterceptRate = options.eveInterceptRate || 0.0;
    const sampleFraction = options.sampleFraction || 0.25;
    const qberThreshold = options.qberThreshold || 0.11;
    const enableErrorCorrection = options.enableErrorCorrection !== false;
    const enablePrivacyAmplification = options.enablePrivacyAmplification !== false;

    // Step 1: Alice generates random bits and random bases
    const aliceBits = [];
    const aliceBases = [];
    for (let i = 0; i < numQubits; i++) {
      aliceBits.push(Math.random() < 0.5 ? 0 : 1);
      aliceBases.push(getRandomBasis());
    }

    // Prepare eavesdropper if active
    let eve = null;
    if (eveInterceptRate > 0) {
      eve = new Eavesdropper({ interceptRate: eveInterceptRate });
    }

    // Step 2: Transmit qubits across quantum channel to Bob
    const channel = new QuantumChannel({
      noiseRate,
      lossRate,
      eavesdropper: eve
    });

    const bobBases = [];
    const bobBits = [];

    for (let i = 0; i < numQubits; i++) {
      const qubit = Qubit.prepare(aliceBits[i], aliceBases[i]);
      const deliveredQubit = channel.transmit(qubit, i);

      if (deliveredQubit === null) {
        // Photon lost to attenuation
        bobBases.push(null);
        bobBits.push(null);
      } else {
        // Bob selects a random measurement basis
        const bBasis = getRandomBasis();
        bobBases.push(bBasis);
        const measuredBit = deliveredQubit.measure(bBasis);
        bobBits.push(measuredBit);
      }
    }

    // Step 3: Classical Sifting
    const sifting = siftKeys(aliceBases, bobBases, aliceBits, bobBits);

    // Step 4: QBER Estimation & Security Check
    const qberResult = estimateQBER(
      sifting.aliceSifted,
      sifting.bobSifted,
      sampleFraction,
      qberThreshold
    );

    // If Eve or noise caused QBER to exceed threshold, protocol aborts!
    if (!qberResult.isSecure) {
      return {
        aborted: true,
        reason: `QBER (${(qberResult.qber * 100).toFixed(2)}%) exceeded security threshold (${(qberThreshold * 100).toFixed(1)}%). Eavesdropping or channel interference detected!`,
        numQubits,
        eveActive: eveInterceptRate > 0,
        eveInterceptRate,
        noiseRate,
        sifting,
        qberResult,
        reconciliation: null,
        privacy: null,
        finalKey: null,
        sharedKeyLength: 0
      };
    }

    // Step 5: Information Reconciliation (Cascade error correction)
    let reconciliation = null;
    let aliceKey = qberResult.aliceKey;
    let bobKey = qberResult.bobKey;

    if (enableErrorCorrection && aliceKey.length > 0) {
      const cascade = new CascadeReconciliation();
      reconciliation = cascade.reconcile(aliceKey, bobKey, qberResult.qber);
      aliceKey = reconciliation.aliceReconciled;
      bobKey = reconciliation.bobReconciled;
    }

    // Step 6: Privacy Amplification
    let privacy = null;
    let finalAliceKey = aliceKey;
    let finalBobKey = bobKey;

    if (enablePrivacyAmplification && aliceKey.length > 0) {
      const targetLength = PrivacyAmplification.calculateTargetLength(
        aliceKey.length,
        qberResult.qber,
        reconciliation ? reconciliation.parityChecksExchanged : 0
      );

      // Alice generates seed and applies Toeplitz universal hash
      const alicePA = PrivacyAmplification.applyToeplitz(aliceKey, targetLength);
      // Bob applies the same Toeplitz matrix using Alice's public seed
      const bobPA = PrivacyAmplification.applyToeplitz(bobKey, targetLength, alicePA.seedBits);

      privacy = {
        targetLength,
        aliceHex: alicePA.hexKey,
        bobHex: bobPA.hexKey,
        match: alicePA.hexKey === bobPA.hexKey,
        seedLength: alicePA.seedBits.length
      };

      finalAliceKey = alicePA.finalKeyBits;
      finalBobKey = bobPA.finalKeyBits;
    }

    // Eve knowledge analysis
    let eveStats = null;
    if (eve) {
      eveStats = eve.analyzeCapturedKnowledge(sifting.siftedIndices, sifting.aliceSifted);
    }

    // Verify key equality
    let keysMatch = finalAliceKey.length === finalBobKey.length;
    if (keysMatch) {
      for (let i = 0; i < finalAliceKey.length; i++) {
        if (finalAliceKey[i] !== finalBobKey[i]) {
          keysMatch = false;
          break;
        }
      }
    }

    return {
      aborted: false,
      numQubits,
      noiseRate,
      lossRate,
      eveActive: eveInterceptRate > 0,
      eveInterceptRate,
      sifting,
      qberResult,
      reconciliation,
      privacy,
      eveStats,
      keysMatch,
      sharedKeyLength: finalAliceKey.length,
      finalKey: {
        alice: finalAliceKey,
        bob: finalBobKey,
        hex: privacy ? privacy.aliceHex : Buffer.from(finalAliceKey).toString('hex')
      }
    };
  }
}

module.exports = { BB84Simulation };

