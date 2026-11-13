'use client';

import React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const buttonOuterVariants = cva(
  'lantern-btn group font-sans font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-warm-canvas active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap shrink-0 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-[#C85A23]/32',
        secondary: 'bg-[#C85A23]/28',
        terracotta: 'bg-[#C85A23]/42',
        outline: 'bg-[#C85A23]/28',
        ghost: 'bg-[#C85A23]/22 active:scale-[0.99]',
        heroDark: 'bg-[#C85A23]/32',
        destructive: 'bg-status-danger/35',
        icon: 'bg-[#C85A23]/26',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export const buttonVariants = cva('lantern-btn-inner', {
  variants: {
    variant: {
      primary:
        'bg-[#263D32] text-[#F5F0E6] group-hover:bg-[#0E1713] group-hover:text-white',
      secondary:
        'bg-[#FFFDF9] text-[#263D32] group-hover:bg-[#0E1713] group-hover:text-white',
      terracotta:
        'bg-[#C55B23] text-[#FFFDF9] group-hover:bg-[#0E1713] group-hover:text-white',
      outline:
        'bg-[#FFFDF9] text-[#263D32] group-hover:bg-[#0E1713] group-hover:text-white',
      ghost:
        'bg-[#FFFDF9] text-[#29251F] group-hover:bg-[#0E1713] group-hover:text-white',
      heroDark:
        'bg-[#FFFDF9] text-[#263D32] group-hover:bg-[#0E1713] group-hover:text-white',
      destructive:
        'bg-status-danger-bg text-status-danger group-hover:bg-[#0E1713] group-hover:text-white',
      icon:
        'bg-[#FFFDF9] text-[#29251F] group-hover:bg-[#0E1713] group-hover:text-white p-0',
    },
    size: {
      sm: 'h-9 px-4 text-xs',
      md: 'h-11 px-6 text-xs sm:text-sm',
      lg: 'h-12 px-7 text-sm sm:text-base',
      editorial: 'h-11 px-6 text-xs uppercase tracking-[0.12em]',
      icon: 'h-10 w-10',
      'icon-sm': 'h-9 w-9',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

function updateLanternMouseCoords(e: React.MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  innerClassName?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      innerClassName,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = 'button',
      onMouseMove,
      ...props
    },
    ref
  ) => {
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      updateLanternMouseCoords(e);
      onMouseMove?.(e);
    };

    return (
      <button
        ref={ref}
        type={type}
        suppressHydrationWarning
        disabled={disabled || loading}
        onMouseMove={handleMouseMove}
        className={cn(buttonOuterVariants({ variant }), className)}
        {...props}
      >
        <span className={cn(buttonVariants({ variant, size }), innerClassName)}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
          ) : (
            leftIcon && <span className="shrink-0">{leftIcon}</span>
          )}
          {children && <span>{children}</span>}
          {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface LinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  href: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  external?: boolean;
  innerClassName?: string;
}

export function LinkButton({
  href,
  variant,
  size,
  leftIcon,
  rightIcon,
  external = false,
  className,
  innerClassName,
  children,
  onMouseMove,
  ...props
}: LinkButtonProps) {
  const outerClasses = cn(buttonOuterVariants({ variant }), className);
  const innerClasses = cn(buttonVariants({ variant, size }), innerClassName);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    updateLanternMouseCoords(e);
    onMouseMove?.(e);
  };

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseMove={handleMouseMove}
        className={outerClasses}
        {...props}
      >
        <span className={innerClasses}>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </span>
      </a>
    );
  }

  return (
    <Link href={href} onMouseMove={handleMouseMove} className={outerClasses} {...props}>
      <span className={innerClasses}>
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </span>
    </Link>
  );
}
