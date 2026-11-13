'use client';

import React from 'react';
import { Search, X, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
   FORM LABEL & VALIDATION MESSAGE
   ───────────────────────────────────────────────────────────────────────────── */

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  requiredIndicator?: boolean;
  optionalText?: string;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, requiredIndicator, optionalText, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'block font-sans text-xs font-semibold text-charcoal tracking-wide mb-1.5',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {requiredIndicator && (
        <span className="text-terracotta ml-1" aria-hidden="true">
          *
        </span>
      )}
      {optionalText && (
        <span className="text-charcoal-light font-normal ml-1.5 text-[11px]">
          ({optionalText})
        </span>
      )}
    </label>
  )
);
FormLabel.displayName = 'FormLabel';

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'error' | 'success' | 'hint';
}

export const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, variant = 'hint', children, ...props }, ref) => {
    if (!children) return null;

    return (
      <p
        ref={ref}
        role={variant === 'error' ? 'alert' : undefined}
        className={cn(
          'mt-1.5 text-xs flex items-center gap-1.5 leading-relaxed',
          variant === 'error' && 'text-status-danger font-medium',
          variant === 'success' && 'text-status-success font-medium',
          variant === 'hint' && 'text-charcoal-muted',
          className
        )}
        {...props}
      >
        {variant === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
        {variant === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
        <span>{children}</span>
      </p>
    );
  }
);
FormMessage.displayName = 'FormMessage';

/* ─────────────────────────────────────────────────────────────────────────────
   TEXT INPUT & SEARCH INPUT
   ───────────────────────────────────────────────────────────────────────────── */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightElement, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          suppressHydrationWarning
          className={cn(
            'w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm text-charcoal bg-warm-surface border border-beige-dark/60 rounded-xl placeholder:text-charcoal-light transition-all duration-180 ease-editorial focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/15 focus:outline-none disabled:opacity-60 disabled:bg-warm-canvas',
            leftIcon && 'pl-10',
            rightElement && 'pr-10',
            error && 'border-status-danger focus:border-status-danger focus:ring-status-danger/15',
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search stays, products, films, or initiatives...',
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <Search
        className="w-4 h-4 text-forest/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        suppressHydrationWarning
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 pl-11 pr-10 text-sm text-charcoal bg-warm-surface border border-beige-dark/70 rounded-2xl shadow-soft placeholder:text-charcoal-light transition-all duration-180 ease-editorial focus:border-forest focus:bg-white focus:ring-2 focus:ring-terracotta/25 focus:outline-none"
        {...props}
      />
      {value && (
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          aria-label="Clear search query"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-charcoal-muted hover:text-charcoal hover:bg-forest/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TEXTAREA
   ───────────────────────────────────────────────────────────────────────────── */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      suppressHydrationWarning
      className={cn(
        'w-full p-3.5 text-xs sm:text-sm text-charcoal bg-warm-surface border border-beige-dark/60 rounded-xl placeholder:text-charcoal-light transition-all duration-180 ease-editorial focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/15 focus:outline-none disabled:opacity-60 disabled:bg-warm-canvas leading-relaxed',
        error && 'border-status-danger focus:border-status-danger focus:ring-status-danger/15',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

/* ─────────────────────────────────────────────────────────────────────────────
   SELECT CONTROL
   ───────────────────────────────────────────────────────────────────────────── */

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  leftIcon?: React.ReactNode;
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, leftIcon, error, children, ...props }, ref) => (
    <div className="relative w-full">
      {leftIcon && (
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted">
          {leftIcon}
        </div>
      )}
      <select
        ref={ref}
        suppressHydrationWarning
        className={cn(
          'w-full h-11 appearance-none px-3.5 pr-9 py-2 text-xs sm:text-sm text-charcoal bg-warm-surface border border-beige-dark/60 rounded-xl transition-all duration-180 ease-editorial focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/15 focus:outline-none disabled:opacity-60 disabled:bg-warm-canvas',
          leftIcon && 'pl-10',
          error && 'border-status-danger focus:border-status-danger focus:ring-status-danger/15',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="w-4 h-4 text-charcoal-muted pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
        aria-hidden="true"
      />
    </div>
  )
);
Select.displayName = 'Select';

/* ─────────────────────────────────────────────────────────────────────────────
   CHECKBOX & RADIO CONTROLS
   ───────────────────────────────────────────────────────────────────────────── */

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'flex items-start gap-3 cursor-pointer select-none group',
          props.disabled && 'opacity-60 cursor-not-allowed',
          className
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          suppressHydrationWarning
          className="mt-0.5 h-4 w-4 rounded border-beige-dark text-forest accent-forest focus:ring-2 focus:ring-terracotta focus:ring-offset-1 cursor-pointer"
          {...props}
        />
        {(label || description) && (
          <div className="space-y-0.5">
            {label && (
              <span className="block text-xs sm:text-sm font-semibold text-charcoal group-hover:text-forest transition-colors">
                {label}
              </span>
            )}
            {description && (
              <span className="block text-[11px] sm:text-xs text-charcoal-muted leading-relaxed">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export interface RadioOptionProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const RadioOption = React.forwardRef<HTMLInputElement, RadioOptionProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'flex items-start gap-3 p-3.5 rounded-xl border border-beige/80 bg-warm-surface hover:border-forest/40 cursor-pointer select-none transition-all duration-180',
          props.checked && 'border-forest bg-forest/5 ring-1 ring-forest/20',
          props.disabled && 'opacity-60 cursor-not-allowed',
          className
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="radio"
          suppressHydrationWarning
          className="mt-0.5 h-4 w-4 border-beige-dark text-forest accent-forest focus:ring-2 focus:ring-terracotta"
          {...props}
        />
        <div className="space-y-0.5">
          <span className="block text-xs sm:text-sm font-semibold text-charcoal">
            {label}
          </span>
          {description && (
            <span className="block text-[11px] text-charcoal-muted leading-relaxed">
              {description}
            </span>
          )}
        </div>
      </label>
    );
  }
);
RadioOption.displayName = 'RadioOption';
