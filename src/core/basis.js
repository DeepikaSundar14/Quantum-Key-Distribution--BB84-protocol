/**
 * Quantum Measurement and Preparation Bases
 */
const Basis = {
  RECTILINEAR: '+', // standard computational basis {|0>, |1>}
  DIAGONAL: 'x',    // Hadamard conjugate basis {|+>, |->}
  CIRCULAR: 'O'     // Circular polarization {|R>, |L>} (optional extension)
};

const BASES = [Basis.RECTILINEAR, Basis.DIAGONAL];

/**
 * Returns random basis from available bases
 */
function getRandomBasis() {
  return BASES[Math.floor(Math.random() * BASES.length)];
}

module.exports = {
  Basis,
  BASES,
  getRandomBasis
};

