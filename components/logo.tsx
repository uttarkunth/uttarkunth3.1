import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  lantern?: boolean;
  centerMark?: boolean;
}

export function Logo({
  className = '',
  variant = 'light',
  showTagline = false,
  lantern = false,
  centerMark = false,
}: LogoProps) {
  if (centerMark) {
    return (
      <Link
        href="/"
        className={`group inline-flex items-center justify-center w-10 h-10 sm:w-[52px] sm:h-[52px] rounded-full overflow-hidden bg-[#FFFDF9] hover:bg-white border border-[#E5DEC9] hover:border-[#C55B23] shadow-[0_4px_14px_rgba(12,20,16,0.18)] transition-colors duration-200 ease-out focus:outline-none ${className}`}
        aria-label="Uttarkunth Homepage"
      >
        <span className="relative w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 transition-transform duration-300 ease-out group-hover:scale-[1.1]">
          <Image
            src="/logo.png"
            alt="Uttarkunth"
            width={44}
            height={44}
            className="w-6 h-6 sm:w-8 sm:h-8 object-contain text-terracotta [filter:url(#uttarkunth-terracotta-logo)]"
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
        </span>
      </Link>
    );
  }

  if (lantern) {
    return (
      <Link
        href="/"
        className={`lantern-btn group h-9 sm:h-10 bg-[#C85A23]/32 whitespace-nowrap shrink-0 shadow-xs focus:outline-none ${className}`}
        aria-label="Uttarkunth Homepage"
      >
        <span className="lantern-btn-inner px-3 gap-2 bg-[#FFFDF9] text-forest">
          <span className="relative w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Uttarkunth"
              width={28}
              height={28}
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain text-terracotta [filter:url(#uttarkunth-terracotta-logo)]"
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
          </span>
          <span className="font-serif text-lg sm:text-xl font-bold tracking-tight leading-none text-forest group-hover:text-white transition-colors">
            Uttarkunth
          </span>
        </span>
      </Link>
    );
  }

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
          className="w-10 h-10 object-contain text-terracotta [filter:url(#uttarkunth-terracotta-logo)]"
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
        <span
          className={`font-serif text-2xl font-bold tracking-tight leading-none ${
            variant === 'dark' ? 'text-warm-canvas' : 'text-forest'
          }`}
        >
          Uttarkunth
        </span>
        {showTagline && (
          <span
            className={`text-[10px] tracking-widest uppercase font-semibold mt-1 ${
              variant === 'dark' ? 'text-beige' : 'text-charcoal-muted'
            }`}
          >
            Himalayan Ecosystem
          </span>
        )}
      </div>
    </Link>
  );
}
