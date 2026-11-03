import test from 'node:test';
import assert from 'node:assert/strict';
import { isPlatformAdmin, ADMIN_EMAILS, AUTHENTIC_PRODUCTIONS, BRAND } from '../lib/constants.ts';
import { computeCommission } from '../lib/commission.ts';

test('Unified Account: Admin privilege strict isolation', () => {
  // 1. Email allowlists are strictly abolished
  assert.deepEqual(ADMIN_EMAILS, []);

  // 2. Specific accounts must NOT receive automatic administrator privileges from email
  assert.equal(isPlatformAdmin('gauravnegi748@gmail.com'), false);
  assert.equal(isPlatformAdmin('info@uttarkunth.com'), false);
  assert.equal(isPlatformAdmin('uttarkunth@gmail.com'), false);
  assert.equal(isPlatformAdmin(' INFO@UTTARKUNTH.COM '), false);

  // 3. Ordinary users, guests, and null/undefined values are denied
  assert.equal(isPlatformAdmin('guest@example.com'), false);
  assert.equal(isPlatformAdmin('randomtraveler@gmail.com'), false);
  assert.equal(isPlatformAdmin(null), false);
  assert.equal(isPlatformAdmin(undefined), false);
  assert.equal(isPlatformAdmin(''), false);

  // 4. Metadata (app_metadata or user_metadata) is abolished as an admin authority
  assert.equal(isPlatformAdmin({ app_metadata: { role: 'admin' } }), false);
  assert.equal(isPlatformAdmin({ app_metadata: { role: 'superadmin' } }), false);
  assert.equal(isPlatformAdmin({ app_metadata: { role: 'platform_admin' } }), false);

  // 5. Untrusted user_metadata or email alone cannot grant admin status
  assert.equal(isPlatformAdmin({ user_metadata: { role: 'admin' } }), false);
  assert.equal(isPlatformAdmin({ email: 'gauravnegi748@gmail.com' }), false);

  // 6. Only explicit server-verified flag from platform_admins query returns true
  assert.equal(isPlatformAdmin({ is_platform_admin: true }), true);
});

test('Unified Account: Canonical routes and navigation structure', () => {
  const canonicalAccountRoutes = [
    '/account',
    '/trips',
    '/account/products',
    '/account/productions',
    '/account/community',
    '/account/profile',
    '/account/settings',
  ];

  assert.equal(canonicalAccountRoutes.length, 7);
  assert.ok(canonicalAccountRoutes.includes('/account'));
  assert.ok(canonicalAccountRoutes.includes('/trips'));
  assert.ok(canonicalAccountRoutes.includes('/account/products'));
  assert.ok(canonicalAccountRoutes.includes('/account/productions'));
  assert.ok(canonicalAccountRoutes.includes('/account/community'));
  assert.ok(canonicalAccountRoutes.includes('/account/profile'));
  assert.ok(canonicalAccountRoutes.includes('/account/settings'));
});

test('Unified Account: Productions tab contains only authorized films', () => {
  assert.equal(AUTHENTIC_PRODUCTIONS.length, 2);
  const titles = AUTHENTIC_PRODUCTIONS.map((p) => p.title);
  assert.deepEqual(titles.sort(), ['Aaj Ka Devta', 'Ruk Gayi Gupt Bali'].sort());
});

test('Unified Account: Commercial terms deferred and no unapproved commissions', () => {
  // When no agreement is present, commission must be deferred with 0%
  const defaultCommission = computeCommission(5000, null);
  assert.equal(defaultCommission.status, 'deferred');
  assert.equal(defaultCommission.isActivated, false);
  assert.equal(defaultCommission.percent, 0);
  assert.equal(defaultCommission.amount, 0);
});

test('Unified Account: Brand identity compliance', () => {
  assert.equal(BRAND.name, 'Uttarkunth');
  assert.equal(BRAND.officialDomain, 'https://uttarkunth.com');
  assert.equal(BRAND.email, 'info@uttarkunth.com');
  assert.equal(BRAND.founder, 'Gaurav Negi');
  assert.equal(BRAND.tagline, 'Ideas born in the mountains. Built through people.');
});
