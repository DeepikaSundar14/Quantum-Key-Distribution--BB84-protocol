const { Basis, BASES, getRandomBasis } = require('./core/basis');
const { Qubit } = require('./core/qubit');
const { QuantumChannel } = require('./core/channel');
const { Eavesdropper } = require('./attacks/eve');
const { siftKeys } = require('./postprocessing/sifting');
const { estimateQBER, binaryEntropy } = require('./postprocessing/qber');
const { CascadeReconciliation } = require('./postprocessing/cascade');
const { PrivacyAmplification } = require('./postprocessing/privacy');
const { OneTimePad } = require('./crypto/otp');
const { BB84Simulation } = require('./protocols/bb84');
const { E91Simulation } = require('./protocols/e91');

module.exports = {
  Basis,
  BASES,
  getRandomBasis,
  Qubit,
  QuantumChannel,
  Eavesdropper,
  siftKeys,
  estimateQBER,
  binaryEntropy,
  CascadeReconciliation,
  PrivacyAmplification,
  OneTimePad,
  BB84Simulation,
  E91Simulation
};

