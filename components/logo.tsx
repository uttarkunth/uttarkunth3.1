import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showTagline?: boolean;
}

export function Logo({ className = '', variant = 'light', showTagline = false }: LogoProps) {
  // Uttarkunth official brand identity: Preserved original logo in brand Terracotta (#C55B23)
  return (
    <Link 
      href="/" 
      className={`inline-flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-lg p-1 transition-opacity hover:opacity-95 ${className}`}
      aria-label="Uttarkunth Homepage"
    >
      <div className="relative w-10 h-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
        <Image
          src="/logo.png"
          alt="Uttarkunth"
          width={40}
          height={40}
          className="object-contain text-terracotta [filter:url(#uttarkunth-terracotta-logo)]"
          referrerPolicy="no-referrer"
          priority
        />
        <svg className="sr-only w-0 h-0 absolute" aria-hidden="true" focusable="false">
          <filter id="uttarkunth-terracotta-logo" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.772549  0 0 0 0 0.356863  0 0 0 0 0.137255  0 0 0 1 0"
            />
          </filter>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={`font-serif text-2xl font-bold tracking-tight leading-none ${variant === 'dark' ? 'text-warm-canvas' : 'text-forest'}`}>
          Uttarkunth
        </span>
        {showTagline && (
          <span className={`text-[10px] tracking-widest uppercase font-semibold mt-1 ${variant === 'dark' ? 'text-beige' : 'text-charcoal-muted'}`}>
            Himalayan Ecosystem
          </span>
        )}
      </div>
    </Link>
  );
}
