const test = require('node:test');
const assert = require('node:assert');
const { BB84Simulation } = require('../../src/protocols/bb84');

test('BB84: Secure generation with 0 noise and no Eve', () => {
  const result = BB84Simulation.run({
    qubits: 800,
    noiseRate: 0.0,
    eveInterceptRate: 0.0,
    sampleFraction: 0.25
  });

  assert.strictEqual(result.aborted, false, 'Protocol should not abort');
  assert.strictEqual(result.keysMatch, true, 'Alice and Bob keys must match');
  assert.ok(result.sharedKeyLength > 0, 'Shared key length must be > 0');
  assert.strictEqual(result.qberResult.qber, 0, 'QBER must be 0 with 0 noise');
});

test('BB84: Eavesdropping detection aborts protocol when Eve intercepts heavily', () => {
  const result = BB84Simulation.run({
    qubits: 1200,
    noiseRate: 0.0,
    eveInterceptRate: 0.6, // Heavy eavesdropping
    qberThreshold: 0.11
  });

  assert.strictEqual(result.aborted, true, 'Protocol must abort due to high QBER');
  assert.ok(result.qberResult.qber > 0.11, 'QBER must exceed 11% threshold');
  assert.strictEqual(result.finalKey, null, 'No key should be emitted when aborted');
});

test('BB84: Sifting efficiency is approximately 50%', () => {
  const result = BB84Simulation.run({
    qubits: 2000,
    noiseRate: 0.0,
    eveInterceptRate: 0.0
  });

  // Expected ~50% basis match within statistical tolerance
  const ratio = result.sifting.siftingEfficiency;
  assert.ok(ratio > 0.44 && ratio < 0.56, `Efficiency ${ratio} should be ~0.50`);
});

