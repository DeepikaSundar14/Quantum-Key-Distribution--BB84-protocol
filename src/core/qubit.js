const { Basis } = require('./basis');

/**
 * Quantum Bit (Qubit) representation in 2D Hilbert space.
 * State: |ψ> = α|0> + β|1>, with |α|² + |β|² = 1
 */
class Qubit {
  /**
   * @param {number} alpha - Amplitude for |0>
   * @param {number} beta - Amplitude for |1>
   */
  constructor(alpha = 1, beta = 0) {
    const norm = Math.sqrt(alpha * alpha + beta * beta);
    this.alpha = alpha / (norm || 1);
    this.beta = beta / (norm || 1);
    this.isCollapsed = false;
  }

  /**
   * Factory method to prepare qubit state from classical bit and basis
   * @param {number} bit - 0 or 1
   * @param {string} basis - Basis.RECTILINEAR ('+') or Basis.DIAGONAL ('x')
   * @returns {Qubit}
   */
  static prepare(bit, basis) {
    const SQRT2_INV = 1 / Math.sqrt(2);
    if (basis === Basis.RECTILINEAR) {
      // |0> or |1>
      return bit === 0 ? new Qubit(1, 0) : new Qubit(0, 1);
    } else if (basis === Basis.DIAGONAL) {
      // |+> = (|0> + |1>)/√2 or |-> = (|0> - |1>)/√2
      return bit === 0 ? new Qubit(SQRT2_INV, SQRT2_INV) : new Qubit(SQRT2_INV, -SQRT2_INV);
    }
    throw new Error(`Unsupported basis: ${basis}`);
  }

  /**
   * Measure qubit in a given basis.
   * State collapses according to Born's rule.
   * @param {string} basis - Measurement basis ('+' or 'x')
   * @returns {number} Measured bit (0 or 1)
   */
  measure(basis) {
    const SQRT2_INV = 1 / Math.sqrt(2);
    let p0;

    if (basis === Basis.RECTILINEAR) {
      // Probability of measuring |0> is |α|²
      p0 = this.alpha * this.alpha;
    } else if (basis === Basis.DIAGONAL) {
      // Projection onto |+>: <+|ψ> = (α + β)/√2 => P(|+>) = ((α + β)/√2)²
      const ampPlus = (this.alpha + this.beta) * SQRT2_INV;
      p0 = ampPlus * ampPlus;
    } else {
      throw new Error(`Unsupported measurement basis: ${basis}`);
    }

    // Clamp numerical errors
    p0 = Math.max(0, Math.min(1, p0));

    // Quantum measurement collapse (Born's rule)
    const result = Math.random() < p0 ? 0 : 1;

    // Collapse state vector
    if (basis === Basis.RECTILINEAR) {
      this.alpha = result === 0 ? 1 : 0;
      this.beta = result === 0 ? 0 : 1;
    } else {
      this.alpha = SQRT2_INV;
      this.beta = result === 0 ? SQRT2_INV : -SQRT2_INV;
    }
    this.isCollapsed = true;

    return result;
  }

  /**
   * Measure qubit along an arbitrary polarization angle in radians.
   * Used in Ekert 91 (E91) Bell CHSH inequality tests.
   * @param {number} theta - Measurement angle in radians
   * @returns {number} Measurement result: +1 or -1 (eigenvalues)
   */
  measureAtAngle(theta) {
    // Basis state |θ> = cos(θ)|0> + sin(θ)|1>
    // Projection <θ|ψ> = α cos(θ) + β sin(θ)
    const proj = this.alpha * Math.cos(theta) + this.beta * Math.sin(theta);
    let pPlus = proj * proj;
    pPlus = Math.max(0, Math.min(1, pPlus));

    const result = Math.random() < pPlus ? 1 : -1;
    this.isCollapsed = true;
    return result;
  }

  /**
   * Clone qubit helper for simulation testing (demonstrates No-Cloning theorem violation if allowed)
   */
  clone() {
    return new Qubit(this.alpha, this.beta);
  }
}

module.exports = { Qubit };

