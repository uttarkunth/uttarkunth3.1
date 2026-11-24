export const CONSENT_STORAGE_KEY = 'uttarkunth_cookie_consent_v1';
export const CONSENT_COOKIE_NAME = 'uttarkunth_cookie_consent_v1';
export const CONSENT_POLICY_VERSION = '2026.1';
export const CONSENT_UPDATED_EVENT = 'uttarkunth:cookie-consent-updated';
export const OPEN_COOKIE_PREFERENCES_EVENT = 'uttarkunth:open-cookie-preferences';

/**
 * Optional persistent client-side localStorage keys used across Uttarkunth for user preferences
 * and convenience features. Governed by the Functional / Preference category.
 */
export const OPTIONAL_FUNCTIONAL_STORAGE_KEYS = [
  'uttarkunth_saved_items_v1',
  'uttarkunth_hero_recent_stays_v1',
  'uttarkunth_hero_recent_products_v1',
  'uttarkunth_hero_recent_originals_v1',
  'uttarkunth_read_notification_ids',
] as const;

/**
 * Optional single-tab sessionStorage keys used for UI animation suppression
 * (brand intro splash screen and homepage pillar spotlight).
 * Governed by the Functional / Preference category.
 */
export const OPTIONAL_FUNCTIONAL_SESSION_STORAGE_KEYS = [
  'uk_splash_seen',
  'uttarkunth_explore_spotlight_shown_v1',
] as const;

export type ConsentDecisionType = 'accept_all' | 'reject_optional' | 'custom';

export interface ConsentCategories {
  /**
   * Required for core site operation, security headers, CSRF protection,
   * consent persistence, and @supabase/ssr cookie-based authentication sessions. Always true.
   */
  essential: true;
  /**
   * Remembers optional visitor preferences and UI state in localStorage and sessionStorage:
   * saved stays/products favourites, recent search history (max 5 per pillar),
   * local notification read status, and single-tab intro animation flags.
   */
  functional: boolean;
}

export interface CookieConsentRecord {
  version: string;
  decision: ConsentDecisionType;
  timestamp: string;
  categories: ConsentCategories;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Creates a normalized, versioned CookieConsentRecord for a given user action.
 */
export function createConsentRecord(
  decision: ConsentDecisionType,
  customCategories?: Partial<Omit<ConsentCategories, 'essential'>>,
  nowIso?: string
): CookieConsentRecord {
  const timestamp = nowIso || new Date().toISOString();

  let functional = false;
  if (decision === 'accept_all') {
    functional = true;
  } else if (decision === 'reject_optional') {
    functional = false;
  } else {
    functional = Boolean(customCategories?.functional);
  }

  return {
    version: CONSENT_POLICY_VERSION,
    decision,
    timestamp,
    categories: {
      essential: true,
      functional,
    },
  };
}

/**
 * Parses and validates a stored JSON consent string.
 * Returns null if missing, malformed, or from an older policy version
 * (so a material policy update re-requests consent).
 */
export function parseAndValidateConsentRecord(
  raw: string | null | undefined,
  expectedVersion: string = CONSENT_POLICY_VERSION
): CookieConsentRecord | null {
  if (!raw || typeof raw !== 'string') return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    if (parsed.version !== expectedVersion) {
      return null;
    }

    if (
      parsed.decision !== 'accept_all' &&
      parsed.decision !== 'reject_optional' &&
      parsed.decision !== 'custom'
    ) {
      return null;
    }

    if (
      typeof parsed.timestamp !== 'string' ||
      parsed.timestamp.trim().length === 0
    ) {
      return null;
    }

    if (
      !parsed.categories ||
      typeof parsed.categories !== 'object' ||
      parsed.categories.essential !== true ||
      typeof parsed.categories.functional !== 'boolean'
    ) {
      return null;
    }

    return {
      version: parsed.version,
      decision: parsed.decision,
      timestamp: parsed.timestamp,
      categories: {
        essential: true,
        functional: parsed.categories.functional,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Builds the HTTP cookie string with appropriate security attributes.
 */
export function serializeConsentCookie(
  record: CookieConsentRecord,
  isSecureContext: boolean = false
): string {
  const encoded = encodeURIComponent(JSON.stringify(record));
  const maxAgeSeconds = 365 * 24 * 60 * 60; // 365 days (31,536,000 seconds)
  const secureFlag = isSecureContext ? '; Secure' : '';
  return `${CONSENT_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
}

/**
 * Reads a cookie value from a document.cookie string.
 */
export function readCookieFromHeader(
  cookieHeader: string,
  cookieName: string = CONSENT_COOKIE_NAME
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${cookieName}=`)) {
      const rawVal = trimmed.slice(cookieName.length + 1);
      try {
        return decodeURIComponent(rawVal);
      } catch {
        return rawVal;
      }
    }
  }
  return null;
}

/**
 * Enforces the consent decision against browser localStorage and sessionStorage.
 * When functional consent is false, purges all optional functional preference keys
 * from localStorage and optional UI animation flags from sessionStorage,
 * while preserving essential consent records and Supabase authentication cookies/sessions.
 */
export function enforceConsentStoragePolicy(
  record: CookieConsentRecord | null,
  localStore: StorageLike | null | undefined,
  sessionStore?: StorageLike | null | undefined
): { purgedKeys: string[]; purgedSessionKeys: string[] } {
  const purgedKeys: string[] = [];
  const purgedSessionKeys: string[] = [];

  const allowFunctional = Boolean(record?.categories?.functional);
  if (!allowFunctional) {
    if (localStore) {
      for (const key of OPTIONAL_FUNCTIONAL_STORAGE_KEYS) {
        try {
          if (localStore.getItem(key) !== null) {
            localStore.removeItem(key);
            purgedKeys.push(key);
          }
        } catch {
          // Ignore storage access errors in restricted contexts
        }
      }
    }

    if (sessionStore) {
      for (const key of OPTIONAL_FUNCTIONAL_SESSION_STORAGE_KEYS) {
        try {
          if (sessionStore.getItem(key) !== null) {
            sessionStore.removeItem(key);
            purgedSessionKeys.push(key);
          }
        } catch {
          // Ignore sessionStorage access errors in restricted contexts
        }
      }
    }
  }

  return { purgedKeys, purgedSessionKeys };
}

/**
 * Loads the current valid CookieConsentRecord from browser storage (localStorage or cookie fallback).
 */
export function getStoredCookieConsent(): CookieConsentRecord | null {
  if (typeof window === 'undefined') return null;

  try {
    const fromStorage = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    const validatedStorage = parseAndValidateConsentRecord(fromStorage);
    if (validatedStorage) return validatedStorage;
  } catch {
    // Fallback to document.cookie
  }

  try {
    const fromCookie = readCookieFromHeader(document.cookie, CONSENT_COOKIE_NAME);
    const validatedCookie = parseAndValidateConsentRecord(fromCookie);
    if (validatedCookie) {
      try {
        window.localStorage.setItem(
          CONSENT_STORAGE_KEY,
          JSON.stringify(validatedCookie)
        );
      } catch {
        // Ignore localStorage write errors
      }
      return validatedCookie;
    }
  } catch {
    // Ignore cookie read errors
  }

  return null;
}

/**
 * Saves and enforces the user's cookie consent record across localStorage, document.cookie,
 * sessionStorage, HTML data attributes, and dispatches the global update event.
 */
export function saveAndEnforceCookieConsent(
  record: CookieConsentRecord
): CookieConsentRecord {
  if (typeof window === 'undefined') return record;

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore quota/private mode errors
  }

  try {
    const isHttps = window.location.protocol === 'https:';
    document.cookie = serializeConsentCookie(record, isHttps);
  } catch {
    // Ignore cookie errors
  }

  try {
    enforceConsentStoragePolicy(record, window.localStorage, window.sessionStorage);
  } catch {
    // Ignore enforcement errors
  }

  try {
    document.documentElement.setAttribute(
      'data-uk-consent-functional',
      record.categories.functional ? 'granted' : 'denied'
    );
    document.documentElement.setAttribute(
      'data-uk-consent-decision',
      record.decision
    );
  } catch {
    // Ignore DOM attribute errors
  }

  window.dispatchEvent(
    new CustomEvent<CookieConsentRecord>(CONSENT_UPDATED_EVENT, {
      detail: record,
    })
  );

  return record;
}

/**
 * Returns true ONLY if the visitor has explicitly granted consent for Functional / Preference storage.
 * Prior to consent (or after Reject Optional), returns false so optional preferences are not persisted.
 */
export function isFunctionalStorageAllowed(): boolean {
  const record = getStoredCookieConsent();
  return Boolean(record?.categories?.functional);
}

/**
 * Triggers the global Cookie Preferences modal to open from anywhere in the application (e.g., Footer).
 */
export function openCookiePreferencesModal(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES_EVENT));
}
