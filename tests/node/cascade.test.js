const test = require('node:test');
const assert = require('node:assert');
const { CascadeReconciliation } = require('../../src/postprocessing/cascade');

test('Cascade: Corrects multiple bit flip errors in raw key', () => {
  const length = 200;
  const aliceKey = Array.from({ length }, () => Math.random() < 0.5 ? 1 : 0);
  const bobKey = [...aliceKey];

  // Introduce 6 intentional errors (3% error rate)
  const errorIndices = [12, 45, 78, 103, 142, 189];
  for (const idx of errorIndices) {
    bobKey[idx] ^= 1;
  }

  const cascade = new CascadeReconciliation({ numPasses: 4 });
  const result = cascade.reconcile(aliceKey, bobKey, 0.03);

  assert.strictEqual(result.isSuccess, true, 'Cascade must reconcile all errors');
  assert.strictEqual(result.remainingErrors, 0, 'No remaining errors');
  assert.deepStrictEqual(result.bobReconciled, aliceKey, 'Bob key must match Alice key exactly');
});

