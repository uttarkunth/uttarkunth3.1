export const HEADER_HEIGHT_PX = 64; // Matches h-16 (4rem) on <Header />
export const SCROLL_TOP_RESET_PX = 16;
export const MIN_SCROLL_Y_TO_HIDE_PX = 48;
export const SCROLL_DIRECTION_THRESHOLD_PX = 6;
export const HEADER_VISIBILITY_EVENT = 'uk-header-visibility-change';
export const SUBNAV_TRANSITION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const SUBNAV_TRANSITION_DURATION_MS = 300;

export interface HeaderVisibilityInput {
  currentScrollY: number;
  lastScrollY: number;
  previouslyHidden: boolean;
  accumulatedDelta?: number;
}

export interface HeaderVisibilityState {
  headerHidden: boolean;
  isScrolled: boolean;
  subnavTopOffsetPx: number;
  subnavTopCssValue: string;
  subnavTopClass: 'top-0' | 'top-16';
  nextLastScrollY: number;
  nextAccumulatedDelta: number;
}

/**
 * Pure, deterministic state machine that computes whether the primary <Header /> is hidden
 * on scroll-down or visible on scroll-up / near top, and the exact top offset for any
 * secondary navigation bar to guarantee zero layout shifts.
 *
 * Rules:
 * - Near top of page (currentScrollY <= 16): header is visible -> secondary nav sits below header (64px / top-16).
 * - Scrolling down past threshold (delta > 6 and currentScrollY > 48): header hides -> secondary nav attaches to top (0px / top-0).
 * - Scrolling up past threshold (delta < -6): header reappears -> secondary nav moves below header (64px / top-16).
 * - Micro-scrolls (-6 <= delta <= 6): preserves previous state to avoid jitter.
 */
export function computeHeaderVisibilityState({
  currentScrollY,
  lastScrollY,
  previouslyHidden,
  accumulatedDelta = 0,
}: HeaderVisibilityInput): HeaderVisibilityState {
  // Clamp negative iOS/macOS overscroll bounce to 0 so rubber-banding never causes layout shifts
  const safeCurrentY = Math.max(0, Number.isFinite(currentScrollY) ? currentScrollY : 0);
  const safeLastY = Math.max(0, Number.isFinite(lastScrollY) ? lastScrollY : 0);
  const frameDelta = safeCurrentY - safeLastY;

  // Reset accumulator when scroll direction reverses, otherwise accumulate small trackpad ticks
  const sameDirection =
    (frameDelta > 0 && accumulatedDelta >= 0) ||
    (frameDelta < 0 && accumulatedDelta <= 0);
  const effectiveDelta = sameDirection ? accumulatedDelta + frameDelta : frameDelta;

  let headerHidden = previouslyHidden;
  let nextAccumulatedDelta = effectiveDelta;

  if (safeCurrentY <= SCROLL_TOP_RESET_PX) {
    headerHidden = false;
    nextAccumulatedDelta = 0;
  } else if (
    (frameDelta > SCROLL_DIRECTION_THRESHOLD_PX ||
      effectiveDelta > SCROLL_DIRECTION_THRESHOLD_PX) &&
    safeCurrentY > MIN_SCROLL_Y_TO_HIDE_PX
  ) {
    headerHidden = true;
    nextAccumulatedDelta = 0;
  } else if (
    frameDelta < -SCROLL_DIRECTION_THRESHOLD_PX ||
    effectiveDelta < -SCROLL_DIRECTION_THRESHOLD_PX
  ) {
    headerHidden = false;
    nextAccumulatedDelta = 0;
  }

  return {
    headerHidden,
    isScrolled: safeCurrentY > SCROLL_TOP_RESET_PX,
    subnavTopOffsetPx: headerHidden ? 0 : HEADER_HEIGHT_PX,
    subnavTopCssValue: headerHidden ? '0px' : '4rem',
    subnavTopClass: headerHidden ? 'top-0' : 'top-16',
    nextLastScrollY: safeCurrentY,
    nextAccumulatedDelta,
  };
}

/**
 * Shared singleton rAF-throttled scroll coordinator so <Header /> and all <StickySubnavShell />
 * instances read from the exact same snapshot and transition in the exact same animation frame.
 */
type Listener = () => void;

const SERVER_SNAPSHOT: HeaderVisibilityState = {
  headerHidden: false,
  isScrolled: false,
  subnavTopOffsetPx: HEADER_HEIGHT_PX,
  subnavTopCssValue: '4rem',
  subnavTopClass: 'top-16',
  nextLastScrollY: 0,
  nextAccumulatedDelta: 0,
};

let clientSnapshot: HeaderVisibilityState = SERVER_SNAPSHOT;
const listeners = new Set<Listener>();
let isListening = false;
let rafId: number | null = null;

function applyDomVariables(state: HeaderVisibilityState) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-uk-header-hidden', state.headerHidden ? 'true' : 'false');
  root.style.setProperty('--uk-subnav-top', state.subnavTopCssValue);
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(HEADER_VISIBILITY_EVENT, {
        detail: {
          headerHidden: clientSnapshot.headerHidden,
          subnavTopOffsetPx: clientSnapshot.subnavTopOffsetPx,
          subnavTopCssValue: clientSnapshot.subnavTopCssValue,
        },
      })
    );
  }
}

function evaluateScrollFrame() {
  rafId = null;
  if (typeof window === 'undefined') return;

  const next = computeHeaderVisibilityState({
    currentScrollY: window.scrollY,
    lastScrollY: clientSnapshot.nextLastScrollY,
    previouslyHidden: clientSnapshot.headerHidden,
    accumulatedDelta: clientSnapshot.nextAccumulatedDelta,
  });

  const visibilityChanged = next.headerHidden !== clientSnapshot.headerHidden;
  const scrolledChanged = next.isScrolled !== clientSnapshot.isScrolled;
  clientSnapshot = next;

  if (visibilityChanged || scrolledChanged) {
    applyDomVariables(clientSnapshot);
    notifyListeners();
  }
}

function handleWindowScroll() {
  if (typeof window === 'undefined') return;
  if (rafId !== null) return;
  rafId = window.requestAnimationFrame(evaluateScrollFrame);
}

function handleCustomHeaderEvent(event: Event) {
  const custom = event as CustomEvent<{ headerHidden?: boolean }>;
  if (
    typeof custom.detail?.headerHidden === 'boolean' &&
    custom.detail.headerHidden !== clientSnapshot.headerHidden
  ) {
    const hidden = custom.detail.headerHidden;
    clientSnapshot = {
      ...clientSnapshot,
      headerHidden: hidden,
      subnavTopOffsetPx: hidden ? 0 : HEADER_HEIGHT_PX,
      subnavTopCssValue: hidden ? '0px' : '4rem',
      subnavTopClass: hidden ? 'top-0' : 'top-16',
      nextAccumulatedDelta: 0,
    };
    applyDomVariables(clientSnapshot);
    for (const listener of listeners) {
      listener();
    }
  }
}

function ensureGlobalListeners() {
  if (isListening || typeof window === 'undefined') return;
  isListening = true;
  clientSnapshot = computeHeaderVisibilityState({
    currentScrollY: window.scrollY,
    lastScrollY: window.scrollY,
    previouslyHidden: false,
    accumulatedDelta: 0,
  });
  applyDomVariables(clientSnapshot);
  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  window.addEventListener(HEADER_VISIBILITY_EVENT, handleCustomHeaderEvent as EventListener);
}

function teardownGlobalListenersIfIdle() {
  if (!isListening || listeners.size > 0 || typeof window === 'undefined') return;
  isListening = false;
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
  window.removeEventListener('scroll', handleWindowScroll);
  window.removeEventListener(HEADER_VISIBILITY_EVENT, handleCustomHeaderEvent as EventListener);
}

export function subscribeHeaderVisibility(listener: Listener): () => void {
  ensureGlobalListeners();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    teardownGlobalListenersIfIdle();
  };
}

export function getHeaderVisibilitySnapshot(): HeaderVisibilityState {
  return clientSnapshot;
}

export function getServerHeaderVisibilitySnapshot(): HeaderVisibilityState {
  return SERVER_SNAPSHOT;
}

export function syncHeaderVisibilityOnRouteChange(): void {
  if (typeof window === 'undefined') return;
  const currentY = Math.max(0, window.scrollY || 0);
  const next = computeHeaderVisibilityState({
    currentScrollY: currentY,
    lastScrollY: currentY,
    previouslyHidden: currentY <= SCROLL_TOP_RESET_PX ? false : clientSnapshot.headerHidden,
    accumulatedDelta: 0,
  });
  const changed =
    next.headerHidden !== clientSnapshot.headerHidden ||
    next.isScrolled !== clientSnapshot.isScrolled;
  clientSnapshot = next;
  applyDomVariables(clientSnapshot);
  if (changed) {
    notifyListeners();
  }
}

export interface StickySubnavClassInput {
  headerHidden: boolean;
  isScrolled: boolean;
  topClass: 'top-0' | 'top-16';
  className?: string;
}

export function getStickySubnavClassList({
  headerHidden,
  isScrolled,
  topClass,
  className = '',
}: StickySubnavClassInput): string {
  const stateClass = headerHidden ? 'is-pinned' : 'is-below-header';
  const scrollClass = isScrolled ? 'is-scrolled' : 'is-at-top';
  return [
    'sticky-subnav-shell',
    stateClass,
    scrollClass,
    'sticky',
    topClass,
    'z-30',
    'will-change-[top,transform]',
    '[transform:translateZ(0)]',
    'transition-[top,box-shadow,background-color]',
    'duration-300',
    'ease-[cubic-bezier(0.22,1,0.36,1)]',
    className.trim(),
  ]
    .filter(Boolean)
    .join(' ');
}

