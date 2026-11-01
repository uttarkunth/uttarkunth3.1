import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCommission } from '../lib/commission.ts';

test('Commission during introductory period (0% for first 12 months)', () => {
  // Agreement started 2 months ago
  const start = new Date();
  start.setMonth(start.getMonth() - 2);

  const snapshot = computeCommission(10000, start.toISOString());
  assert.equal(snapshot.isIntroductory, true);
  assert.equal(snapshot.percent, 0);
  assert.equal(snapshot.amount, 0);
});

test('Commission after introductory period expires (10% standard rate)', () => {
  // Agreement started 14 months ago
  const start = new Date();
  start.setMonth(start.getMonth() - 14);

  const snapshot = computeCommission(10000, start.toISOString());
  assert.equal(snapshot.isIntroductory, false);
  assert.equal(snapshot.percent, 10);
  assert.equal(snapshot.amount, 1000); // 10% of 10,000 = 1,000
});

test('Commission without agreement date defaults to intro rate (0)', () => {
  const snapshot = computeCommission(5000, null);
  assert.equal(snapshot.percent, 0);
  assert.equal(snapshot.amount, 0);
});
