'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
   TABS PRIMITIVE
   ───────────────────────────────────────────────────────────────────────────── */

export interface TabOption {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export function SegmentedTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-warm-card border border-beige/80',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            suppressHydrationWarning
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-180 ease-editorial whitespace-nowrap shrink-0',
              isActive
                ? 'bg-forest text-warm-canvas shadow-xs'
                : 'text-charcoal-muted hover:text-forest hover:bg-warm-surface/70'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums',
                  isActive ? 'bg-white/20 text-warm-canvas' : 'bg-forest/10 text-forest'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ACCORDION PRIMITIVE
   ───────────────────────────────────────────────────────────────────────────── */

export interface AccordionItemData {
  id: string;
  question: string;
  answer: React.ReactNode;
}

export function Accordion({
  items,
  allowMultiple = false,
  className,
}: {
  items: AccordionItemData[];
  allowMultiple?: boolean;
  className?: string;
}) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return allowMultiple ? [...prev, id] : [id];
    });
  };

  return (
    <div className={cn('divide-y divide-beige/80 border-y border-beige/80', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id} className="py-4 sm:py-5">
            <button
              type="button"
              suppressHydrationWarning
              aria-expanded={isOpen}
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between gap-4 text-left group focus:outline-none"
            >
              <span className="font-serif text-lg sm:text-xl font-bold text-forest group-hover:text-terracotta transition-colors">
                {item.question}
              </span>
              <span
                className={cn(
                  'w-7 h-7 rounded-full border border-beige flex items-center justify-center text-charcoal-muted group-hover:border-terracotta group-hover:text-terracotta transition-all duration-250 ease-editorial shrink-0',
                  isOpen && 'rotate-180 bg-forest text-warm-canvas border-forest group-hover:text-warm-canvas'
                )}
              >
                <ChevronDown className="w-4 h-4" />
              </span>
            </button>
            {isOpen && (
              <div className="pt-3 pr-8 text-xs sm:text-sm text-charcoal-muted leading-relaxed animate-fade-in">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MODAL / DIALOG OVERLAY PRIMITIVE
   ───────────────────────────────────────────────────────────────────────────── */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  kicker?: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  open,
  onClose,
  title,
  kicker,
  description,
  children,
  maxWidthClass = 'max-w-md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'uk-modal-title' : undefined}
      className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-forest-dark/65 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'bg-warm-surface rounded-editorial-2xl w-full p-6 sm:p-8 border border-beige shadow-elevated relative animate-scale-in max-h-[90vh] overflow-y-auto',
          maxWidthClass
        )}
      >
        <button
          type="button"
          suppressHydrationWarning
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-charcoal-muted hover:text-charcoal hover:bg-forest/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {(kicker || title || description) && (
          <div className="space-y-1 pr-8 mb-5">
            {kicker && (
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-terracotta block">
                {kicker}
              </span>
            )}
            {title && (
              <h3 id="uk-modal-title" className="font-serif text-xl sm:text-2xl font-bold text-forest">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-charcoal-muted leading-relaxed">{description}</p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SCROLL REVEAL WRAPPER (ACCESSIBLE & REDUCED-MOTION SAFE)
   ───────────────────────────────────────────────────────────────────────────── */

export function ScrollReveal({
  children,
  className,
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      setRevealed(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) {
      setRevealed(true);
      return;
    }

    setRevealed(false);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={cn(
        'transition-all duration-400 ease-editorial',
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        className
      )}
    >
      {children}
    </div>
  );
}
