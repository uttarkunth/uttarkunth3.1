'use client';

import React, { useSyncExternalStore } from 'react';
import {
  subscribeHeaderVisibility,
  getHeaderVisibilitySnapshot,
  getServerHeaderVisibilitySnapshot,
} from '@/lib/sticky-header-offset';

export function useAdaptiveSubnavTop() {
  const state = useSyncExternalStore(
    subscribeHeaderVisibility,
    getHeaderVisibilitySnapshot,
    getServerHeaderVisibilitySnapshot
  );

  return {
    headerHidden: state.headerHidden,
    isScrolled: state.isScrolled,
    topOffsetPx: state.subnavTopOffsetPx,
    topClass: state.subnavTopClass,
    topStyle: state.subnavTopCssValue,
  };
}

interface StickySubnavShellProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

/**
 * StickySubnavShell keeps the secondary navigation bar in normal document flow
 * (`position: sticky`) so it permanently reserves its vertical space and never
 * causes layout shifts (CLS = 0). Its `top` offset transitions smoothly on the
 * compositor thread in lockstep with `<Header />`:
 * - Pinned to top (`top: 0px`) when scrolling down (`headerHidden = true`)
 * - Positioned below `<Header />` (`top: 4rem` / `64px`) when scrolling up or at top (`headerHidden = false`)
 */
export function StickySubnavShell({
  children,
  className = '',
  testId = 'sticky-subnav-shell',
  ariaLabel,
}: StickySubnavShellProps) {
  const { headerHidden, topClass, topStyle } = useAdaptiveSubnavTop();

  return (
    <div
      data-testid={testId}
      data-header-hidden={headerHidden ? 'true' : 'false'}
      data-subnav-state={headerHidden ? 'pinned-to-top' : 'below-header'}
      aria-label={ariaLabel}
      style={{ top: `var(--uk-subnav-top, ${topStyle})` }}
      className={`sticky ${topClass} z-30 will-change-[top,transform] [transform:translateZ(0)] transition-[top,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
    >
      {children}
    </div>
  );
}
