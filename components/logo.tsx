import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showTagline?: boolean;
}

export function Logo({ className = '', variant = 'light', showTagline = false }: LogoProps) {
  // Uttarkunth official brand color: #C85A20 with transparent background
  return (
    <Link href="/" className={`inline-flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ukorange rounded-lg p-1 ${className}`}>
      <div className="relative w-10 h-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
        <Image
          src="/logo.png"
          alt="Uttarkunth Logo"
          width={40}
          height={40}
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col">
        <span className={`font-serif text-xl sm:text-2xl font-bold tracking-tight leading-tight ${variant === 'dark' ? 'text-ivory' : 'text-forest'}`}>
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
