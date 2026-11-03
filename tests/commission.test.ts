import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCommission, generateCanonicalAgreementDigest } from '../lib/commission.ts';

test('Commission is deferred and unactivated when no active agreement exists', () => {
  const snapshot = computeCommission(10000, null);
  assert.equal(snapshot.isActivated, false);
  assert.equal(snapshot.status, 'deferred');
  assert.equal(snapshot.percent, 0);
  assert.equal(snapshot.amount, 0);
  assert.equal(snapshot.hostPayout, 10000, 'Host payout must equal 100% total estimate when commission is deferred');
});

test('Unilateral agreement without demonstrable host acceptance remains deferred with 0% commission', () => {
  const start = new Date();
  start.setMonth(start.getMonth() - 2);

  // An administrator-created agreement that has NOT been accepted by the host
  const unilateralDraft = {
    agreement_start: start.toISOString(),
    intro_period_months: 6,
    intro_commission_percent: 5,
    standard_commission_percent: 8,
    agreement_status: 'active',
    accepted_at: null, // Host acceptance missing!
    terms_version: '2026.1'
  };

  const snapshot = computeCommission(10000, unilateralDraft);
  assert.equal(snapshot.isActivated, false, 'Unaccepted agreement must NOT activate commission');
  assert.equal(snapshot.status, 'deferred');
  assert.equal(snapshot.percent, 0);
  assert.equal(snapshot.amount, 0);
  assert.equal(snapshot.hostPayout, 10000, 'Host payout must equal full booking estimate without acceptance');
});

test('Draft commercial agreement yields strictly 0% commission and 100% host payout', () => {
  const start = new Date();
  start.setMonth(start.getMonth() - 1);

  const draftAgreement = {
    agreement_start: start.toISOString(),
    intro_period_months: 6,
    intro_commission_percent: 5,
    standard_commission_percent: 8,
    agreement_status: 'draft',
    accepted_at: null,
    terms_version: '2026.1'
  };

  const snapshot = computeCommission(12000, draftAgreement);
  assert.equal(snapshot.percent, 0);
  assert.equal(snapshot.amount, 0);
  assert.equal(snapshot.hostPayout, 12000);
  assert.equal(snapshot.status, 'deferred');
  assert.equal(snapshot.isActivated, false);
});

test('Expired commercial agreement yields strictly 0% commission and 100% host payout', () => {
  const agreement = {
    agreement_start: '2025-01-01',
    agreement_end: '2025-12-31',
    intro_period_months: 0,
    intro_commission_percent: 0,
    standard_commission_percent: 10,
    agreement_status: 'active',
    accepted_at: '2025-01-01T10:00:00Z',
    terms_version: '2025.1'
  };

  // Booking in 2026 after agreement expiration
  const snapshot = computeCommission(15000, agreement, '2026-06-01');
  assert.equal(snapshot.percent, 0, 'Expired agreement must yield 0% commission');
  assert.equal(snapshot.amount, 0);
  assert.equal(snapshot.hostPayout, 15000, 'Host payout must equal full booking estimate on expired agreement');
  assert.equal(snapshot.status, 'deferred');
  assert.equal(snapshot.isActivated, false);
});

test('Terminated commercial agreement yields strictly 0% commission and 100% host payout', () => {
  const terminatedAgreement = {
    agreement_start: '2026-01-01',
    agreement_end: '2026-12-31',
    intro_period_months: 0,
    intro_commission_percent: 0,
    standard_commission_percent: 10,
    agreement_status: 'terminated', // Formally terminated
    accepted_at: '2026-01-01T10:00:00Z',
    terms_version: '2026.1'
  };

  const snapshot = computeCommission(20000, terminatedAgreement, '2026-05-01');
  assert.equal(snapshot.percent, 0, 'Terminated agreement must yield 0% commission');
  assert.equal(snapshot.amount, 0);
  assert.equal(snapshot.hostPayout, 20000);
  assert.equal(snapshot.status, 'deferred');
  assert.equal(snapshot.isActivated, false);
});

test('Superseded commercial agreement yields strictly 0% commission and 100% host payout', () => {
  const supersededAgreement = {
    agreement_start: '2026-01-01',
    agreement_end: '2026-12-31',
    intro_period_months: 0,
    intro_commission_percent: 0,
    standard_commission_percent: 10,
    agreement_status: 'superseded', // Replaced by a newer version
    accepted_at: '2026-01-01T10:00:00Z',
    terms_version: '2026.1'
  };

  const snapshot = computeCommission(18000, supersededAgreement, '2026-07-01');
  assert.equal(snapshot.percent, 0, 'Superseded agreement must yield 0% commission');
  assert.equal(snapshot.amount, 0);
  assert.equal(snapshot.hostPayout, 18000);
  assert.equal(snapshot.status, 'deferred');
  assert.equal(snapshot.isActivated, false);
});

test('Calculates commission strictly from explicit terms in an active host agreement with recorded acceptance', () => {
  const start = new Date();
  start.setMonth(start.getMonth() - 2);

  const agreement = {
    agreement_start: start.toISOString(),
    intro_period_months: 6,
    intro_commission_percent: 5,
    standard_commission_percent: 8,
    agreement_status: 'active',
    accepted_at: start.toISOString(),
    terms_version: '2026.1'
  };

  const snapshot = computeCommission(10000, agreement);
  assert.equal(snapshot.isActivated, true);
  assert.equal(snapshot.status, 'active');
  assert.equal(snapshot.isIntroductory, true);
  assert.equal(snapshot.percent, 5);
  assert.equal(snapshot.amount, 500); // 5% of 10,000 = 500
  assert.equal(snapshot.hostPayout, 9500); // 10000 - 500 = 9500
});

test('Applies standard agreement rate when explicit introductory period expires on accepted agreement', () => {
  const start = new Date();
  start.setMonth(start.getMonth() - 10);

  const agreement = {
    agreement_start: start.toISOString(),
    intro_period_months: 6,
    intro_commission_percent: 5,
    standard_commission_percent: 8,
    agreement_status: 'active',
    accepted_at: start.toISOString(),
    terms_version: '2026.1'
  };

  const snapshot = computeCommission(10000, agreement);
  assert.equal(snapshot.isActivated, true);
  assert.equal(snapshot.status, 'active');
  assert.equal(snapshot.isIntroductory, false);
  assert.equal(snapshot.percent, 8);
  assert.equal(snapshot.amount, 800); // 8% of 10,000 = 800
  assert.equal(snapshot.hostPayout, 9200); // 10000 - 800 = 9200
});

test('Canonical agreement digest produces stable, deterministic SHA-256 matching PostgreSQL calculate_host_agreement_digest', () => {
  const agreement = {
    id: 'a1111111-1111-1111-1111-111111111111',
    property_id: 'b2222222-2222-2222-2222-222222222222',
    signatory_user_id: 'c3333333-3333-3333-3333-333333333333',
    agreement_start: '2026-11-01',
    agreement_end: null,
    commission_percent: 10,
    intro_commission_percent: 0,
    intro_period_months: 12,
    standard_commission_percent: 10,
    terms_version: '2026.1'
  };

  const { digest, canonicalPayload } = generateCanonicalAgreementDigest(agreement);

  // Exact known hash computed by PostgreSQL calculate_host_agreement_digest
  const expectedHash = 'f7441eb2d955d8f8ed6d057d6dbac9e90dec344afad7973acd9f8a19b29552c1';
  assert.equal(digest, expectedHash);
  assert.match(digest, /^[0-9a-f]{64}$/);
  assert.ok(canonicalPayload.includes('agreement_end=NONE'));
  assert.ok(canonicalPayload.includes('commission_percent=10.00'));
  assert.ok(canonicalPayload.includes('document_hash=54f1d67ee1294739557d9602d7b1ab0d819819de7b60d05a5a9f8a4676665af8'));
});
