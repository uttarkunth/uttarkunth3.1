import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEADER_HEIGHT_PX,
  computeHeaderVisibilityState,
} from '../lib/sticky-header-offset';

test('at top of page (scrollY <= 16), header is visible and secondary navbar sits below header (64px / top-16)', () => {
  const initial = computeHeaderVisibilityState({
    currentScrollY: 0,
    lastScrollY: 0,
    previouslyHidden: false,
  });
  assert.equal(initial.headerHidden, false);
  assert.equal(initial.subnavTopOffsetPx, HEADER_HEIGHT_PX);
  assert.equal(initial.subnavTopCssValue, '4rem');
  assert.equal(initial.subnavTopClass, 'top-16');

  // Even if previouslyHidden was true, reaching scrollY <= 16 reveals header and moves subnav to 64px
  const nearTop = computeHeaderVisibilityState({
    currentScrollY: 12,
    lastScrollY: 5,
    previouslyHidden: true,
  });
  assert.equal(nearTop.headerHidden, false);
  assert.equal(nearTop.subnavTopOffsetPx, 64);
  assert.equal(nearTop.subnavTopClass, 'top-16');
});

test('scrolling down past threshold hides header and attaches secondary navbar to top (0px / top-0)', () => {
  const scrolledDown = computeHeaderVisibilityState({
    currentScrollY: 140,
    lastScrollY: 20,
    previouslyHidden: false,
  });
  assert.equal(scrolledDown.headerHidden, true);
  assert.equal(scrolledDown.subnavTopOffsetPx, 0);
  assert.equal(scrolledDown.subnavTopCssValue, '0px');
  assert.equal(scrolledDown.subnavTopClass, 'top-0');
  assert.equal(scrolledDown.nextLastScrollY, 140);
});

test('scrolling up past threshold reveals header and moves secondary navbar below header (64px / top-16)', () => {
  const scrolledUp = computeHeaderVisibilityState({
    currentScrollY: 90,
    lastScrollY: 140,
    previouslyHidden: true,
  });
  assert.equal(scrolledUp.headerHidden, false);
  assert.equal(scrolledUp.subnavTopOffsetPx, 64);
  assert.equal(scrolledUp.subnavTopCssValue, '4rem');
  assert.equal(scrolledUp.subnavTopClass, 'top-16');
  assert.equal(scrolledUp.nextLastScrollY, 90);
});

test('scrolling down again after scrolling up re-attaches secondary navbar to top (0px / top-0)', () => {
  const downAgain = computeHeaderVisibilityState({
    currentScrollY: 220,
    lastScrollY: 90,
    previouslyHidden: false,
  });
  assert.equal(downAgain.headerHidden, true);
  assert.equal(downAgain.subnavTopOffsetPx, 0);
  assert.equal(downAgain.subnavTopClass, 'top-0');
});

test('micro-scrolls within threshold (-6 to +6) preserve previous visibility state without jitter', () => {
  const stayHidden = computeHeaderVisibilityState({
    currentScrollY: 216,
    lastScrollY: 220,
    previouslyHidden: true,
  });
  assert.equal(stayHidden.headerHidden, true);
  assert.equal(stayHidden.subnavTopOffsetPx, 0);

  const stayVisible = computeHeaderVisibilityState({
    currentScrollY: 94,
    lastScrollY: 90,
    previouslyHidden: false,
  });
  assert.equal(stayVisible.headerHidden, false);
  assert.equal(stayVisible.subnavTopOffsetPx, 64);
});

test('consecutive small downward trackpad ticks accumulate smoothly to transition state without sudden jumps', () => {
  const tick1 = computeHeaderVisibilityState({
    currentScrollY: 60,
    lastScrollY: 56,
    previouslyHidden: false,
    accumulatedDelta: 0,
  });
  assert.equal(tick1.headerHidden, false);
  assert.equal(tick1.nextAccumulatedDelta, 4);

  const tick2 = computeHeaderVisibilityState({
    currentScrollY: 64,
    lastScrollY: tick1.nextLastScrollY,
    previouslyHidden: tick1.headerHidden,
    accumulatedDelta: tick1.nextAccumulatedDelta,
  });
  assert.equal(tick2.headerHidden, true);
  assert.equal(tick2.subnavTopOffsetPx, 0);
  assert.equal(tick2.subnavTopClass, 'top-0');
});

test('negative rubber-band overscroll is clamped to 0 and keeps secondary navbar below header without layout shift', () => {
  const bounce = computeHeaderVisibilityState({
    currentScrollY: -18,
    lastScrollY: 0,
    previouslyHidden: false,
  });
  assert.equal(bounce.headerHidden, false);
  assert.equal(bounce.subnavTopOffsetPx, 64);
  assert.equal(bounce.nextLastScrollY, 0);
});
