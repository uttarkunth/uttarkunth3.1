'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin } from 'lucide-react';
import {
  clearQuickViewTransitionRecord,
  computeSharedElementTransform,
  isTransitionRecordFresh,
  matchesTransitionProperty,
  readQuickViewTransitionRecord,
  updateQuickViewTransitionPhase,
  type BoundingBoxRect,
  type QuickViewTransitionRecord,
} from '@/lib/stays-card-transition';
import { formatINR } from '@/lib/utils';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function findLiveQuickViewCtaElement(
  propertyId?: string | null,
  propertySlug?: string | null
): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const candidates: HTMLElement[] = [];

  if (propertySlug) {
    document
      .querySelectorAll<HTMLElement>(`[data-uk-quick-view-cta="${CSS.escape(propertySlug)}"]`)
      .forEach((el) => candidates.push(el));
  }
  if (propertyId && propertyId !== propertySlug) {
    document
      .querySelectorAll<HTMLElement>(`[data-uk-quick-view-cta-id="${CSS.escape(propertyId)}"]`)
      .forEach((el) => candidates.push(el));
  }

  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return el;
    }
  }
  return candidates[0] || null;
}

export interface PropertyDetailTransitionShellProps {
  propertyId: string;
  propertySlug: string;
  propertyName: string;
  children: React.ReactNode;
}

export function PropertyDetailTransitionShell({
  propertyId,
  propertySlug,
  propertyName,
  children,
}: PropertyDetailTransitionShellProps) {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const [transitionState, setTransitionState] = useState<
    'idle' | 'expanding' | 'settled' | 'direct-entry' | 'collapsing'
  >('idle');
  const [originRecord, setOriginRecord] = useState<QuickViewTransitionRecord | null>(null);
  const isClosingRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const record = readQuickViewTransitionRecord();
    const isMatch =
      record &&
      isTransitionRecordFresh(record) &&
      matchesTransitionProperty(record, propertyId, propertySlug) &&
      (record.phase === 'opening' || record.phase === 'active-detail');

    if (!isMatch || !record) {
      // Direct URL navigation without a source card -> graceful fallback entry
      if (prefersReducedMotion()) {
        setTransitionState('settled');
        return;
      }
      setTransitionState('direct-entry');
      const timer = window.setTimeout(() => {
        setTransitionState('settled');
      }, 360);
      return () => window.clearTimeout(timer);
    }

    setOriginRecord(record);
    // Mark as active-detail so browser Back button triggers reverse collapse on /stays
    updateQuickViewTransitionPhase('active-detail');

    // Only play the opening expansion if we just arrived from the card click ('opening')
    if (record.phase !== 'opening') {
      setTransitionState('settled');
      return;
    }

    if (prefersReducedMotion()) {
      shell.style.opacity = '0';
      shell.style.transition = 'opacity 180ms ease-out';
      requestAnimationFrame(() => {
        shell.style.opacity = '1';
      });
      setTransitionState('settled');
      return;
    }

    const targetRect = shell.getBoundingClientRect();
    const flip = computeSharedElementTransform(record.ctaRect, {
      top: targetRect.top,
      left: targetRect.left,
      width: targetRect.width || window.innerWidth,
      height: Math.min(targetRect.height || window.innerHeight, window.innerHeight * 0.92),
    });

    setTransitionState('expanding');

    // Frame 0: position shell at exact Quick View CTA origin
    shell.style.transition = 'none';
    shell.style.transformOrigin = '0 0';
    shell.style.transform = flip.initialTransform;
    shell.style.opacity = '0.22';
    shell.style.borderRadius = '28px';
    shell.style.willChange = 'transform, opacity, border-radius';

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      // Force layout read so initial transform commits
      void shell.offsetHeight;
      raf2 = window.requestAnimationFrame(() => {
        shell.style.transition =
          'transform 430ms cubic-bezier(0.22, 1, 0.36, 1), opacity 290ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 430ms cubic-bezier(0.22, 1, 0.36, 1)';
        shell.style.transform = flip.settledTransform;
        shell.style.opacity = '1';
        shell.style.borderRadius = '0px';
      });
    });

    const settleTimer = window.setTimeout(() => {
      if (!shellRef.current || isClosingRef.current) return;
      shellRef.current.style.transition = '';
      shellRef.current.style.transform = '';
      shellRef.current.style.transformOrigin = '';
      shellRef.current.style.opacity = '';
      shellRef.current.style.borderRadius = '';
      shellRef.current.style.willChange = '';
      setTransitionState('settled');
    }, 450);

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(settleTimer);
    };
  }, [propertyId, propertySlug]);

  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const currentRecord = originRecord || readQuickViewTransitionRecord();
    const hasValidOrigin =
      currentRecord &&
      isTransitionRecordFresh(currentRecord) &&
      matchesTransitionProperty(currentRecord, propertyId, propertySlug);

    if (!hasValidOrigin || !currentRecord) {
      return; // Allow normal Link navigation to /stays
    }

    e.preventDefault();
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    const destinationPath = currentRecord.sourcePath || '/stays';
    updateQuickViewTransitionPhase('closing');

    if (prefersReducedMotion() || !shellRef.current) {
      router.push(destinationPath, { scroll: false });
      return;
    }

    const shell = shellRef.current;
    const currentRect = shell.getBoundingClientRect();
    const reverseFlip = computeSharedElementTransform(currentRecord.ctaRect, {
      top: currentRect.top,
      left: currentRect.left,
      width: currentRect.width || window.innerWidth,
      height: Math.min(currentRect.height || window.innerHeight, window.innerHeight * 0.92),
    });

    setTransitionState('collapsing');
    shell.style.transformOrigin = '0 0';
    shell.style.willChange = 'transform, opacity, border-radius';
    shell.style.transition =
      'transform 280ms cubic-bezier(0.32, 0, 0.24, 1), opacity 250ms cubic-bezier(0.32, 0, 0.24, 1), border-radius 280ms cubic-bezier(0.32, 0, 0.24, 1)';
    shell.style.transform = reverseFlip.initialTransform;
    shell.style.opacity = '0.16';
    shell.style.borderRadius = '28px';

    window.setTimeout(() => {
      router.push(destinationPath, { scroll: false });
    }, 240);
  };

  return (
    <div
      ref={shellRef}
      data-testid="property-detail-transition-shell"
      data-transition-state={transitionState}
      data-property-slug={propertySlug}
      className={
        transitionState === 'direct-entry'
          ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-uk-card-reveal'
          : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8'
      }
    >
      {/* Back Control wired to Reverse Shared-Element Collapse */}
      <div>
        <Link
          href={originRecord?.sourcePath || '/stays'}
          onClick={handleBackClick}
          data-testid="property-detail-back-button"
          aria-label={`Back to All Stays from ${propertyName}`}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 -ml-2 rounded-full text-xs font-semibold text-charcoal-muted hover:text-forest hover:bg-[#EAE2D3]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C55B23] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Stays</span>
        </Link>
      </div>

      {children}
    </div>
  );
}

/**
 * Mounted on the Stays listing page (/stays).
 * Restores scroll position, animates the reverse-collapse into the exact originating
 * Quick View CTA button (even after browser Back navigation or viewport resize),
 * and restores keyboard focus to the originating Quick View CTA.
 */
export function StaysSharedTransitionRestorer() {
  const [collapseTarget, setCollapseTarget] = useState<{
    record: QuickViewTransitionRecord;
    liveCtaRect: BoundingBoxRect;
    phase: 'start' | 'collapsing';
  } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const record = readQuickViewTransitionRecord();
    if (!record || !isTransitionRecordFresh(record)) {
      return;
    }

    // Only trigger restoration when returning from detail page ('closing' or browser Back from 'active-detail')
    if (record.phase !== 'closing' && record.phase !== 'active-detail') {
      return;
    }

    // 1. Immediately restore previous scroll position
    if (typeof record.scrollY === 'number' && record.scrollY >= 0) {
      window.scrollTo(0, record.scrollY);
    }

    // 2. Find live originating Quick View CTA and card in the current responsive layout
    const liveCta = findLiveQuickViewCtaElement(record.propertyId, record.propertySlug);
    const liveCard =
      typeof document !== 'undefined'
        ? document.querySelector<HTMLElement>(
            `[data-uk-property-card="${CSS.escape(record.propertySlug)}"]`
          )
        : null;

    const measuredRect: BoundingBoxRect = liveCta
      ? (() => {
          const r = liveCta.getBoundingClientRect();
          return {
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
          };
        })()
      : record.ctaRect;

    if (liveCard) {
      liveCard.setAttribute('data-uk-returned-card', 'true');
    }
    if (liveCta) {
      liveCta.setAttribute('data-uk-returned-cta', 'true');
    }

    if (prefersReducedMotion()) {
      clearQuickViewTransitionRecord();
      if (liveCta) {
        liveCta.focus({ preventScroll: true });
      }
      const cleanupTimer = window.setTimeout(() => {
        liveCard?.removeAttribute('data-uk-returned-card');
        liveCta?.removeAttribute('data-uk-returned-cta');
      }, 600);
      return () => window.clearTimeout(cleanupTimer);
    }

    // 3. Trigger visual reverse-collapse morph straight into the live Quick View CTA bounding box
    setCollapseTarget({
      record,
      liveCtaRect: measuredRect,
      phase: 'start',
    });

    const raf1 = window.requestAnimationFrame(() => {
      setCollapseTarget((prev) => (prev ? { ...prev, phase: 'collapsing' } : null));
    });

    const finishTimer = window.setTimeout(() => {
      setCollapseTarget(null);
      clearQuickViewTransitionRecord();
      const targetCta = findLiveQuickViewCtaElement(record.propertyId, record.propertySlug);
      if (targetCta) {
        targetCta.focus({ preventScroll: true });
      }
    }, 340);

    const pulseCleanupTimer = window.setTimeout(() => {
      liveCard?.removeAttribute('data-uk-returned-card');
      liveCta?.removeAttribute('data-uk-returned-cta');
    }, 950);

    return () => {
      window.cancelAnimationFrame(raf1);
      window.clearTimeout(finishTimer);
      window.clearTimeout(pulseCleanupTimer);
    };
  }, []);

  if (!collapseTarget) return null;

  const { record, liveCtaRect, phase } = collapseTarget;
  const startTop = 76;
  const startLeft = Math.max(16, Math.round((window.innerWidth - Math.min(1180, window.innerWidth - 32)) / 2));
  const startWidth = Math.min(1180, window.innerWidth - 32);
  const startHeight = Math.min(620, window.innerHeight - 110);

  const flip = computeSharedElementTransform(liveCtaRect, {
    top: startTop,
    left: startLeft,
    width: startWidth,
    height: startHeight,
  });

  return (
    <div
      aria-hidden="true"
      data-testid="stays-return-collapse-overlay"
      data-collapse-phase={phase}
      style={{
        position: 'fixed',
        top: `${startTop}px`,
        left: `${startLeft}px`,
        width: `${startWidth}px`,
        height: `${startHeight}px`,
        transformOrigin: '0 0',
        transform: phase === 'collapsing' ? flip.initialTransform : flip.settledTransform,
        opacity: phase === 'collapsing' ? 0.12 : 0.94,
        borderRadius: phase === 'collapsing' ? '9999px' : '26px',
        transition:
          'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 320ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className="pointer-events-none z-[90] bg-[#FFFDF9] border border-[#263D32]/35 shadow-[0_20px_50px_rgba(24,38,31,0.24)] overflow-hidden flex flex-col justify-between p-6"
    >
      <div className="space-y-2">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#263D32]/10 text-[#263D32] font-sans text-[11px] font-semibold uppercase tracking-wider">
          {record.propertyTypeLabel}
        </span>
        <p className="font-serif text-2xl sm:text-3xl font-semibold text-[#263D32] truncate">
          {record.propertyName}
        </p>
        <p className="inline-flex items-center gap-1.5 font-sans text-xs text-[#5C5549]">
          <MapPin className="w-3.5 h-3.5 text-[#C55B23]" />
          <span>{record.locationLabel}</span>
        </p>
      </div>
      {record.startingPrice !== null && (
        <div className="pt-3 border-t border-[#E8DFD1] flex items-baseline gap-1">
          <span className="font-sans text-xl font-bold text-[#29251F] tabular-nums">
            {formatINR(record.startingPrice)}
          </span>
          <span className="font-sans text-xs text-[#5C5549]">/ night</span>
        </div>
      )}
    </div>
  );
}
