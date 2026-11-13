'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface BrandIntroSplashProps {
  forceShow?: boolean;
}

export function BrandIntroSplash({ forceShow = false }: BrandIntroSplashProps) {
  // Default visible=true on initial SSR render so the splash is present in HTML
  // BEFORE the homepage ever paints (eliminating the homepage-first flash).
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const skipForAutostart = params.get('autostart') === '1';
    const alreadySeen =
      typeof window !== 'undefined' && sessionStorage.getItem('uk_splash_seen');
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!forceShow && (alreadySeen || prefersReducedMotion || skipForAutostart)) {
      document.documentElement.setAttribute('data-uk-intro-gate', 'completed');
      setVisible(false);
      return;
    }

    document.documentElement.setAttribute('data-uk-intro-gate', 'active');
    setVisible(true);

    const startTime = performance.now();
    const duration = 2200; // 2.2s elegant loading
    let animationFrameId: number;
    let closeTimeoutId: number | undefined;

    const finish = () => {
      setClosing(true);
      document.documentElement.setAttribute('data-uk-intro-gate', 'revealing');
      try {
        sessionStorage.setItem('uk_splash_seen', '1');
      } catch (e) {}
      closeTimeoutId = window.setTimeout(() => {
        document.documentElement.setAttribute('data-uk-intro-gate', 'completed');
        setVisible(false);
      }, 950);
    };

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - rawProgress, 2.5);
      const currentPct = Math.round(eased * 100);
      setProgress(currentPct);

      if (rawProgress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (closeTimeoutId !== undefined) {
        clearTimeout(closeTimeoutId);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [forceShow]);

  if (!visible) return null;

  return (
    <div
      data-uk-intro-root
      data-testid="brand-intro-splash"
      className={`fixed inset-0 z-[100] overflow-hidden pointer-events-auto transition-opacity duration-700 ${
        closing ? 'pointer-events-none' : 'bg-forest'
      }`}
      aria-label="Uttarkunth Introduction"
    >
      {/* Top Half Curtain */}
      <div
        className={`absolute top-0 left-0 right-0 h-[50.5%] bg-forest transition-transform duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          closing ? '-translate-y-full' : 'translate-y-0'
        }`}
      />

      {/* Bottom Half Curtain */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[50.5%] bg-forest transition-transform duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          closing ? 'translate-y-full' : 'translate-y-0'
        }`}
      />

      {/* Center Content */}
      <div
        className={`relative z-10 w-full h-full flex flex-col items-center justify-center text-ivory text-center px-6 transition-opacity duration-500 ${
          closing ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Logo with Reveal Animation */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-6 drop-shadow-xl animate-fade-in">
          <Image
            src="/logo.png"
            alt="Uttarkunth Logo"
            fill
            priority
            className="object-contain"
          />
        </div>

        {/* Brand Name Title */}
        <h1 className="font-sans font-bold tracking-[0.25em] text-2xl sm:text-3xl text-ivory uppercase">
          Uttarkunth
        </h1>

        {/* Tagline */}
        <p className="font-serif italic text-sm sm:text-base text-ivory/80 mt-3 max-w-sm">
          Born in the Himalayas. Built Around Community.
        </p>

        {/* Hairline Progress Bar */}
        <div className="w-56 sm:w-64 h-[2px] bg-ivory/20 rounded-full mt-8 overflow-hidden relative">
          <div
            className="h-full bg-ukorange transition-all duration-75 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Counter */}
        <div className="font-mono text-xs text-ivory/60 tracking-widest mt-3">
          {String(progress).padStart(3, '0')}
        </div>

        {/* Skip Button */}
        <button
          onClick={() => {
            setClosing(true);
            document.documentElement.setAttribute('data-uk-intro-gate', 'revealing');
            try {
              sessionStorage.setItem('uk_splash_seen', '1');
            } catch (e) {}
            setTimeout(() => {
              document.documentElement.setAttribute('data-uk-intro-gate', 'completed');
              setVisible(false);
            }, 950);
          }}
          className="absolute bottom-8 right-8 text-xs uppercase tracking-widest text-ivory/60 hover:text-ivory transition-colors px-4 py-2 rounded-full border border-ivory/20 hover:border-ivory/50"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
