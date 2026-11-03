const test = require('node:test');
const assert = require('node:assert');
const { E91Simulation } = require('../../src/protocols/e91');

test('E91: Bell Inequality violation without eavesdropping', () => {
  const result = E91Simulation.run({
    pairs: 3500,
    eveInterceptRate: 0.0
  });

  // Quantum correlation S should violate classical limit of 2.0 (theoretical ~2.8284)
  assert.ok(result.chsh.S > 2.5, `CHSH S=${result.chsh.S} should clearly exceed 2.5`);
  assert.strictEqual(result.chsh.bellViolated, true, 'Bell inequality must be violated');
  assert.strictEqual(result.keyGeneration.keyAgreement, true, 'Coincident bases must match');
});

test('E91: Eavesdropping destroys entanglement and fails Bell violation', () => {
  const result = E91Simulation.run({
    pairs: 3000,
    eveInterceptRate: 0.9 // Severe eavesdropping
  });

  // When Eve intercepts, state becomes classical, so S <= 2.0
  assert.ok(result.chsh.S <= 2.1, `CHSH S=${result.chsh.S} should drop towards or below classical 2.0`);
});

