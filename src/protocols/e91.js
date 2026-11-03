/**
 * Ekert 91 (E91) Protocol (Arthur Ekert, 1991)
 * Quantum Key Distribution based on Entangled Bell Pairs and CHSH Bell Inequality.
 */

class E91Simulation {
  /**
   * Run Ekert 91 simulation
   * @param {object} options
   * @param {number} options.pairs - Number of entangled photon pairs generated
   * @param {number} options.eveInterceptRate - Eve interception probability
   * @returns {object} E91 report including CHSH Bell inequality value S
   */
  static run(options = {}) {
    const numPairs = options.pairs || 1500;
    const eveInterceptRate = options.eveInterceptRate || 0.0;

    // Alice measurement angles (in radians for photon polarization):
    // a1 = 0, a2 = pi/8 (22.5°), a3 = pi/4 (45°)
    const aliceAngles = [0, Math.PI / 8, Math.PI / 4];

    // Bob measurement angles (in radians for photon polarization):
    // b1 = pi/8 (22.5°), b2 = pi/4 (45°), b3 = 3*pi/8 (67.5°)
    const bobAngles = [Math.PI / 8, Math.PI / 4, (3 * Math.PI) / 8];

    // Track measurements for the 4 CHSH test pairs:
    // (a1, b1), (a1, b3), (a3, b1), (a3, b3)
    const correlations = {
      '0,0': [], // (a1, b1) => delta = -pi/8 => E = 1/sqrt(2)
      '0,2': [], // (a1, b3) => delta = -3pi/8 => E = -1/sqrt(2)
      '2,0': [], // (a3, b1) => delta = pi/8 => E = 1/sqrt(2)
      '2,2': []  // (a3, b3) => delta = -pi/8 => E = 1/sqrt(2)
    };

    // Shared key bits (from coincident bases a2-b1 and a3-b2)
    const aliceKey = [];
    const bobKey = [];

    let eveDetectedEvents = 0;

    for (let i = 0; i < numPairs; i++) {
      // Alice and Bob choose random measurement bases (index 0, 1, or 2)
      const aIdx = Math.floor(Math.random() * 3);
      const bIdx = Math.floor(Math.random() * 3);

      const thetaA = aliceAngles[aIdx];
      const thetaB = bobAngles[bIdx];

      let aliceOutcome;
      let bobOutcome;

      const eveIntercepted = eveInterceptRate > 0 && Math.random() < eveInterceptRate;

      if (eveIntercepted) {
        eveDetectedEvents++;
        // Eve intercepts one photon and measures in a classical angle
        const eveAngle = aliceAngles[Math.floor(Math.random() * 3)];
        const eveOutcome = Math.random() < 0.5 ? 1 : -1;

        // Classical correlation collapses entanglement:
        // P(outcome = eveOutcome) = cos^2(delta_theta)
        const pAliceSame = Math.cos(2 * (thetaA - eveAngle)) ** 2;
        aliceOutcome = Math.random() < (0.5 + 0.5 * Math.cos(2 * (thetaA - eveAngle))) ? eveOutcome : -eveOutcome;

        bobOutcome = Math.random() < (0.5 + 0.5 * Math.cos(2 * (thetaB - eveAngle))) ? eveOutcome : -eveOutcome;
      } else {
        // Entangled Bell Pair |Phi+> = (|00> + |11>)/sqrt(2)
        // Alice measures first (+1 or -1 with equal 50/50 probability)
        aliceOutcome = Math.random() < 0.5 ? 1 : -1;

        // For photon polarization Bell state, correlation is E = cos(2*(thetaA - thetaB))
        // P(Bob = Alice) = cos^2(thetaA - thetaB) = (1 + cos(2*(thetaA - thetaB))) / 2
        const delta = thetaA - thetaB;
        const pSame = (1 + Math.cos(2 * delta)) / 2;
        bobOutcome = Math.random() < pSame ? aliceOutcome : -aliceOutcome;
      }

      // Check if bases are coincident for key generation:
      // a2 (idx 1: 22.5°) with b1 (idx 0: 22.5°) OR a3 (idx 2: 45°) with b2 (idx 1: 45°)
      const isKeyGenerating = (aIdx === 1 && bIdx === 0) || (aIdx === 2 && bIdx === 1);

      if (isKeyGenerating) {
        // Map {-1, 1} to classical bits {0, 1}
        aliceKey.push(aliceOutcome === 1 ? 1 : 0);
        bobKey.push(bobOutcome === 1 ? 1 : 0);
      }

      // Record outcomes for CHSH test pairs
      const pairKey = `${aIdx},${bIdx}`;
      if (correlations[pairKey]) {
        correlations[pairKey].push(aliceOutcome * bobOutcome);
      }
    }

    const computeE = (list) => {
      if (!list || list.length === 0) return 0;
      const sum = list.reduce((acc, v) => acc + v, 0);
      return sum / list.length;
    };

    const E_a1_b1 = computeE(correlations['0,0']);
    const E_a1_b3 = computeE(correlations['0,2']);
    const E_a3_b1 = computeE(correlations['2,0']);
    const E_a3_b3 = computeE(correlations['2,2']);

    // CHSH parameter S = |E(a1, b1) - E(a1, b3) + E(a3, b1) + E(a3, b3)|
    const S = Math.abs(E_a1_b1 - E_a1_b3 + E_a3_b1 + E_a3_b3);

    // Classical local realism bound: S <= 2.
    // Quantum Bell violation: S > 2.0 (theoretical maximum 2*sqrt(2) = 2.8284)
    const bellViolated = S > 2.0;

    // Sifted key error rate
    let keyErrors = 0;
    for (let i = 0; i < aliceKey.length; i++) {
      if (aliceKey[i] !== bobKey[i]) keyErrors++;
    }
    const keyErrorRate = aliceKey.length > 0 ? keyErrors / aliceKey.length : 0;

    return {
      numPairs,
      eveInterceptRate,
      eveDetectedEvents,
      chsh: {
        S,
        theoreticalQuantum: 2 * Math.SQRT2,
        classicalBound: 2.0,
        bellViolated,
        isSecure: bellViolated && keyErrorRate < 0.11,
        E_a1_b1,
        E_a1_b3,
        E_a3_b1,
        E_a3_b3
      },
      keyGeneration: {
        rawKeyLength: aliceKey.length,
        keyErrorRate,
        keyAgreement: keyErrorRate === 0
      },
      aliceKey,
      bobKey
    };
  }
}

module.exports = { E91Simulation };
