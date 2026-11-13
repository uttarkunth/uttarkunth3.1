import React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
   BADGES & EDITORIAL METADATA
   ───────────────────────────────────────────────────────────────────────────── */

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-wide transition-colors whitespace-nowrap shrink-0',
  {
    variants: {
      variant: {
        editorial:
          'text-terracotta uppercase tracking-[0.14em] font-bold px-0 py-0',
        neutral:
          'px-2.5 py-0.5 rounded-full bg-warm-card border border-beige text-charcoal-muted',
        forest:
          'px-2.5 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/15',
        terracotta:
          'px-2.5 py-0.5 rounded-full bg-terracotta/12 text-terracotta border border-terracotta/20',
        success:
          'px-2.5 py-0.5 rounded-full bg-status-success-bg text-status-success border border-status-success/20',
        warning:
          'px-2.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning border border-status-warning/20',
        danger:
          'px-2.5 py-0.5 rounded-full bg-status-danger-bg text-status-danger border border-status-danger/20',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/**
 * Unboxed editorial metadata line with clean typographic middot separators.
 */
export function EditorialMeta({
  items,
  className,
}: {
  items: Array<React.ReactNode | string | null | undefined | false>;
  className?: string;
}) {
  const validItems = items.filter(Boolean);
  if (validItems.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 text-xs text-charcoal-muted font-sans',
        className
      )}
    >
      {validItems.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && (
            <span className="text-beige-dark select-none" aria-hidden="true">
              ·
            </span>
          )}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ALERTS & NOTIFICATIONS
   ───────────────────────────────────────────────────────────────────────────── */

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'editorial';
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function Alert({
  variant = 'editorial',
  title,
  icon,
  action,
  children,
  className,
  ...props
}: AlertProps) {
  const defaultIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />;
      case 'danger':
        return <AlertCircle className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />;
      case 'info':
        return <Info className="w-4 h-4 text-status-info shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />;
    }
  };

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn(
        'p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4',
        variant === 'editorial' && 'bg-warm-surface border-beige text-charcoal',
        variant === 'info' && 'bg-status-info-bg border-status-info/20 text-status-info',
        variant === 'success' && 'bg-status-success-bg border-status-success/20 text-status-success',
        variant === 'warning' && 'bg-status-warning-bg border-status-warning/25 text-status-warning',
        variant === 'danger' && 'bg-status-danger-bg border-status-danger/25 text-status-danger',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon !== undefined ? icon : defaultIcon()}
        <div className="space-y-1">
          {title && <strong className="font-serif text-base font-bold block">{title}</strong>}
          <div className="leading-relaxed opacity-90">{children}</div>
        </div>
      </div>
      {action && <div className="shrink-0 self-start sm:self-center">{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATES & LOADING STATES
   ───────────────────────────────────────────────────────────────────────────── */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  kicker?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  kicker,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-warm-surface rounded-editorial-2xl p-8 sm:p-12 border border-beige/80 shadow-soft text-center space-y-4 max-w-2xl mx-auto',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-forest/8 text-forest flex items-center justify-center mx-auto">
        {icon || <Compass className="w-6 h-6 text-terracotta" />}
      </div>
      <div className="space-y-2 max-w-md mx-auto">
        {kicker && (
          <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-terracotta block">
            {kicker}
          </span>
        )}
        <h3 className="font-serif text-2xl font-bold text-forest">{title}</h3>
        <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2 flex items-center justify-center">{action}</div>}
    </div>
  );
}

export function LoadingState({
  label = 'Loading Himalayan archive...',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'p-10 text-center flex flex-col items-center justify-center gap-3 text-charcoal-muted',
        className
      )}
    >
      <Loader2 className="w-6 h-6 text-terracotta animate-spin" aria-hidden="true" />
      <span className="text-xs font-medium tracking-wide">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-xl bg-beige/45', className)}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BREADCRUMBS & TOOLTIP
   ───────────────────────────────────────────────────────────────────────────── */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn('py-1', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-charcoal-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-beige-dark shrink-0" aria-hidden="true" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-forest transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(isLast ? 'text-forest font-semibold' : 'text-charcoal-muted')}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Tooltip({
  content,
  children,
  className,
}: {
  content: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('relative inline-flex group/tooltip', className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-forest-dark text-warm-canvas text-[11px] font-medium whitespace-nowrap opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:scale-100 transition-all duration-180 ease-editorial shadow-lifted z-dropdown"
      >
        {content}
      </span>
    </span>
  );
}
