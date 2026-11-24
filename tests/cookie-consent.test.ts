import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSENT_COOKIE_NAME,
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  createConsentRecord,
  enforceConsentStoragePolicy,
  OPTIONAL_FUNCTIONAL_SESSION_STORAGE_KEYS,
  OPTIONAL_FUNCTIONAL_STORAGE_KEYS,
  parseAndValidateConsentRecord,
  readCookieFromHeader,
  serializeConsentCookie,
  StorageLike,
} from '../lib/cookie-consent';

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

test('createConsentRecord builds valid records for accept_all, reject_optional, and custom', () => {
  const fixedTime = '2026-11-24T08:00:00.000Z';

  const acceptAll = createConsentRecord('accept_all', undefined, fixedTime);
  assert.equal(acceptAll.version, CONSENT_POLICY_VERSION);
  assert.equal(acceptAll.decision, 'accept_all');
  assert.equal(acceptAll.timestamp, fixedTime);
  assert.deepEqual(acceptAll.categories, { essential: true, functional: true });

  const rejectOptional = createConsentRecord('reject_optional', undefined, fixedTime);
  assert.equal(rejectOptional.decision, 'reject_optional');
  assert.deepEqual(rejectOptional.categories, { essential: true, functional: false });

  const customOn = createConsentRecord('custom', { functional: true }, fixedTime);
  assert.equal(customOn.decision, 'custom');
  assert.deepEqual(customOn.categories, { essential: true, functional: true });

  const customOff = createConsentRecord('custom', { functional: false }, fixedTime);
  assert.equal(customOff.decision, 'custom');
  assert.deepEqual(customOff.categories, { essential: true, functional: false });
});

test('parseAndValidateConsentRecord validates version, structure, and rejects older policy versions', () => {
  const record = createConsentRecord('accept_all', undefined, '2026-11-24T08:00:00.000Z');
  const json = JSON.stringify(record);

  const parsed = parseAndValidateConsentRecord(json, CONSENT_POLICY_VERSION);
  assert.deepEqual(parsed, record);

  // Material policy version change invalidates old consent so user is re-prompted
  const invalidatedByNewVersion = parseAndValidateConsentRecord(json, '2027.1');
  assert.equal(invalidatedByNewVersion, null);

  // Malformed JSON or invalid fields
  assert.equal(parseAndValidateConsentRecord('not-json'), null);
  assert.equal(parseAndValidateConsentRecord(null), null);
  assert.equal(
    parseAndValidateConsentRecord(
      JSON.stringify({ ...record, categories: { essential: false, functional: true } })
    ),
    null
  );
});

test('serializeConsentCookie and readCookieFromHeader round-trip consent record with security attributes', () => {
  const record = createConsentRecord('custom', { functional: true }, '2026-11-24T08:00:00.000Z');
  const cookieStr = serializeConsentCookie(record, true);

  assert.ok(cookieStr.startsWith(`${CONSENT_COOKIE_NAME}=`));
  assert.ok(cookieStr.includes('Path=/'));
  assert.ok(cookieStr.includes('SameSite=Lax'));
  assert.ok(cookieStr.includes('Secure'));

  const headerSimulation = `sb-project-auth-token=xyz123; ${cookieStr.split(';')[0]}; theme=warm`;
  const extracted = readCookieFromHeader(headerSimulation, CONSENT_COOKIE_NAME);
  const parsed = parseAndValidateConsentRecord(extracted);
  assert.deepEqual(parsed, record);
});

test('enforceConsentStoragePolicy purges optional localStorage and sessionStorage keys when rejected while preserving essential data', () => {
  const localStore = new MemoryStorage();
  const sessionStore = new MemoryStorage();

  // Seed essential consent record and optional functional keys in both localStorage and sessionStorage
  localStore.setItem(CONSENT_STORAGE_KEY, '{"essential":true}');
  for (const key of OPTIONAL_FUNCTIONAL_STORAGE_KEYS) {
    localStore.setItem(key, 'sample-optional-data');
  }
  for (const key of OPTIONAL_FUNCTIONAL_SESSION_STORAGE_KEYS) {
    sessionStore.setItem(key, '1');
  }

  // When functional is granted, nothing is purged
  const grantedRecord = createConsentRecord('accept_all');
  const grantedResult = enforceConsentStoragePolicy(grantedRecord, localStore, sessionStore);
  assert.equal(grantedResult.purgedKeys.length, 0);
  assert.equal(grantedResult.purgedSessionKeys.length, 0);
  for (const key of OPTIONAL_FUNCTIONAL_STORAGE_KEYS) {
    assert.equal(localStore.getItem(key), 'sample-optional-data');
  }
  for (const key of OPTIONAL_FUNCTIONAL_SESSION_STORAGE_KEYS) {
    assert.equal(sessionStore.getItem(key), '1');
  }

  // When functional is rejected, all optional localStorage and sessionStorage keys are purged,
  // while essential consent data remains intact
  const rejectedRecord = createConsentRecord('reject_optional');
  const rejectedResult = enforceConsentStoragePolicy(rejectedRecord, localStore, sessionStore);
  assert.equal(rejectedResult.purgedKeys.length, OPTIONAL_FUNCTIONAL_STORAGE_KEYS.length);
  assert.equal(
    rejectedResult.purgedSessionKeys.length,
    OPTIONAL_FUNCTIONAL_SESSION_STORAGE_KEYS.length
  );
  for (const key of OPTIONAL_FUNCTIONAL_STORAGE_KEYS) {
    assert.equal(localStore.getItem(key), null);
  }
  for (const key of OPTIONAL_FUNCTIONAL_SESSION_STORAGE_KEYS) {
    assert.equal(sessionStore.getItem(key), null);
  }
  assert.equal(localStore.getItem(CONSENT_STORAGE_KEY), '{"essential":true}');
});
