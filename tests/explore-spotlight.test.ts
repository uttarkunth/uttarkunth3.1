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
} from '../lib/explore-spotlight.ts';
import { EXISTING_PROPERTIES } from '../lib/constants.ts';
import { getPropertyPhotoList } from '../lib/property-images.ts';

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

test('Yash Home Stay is synced with Supabase (8 total gallery photos, 4 rooms, house rules, and check-in/out times)', () => {
  const yash: any = EXISTING_PROPERTIES[0];
  assert.equal(yash.id, '7fab8bb8-a04a-462a-8124-26eb100d172f');
  assert.equal(yash.slug, 'yash-home-stay');
  assert.equal(yash.canonical_slug, 'yash-home-stay-jari-4u07');
  assert.equal(yash.rooms.length, 4, 'Yash Home Stay must have all 4 rooms synced');
  assert.ok(yash.house_rules.includes('Quiet hours after 10:00 PM'));
  assert.equal(yash.check_in_time, '12:00 PM');
  assert.equal(yash.check_out_time, '11:00 AM');

  // Verify exact 8 unique gallery photos (2 property + 4 room + 1 private washroom + 1 shared washroom)
  const seen = new Set<string>();
  const addUrls = (urls: string[]) => urls.forEach((u) => seen.add(u));

  addUrls(getPropertyPhotoList(yash.cover_photo, yash.photos));
  assert.equal(seen.size, 2, '2 property photos');

  for (const room of yash.rooms) {
    addUrls(getPropertyPhotoList(null, room.photos));
    if (room.attached_washroom) {
      addUrls(getPropertyPhotoList(null, room.washroom_photos));
    }
  }
  if (yash.rooms.some((r: any) => !r.attached_washroom)) {
    addUrls(getPropertyPhotoList(null, yash.shared_washroom_photos));
  }

  assert.equal(seen.size, 8, 'Total gallery photos for Yash Home Stay must be 8');
});
