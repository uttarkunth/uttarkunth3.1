import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const cardVariants = cva(
  'rounded-editorial-2xl transition-all duration-250 ease-editorial overflow-hidden',
  {
    variants: {
      variant: {
        standard:
          'bg-warm-surface border border-beige/80 shadow-soft text-charcoal',
        interactive:
          'bg-warm-surface border border-beige/80 shadow-soft hover:shadow-lifted hover:border-forest/35 text-charcoal group cursor-pointer',
        feature:
          'bg-white border border-forest/15 shadow-lifted text-charcoal',
        neutral:
          'bg-warm-card border border-beige/60 text-charcoal',
        dark:
          'bg-forest-dark border border-forest-light/30 shadow-lifted text-warm-canvas',
      },
      padding: {
        none: 'p-0',
        sm: 'p-5',
        md: 'p-6 sm:p-8',
        lg: 'p-8 sm:p-10',
      },
    },
    defaultVariants: {
      variant: 'standard',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const EditorialKicker = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-terracotta block',
      className
    )}
    {...props}
  />
));
EditorialKicker.displayName = 'EditorialKicker';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-serif text-xl sm:text-2xl font-bold text-forest leading-snug tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs sm:text-sm text-charcoal-muted leading-relaxed font-sans', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-4', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'pt-4 mt-4 border-t border-beige/60 flex items-center justify-between gap-4',
      className
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export interface EditorialImageCardProps {
  href: string;
  imageSrc: string;
  imageAlt: string;
  kicker?: string;
  meta?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  aspectRatio?: 'aspect-[4/3]' | 'aspect-[3/2]' | 'aspect-[16/10]' | 'aspect-video';
  badgeOverlay?: React.ReactNode;
  footerSlot?: React.ReactNode;
  className?: string;
}

export function EditorialImageCard({
  href,
  imageSrc,
  imageAlt,
  kicker,
  meta,
  title,
  description,
  ctaLabel = 'Explore',
  aspectRatio = 'aspect-[4/3]',
  badgeOverlay,
  footerSlot,
  className,
}: EditorialImageCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group bg-warm-surface rounded-editorial-2xl border border-beige/80 overflow-hidden shadow-soft hover:shadow-lifted hover:border-forest/35 transition-all duration-400 ease-editorial flex flex-col justify-between text-inherit no-underline',
        className
      )}
    >
      <div className={cn('relative w-full bg-forest-dark overflow-hidden', aspectRatio)}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          referrerPolicy="no-referrer"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-600 ease-editorial group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/60 via-transparent to-black/10 opacity-75 group-hover:opacity-65 transition-opacity duration-400" />
        {badgeOverlay && (
          <div className="absolute inset-x-4 top-4 flex items-center justify-between z-10 pointer-events-none">
            {badgeOverlay}
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {(kicker || meta) && (
            <div className="flex items-center gap-2 text-[11px] font-sans">
              {kicker && (
                <span className="font-bold uppercase tracking-[0.14em] text-terracotta">
                  {kicker}
                </span>
              )}
              {kicker && meta && (
                <span className="text-charcoal-light" aria-hidden="true">
                  ·
                </span>
              )}
              {meta && <span className="text-charcoal-muted font-medium">{meta}</span>}
            </div>
          )}

          <h3 className="font-serif text-2xl font-bold text-forest group-hover:text-terracotta transition-colors duration-180 leading-snug">
            {title}
          </h3>

          {description && (
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>

        <div className="pt-3.5 border-t border-beige/60 flex items-center justify-between text-xs font-semibold text-forest group-hover:text-terracotta transition-colors">
          {footerSlot ? (
            footerSlot
          ) : (
            <>
              <span className="tracking-wide">{ctaLabel}</span>
              <ArrowRight className="w-4 h-4 text-terracotta transition-transform duration-250 ease-editorial group-hover:translate-x-1" />
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
