export const EXPLORE_SPOTLIGHT_SESSION_KEY = 'uttarkunth_explore_spotlight_shown_v1';
export const EXPLORE_SPOTLIGHT_PEAK_MS = 320;
export const EXPLORE_SPOTLIGHT_FADEOUT_MS = 850;
export const EXPLORE_SPOTLIGHT_DURATION_MS =
  EXPLORE_SPOTLIGHT_PEAK_MS + EXPLORE_SPOTLIGHT_FADEOUT_MS;

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Pure check for whether the "Explore Uttarkunth" card + search bar
 * scale-and-lighten transition should run in the current browser session.
 */
export function shouldTriggerExploreSpotlight(
  storage: Pick<SessionStorageLike, 'getItem'> | null | undefined,
  inMemoryAlreadyShown: boolean
): boolean {
  if (inMemoryAlreadyShown) {
    return false;
  }
  if (!storage) {
    return true;
  }
  try {
    return storage.getItem(EXPLORE_SPOTLIGHT_SESSION_KEY) !== '1';
  } catch {
    return true;
  }
}

/**
 * Marks the current session as having triggered the transition
 * and returns true only on the first invocation in the session.
 */
export function consumeExploreSpotlightSession(
  storage: SessionStorageLike | null | undefined,
  inMemoryRef: { current: boolean }
): boolean {
  if (!shouldTriggerExploreSpotlight(storage, inMemoryRef.current)) {
    return false;
  }

  inMemoryRef.current = true;
  if (storage) {
    try {
      storage.setItem(EXPLORE_SPOTLIGHT_SESSION_KEY, '1');
    } catch {
      // Ignore storage quota or privacy mode errors; inMemoryRef still prevents repeats
    }
  }
  return true;
}
