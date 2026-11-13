import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPLORE_SPOTLIGHT_SESSION_KEY,
  EXPLORE_SPOTLIGHT_PEAK_MS,
  EXPLORE_SPOTLIGHT_FADEOUT_MS,
  EXPLORE_SPOTLIGHT_DURATION_MS,
  shouldTriggerExploreSpotlight,
  consumeExploreSpotlightSession,
  type SessionStorageLike,
} from '../lib/explore-spotlight';

function createMockSessionStorage(): SessionStorageLike & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

test('shouldTriggerExploreSpotlight returns true on a fresh session and false once marked', () => {
  const storage = createMockSessionStorage();
  assert.equal(shouldTriggerExploreSpotlight(storage, false), true);

  storage.setItem(EXPLORE_SPOTLIGHT_SESSION_KEY, '1');
  assert.equal(shouldTriggerExploreSpotlight(storage, false), false);
});

test('consumeExploreSpotlightSession triggers only on the first interaction per session', () => {
  const storage = createMockSessionStorage();
  const inMemoryRef = { current: false };

  // First click in a new session triggers the transition
  const firstTap = consumeExploreSpotlightSession(storage, inMemoryRef);
  assert.equal(firstTap, true);
  assert.equal(inMemoryRef.current, true);
  assert.equal(storage.getItem(EXPLORE_SPOTLIGHT_SESSION_KEY), '1');

  // Second and third clicks in the same session do not trigger the transition
  const secondTap = consumeExploreSpotlightSession(storage, inMemoryRef);
  assert.equal(secondTap, false);

  // Even if component remounts in the same session (new inMemoryRef), sessionStorage prevents repeat
  const remountedRef = { current: false };
  const tapAfterRemountSameSession = consumeExploreSpotlightSession(storage, remountedRef);
  assert.equal(tapAfterRemountSameSession, false);
});

test('new session allows spotlight transition again and duration supports peak light-up and slow fade-out', () => {
  const newSessionStorage = createMockSessionStorage();
  const newSessionRef = { current: false };

  assert.equal(consumeExploreSpotlightSession(newSessionStorage, newSessionRef), true);
  assert.ok(EXPLORE_SPOTLIGHT_PEAK_MS >= 250);
  assert.ok(EXPLORE_SPOTLIGHT_FADEOUT_MS >= 700);
  assert.equal(EXPLORE_SPOTLIGHT_DURATION_MS, EXPLORE_SPOTLIGHT_PEAK_MS + EXPLORE_SPOTLIGHT_FADEOUT_MS);
});
