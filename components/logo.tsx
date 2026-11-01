'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', variant = 'light', showTagline = false, size = 'md' }: LogoProps) {
  const emblemDim = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const textClass = size === 'lg' ? 'text-2xl sm:text-3xl' : size === 'sm' ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl';

  return (
    <Link href="/" className={`inline-flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ukorange rounded-lg p-1 ${className}`}>
      {/* Brand Emblem rendered with authentic Brand Orange / Ivory mask */}
      <span
        aria-label="Uttarkunth Emblem"
        className={`${emblemDim} flex-shrink-0 transition-transform duration-300 group-hover:scale-105 inline-block`}
        style={{
          backgroundColor: variant === 'dark' ? '#FAF7F0' : '#C85A20',
          WebkitMaskImage: 'url(/logo.png)',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskImage: 'url(/logo.png)',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          maskSize: 'contain',
        }}
      />
      <div className="flex flex-col">
        <span className={`font-serif ${textClass} font-bold tracking-tight leading-tight ${variant === 'dark' ? 'text-ivory' : 'text-forest'}`}>
          Uttarkunth<span className="text-ukorange font-sans font-semibold text-lg ml-1">Stays</span>
        </span>
        {showTagline && (
          <span className="text-[10px] tracking-widest uppercase font-medium text-charcoal-muted">
            Himalayan Hospitality
          </span>
        )}
      </div>
    </Link>
  );
}
