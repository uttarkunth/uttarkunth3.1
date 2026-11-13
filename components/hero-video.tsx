'use client';

import React from 'react';
import Image from 'next/image';

interface HeroVideoProps {
  videoSrc?: string;
  posterSrc?: string;
  className?: string;
}

/**
 * Birds flying here and there across the Himalayan sky & mountain valley:
 * 1. Eastward Gliders (crossing from the left snow peaks toward the pagoda temple)
 * 2. Westward Soarers (gliding from the temple ridge across the river gorge)
 * 3. Thermal Circlers & Valley Swoopers (wheeling gracefully above the peaks & gateway)
 */
const EASTWARD_GLIDERS = [
  { id: 'e1', top: '10.5%', delay: '-2s', flightDur: '24s', flapDur: '0.85s', scale: 1.0 },
  { id: 'e2', top: '12.2%', delay: '-2.6s', flightDur: '24s', flapDur: '0.92s', scale: 0.86 },
  { id: 'e3', top: '9.4%', delay: '-3.1s', flightDur: '24s', flapDur: '0.78s', scale: 0.78 },
  { id: 'e4', top: '17.8%', delay: '-14s', flightDur: '28s', flapDur: '0.95s', scale: 1.08 },
  { id: 'e5', top: '19.4%', delay: '-14.7s', flightDur: '28s', flapDur: '0.88s', scale: 0.9 },
];

const WESTWARD_SOARERS = [
  { id: 'w1', top: '13.5%', delay: '-6s', flightDur: '26s', flapDur: '0.9s', scale: 0.96 },
  { id: 'w2', top: '15.1%', delay: '-6.5s', flightDur: '26s', flapDur: '0.82s', scale: 0.84 },
  { id: 'w3', top: '12.4%', delay: '-7.1s', flightDur: '26s', flapDur: '0.98s', scale: 0.76 },
  { id: 'w4', top: '21.5%', delay: '-19s', flightDur: '30s', flapDur: '0.94s', scale: 1.04 },
];

const THERMAL_AND_VALLEY_BIRDS = [
  { id: 't1', left: '42%', top: '11.5%', anim: 'heroBirdThermalCircle', flightDur: '16s', delay: '0s', flapDur: '1.05s', scale: 0.92 },
  { id: 't2', left: '44.5%', top: '10.2%', anim: 'heroBirdThermalCircle', flightDur: '16s', delay: '-0.8s', flapDur: '0.95s', scale: 0.8 },
  { id: 't3', left: '46.8%', top: '12.4%', anim: 'heroBirdThermalCircle', flightDur: '16s', delay: '-1.5s', flapDur: '1.12s', scale: 0.75 },
  { id: 't4', left: '28%', top: '16.5%', anim: 'heroBirdValleySwoop', flightDur: '18s', delay: '-4s', flapDur: '0.88s', scale: 0.95 },
  { id: 't5', left: '30.2%', top: '18.1%', anim: 'heroBirdValleySwoop', flightDur: '18s', delay: '-4.7s', flapDur: '0.96s', scale: 0.84 },
  { id: 't6', left: '58%', top: '15.2%', anim: 'heroBirdValleySwoop', flightDur: '20s', delay: '-11s', flapDur: '0.92s', scale: 0.9 },
  { id: 't7', left: '60.4%', top: '14.0%', anim: 'heroBirdThermalCircle', flightDur: '19s', delay: '-9s', flapDur: '1.02s', scale: 0.86 },
];

/**
 * Balanced medium-sized warm-ivory teardrop pin medallion whose bottom tip (0,0) rests directly on the dotted line.
 * Renders one of the 4 core ecosystem icons: 'products' | 'community' | 'filming' | 'stays'
 */
function MinimalEcosystemPin({
  x,
  y,
  scale = 1.26,
  type,
}: {
  x: number;
  y: number;
  scale?: number;
  type: 'products' | 'community' | 'filming' | 'stays';
}) {
  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      style={{ filter: 'drop-shadow(0px 2.5px 3px rgba(20, 13, 7, 0.45))' }}
    >
      {/* Teardrop Pin Body Anchored at Tip (0,0) Touching the Dotted Line */}
      <path
        d="M 0,0 C -5.5,-10.5 -19,-24 -19,-35.5 A 19,19 0 1,1 19,-35.5 C 19,-24 5.5,-10.5 0,0 Z"
        fill="#F6EFE0"
        fillOpacity="0.95"
        stroke="#D8C3A5"
        strokeWidth="1"
      />

      {/* Icon Inside the Pin Head (Centered around y = -35.5) */}
      {type === 'products' && (
        <g transform="translate(0, -35.5)" fill="#4A2E1B" stroke="#4A2E1B">
          {/* Woven Artisan Basket (Left) */}
          <path
            d="M -10.5,-2 L -1, -2 L -2, 6.2 C -2,7.2 -3,7.8 -4,7.8 L -8.5,7.8 C -9.5,7.8 -10.5,7.2 -10.5,6.2 Z"
            fill="#4A2E1B"
            stroke="none"
          />
          <path
            d="M -9.8,-2 C -9.8,-6.8 -2.5,-6.8 -2.5,-2"
            fill="none"
            stroke="#4A2E1B"
            strokeWidth="1.45"
          />
          <line x1="-8.8" y1="1.5" x2="-3.5" y2="1.5" stroke="#F6EFE0" strokeWidth="1" />
          <line x1="-8.2" y1="4.4" x2="-4" y2="4.4" stroke="#F6EFE0" strokeWidth="1" />

          {/* Honey / Ghee Jar (Right) */}
          <rect x="2.5" y="-4.8" width="6.8" height="1.9" rx="0.6" fill="#4A2E1B" stroke="none" />
          <rect x="1.8" y="-2.2" width="8.2" height="9.8" rx="1.8" fill="#4A2E1B" stroke="none" />
          <rect x="3.2" y="1" width="5.4" height="3.4" rx="0.5" fill="#F6EFE0" stroke="none" />
        </g>
      )}

      {type === 'community' && (
        <g transform="translate(0, -35.5)" fill="#4A2E1B">
          {/* Center Person */}
          <circle cx="0" cy="-4.8" r="3.2" />
          <path d="M -5.8,6.8 C -5.8,1.8 -3.4,-0.2 0,-0.2 C 3.4,-0.2 5.8,1.8 5.8,6.8 Z" />
          {/* Left Person */}
          <circle cx="-7.8" cy="-3.0" r="2.5" />
          <path d="M -11.8,6.8 C -11.8,2.8 -10,1.2 -7.4,1.2 C -6.4,1.2 -5.6,1.5 -4.9,2.1 C -5.9,3.2 -6.5,4.8 -6.5,6.8 Z" />
          {/* Right Person */}
          <circle cx="7.8" cy="-3.0" r="2.5" />
          <path d="M 11.8,6.8 C 11.8,2.8 10,1.2 7.4,1.2 C 6.4,1.2 5.6,1.5 4.9,2.1 C 5.9,3.2 6.5,4.8 6.5,6.8 Z" />
        </g>
      )}

      {type === 'filming' && (
        <g transform="translate(0, -35.5)" fill="#4A2E1B">
          {/* Two Film Reels */}
          <circle cx="-4.4" cy="-5.8" r="3.5" />
          <circle cx="-4.4" cy="-5.8" r="1.15" fill="#F6EFE0" />
          <circle cx="2.7" cy="-5.8" r="3.5" />
          <circle cx="2.7" cy="-5.8" r="1.15" fill="#F6EFE0" />
          {/* Camera Body */}
          <rect x="-7.8" y="-1.9" width="11.8" height="7.2" rx="1.4" />
          {/* Lens Cone */}
          <polygon points="4,0.2 9.5,-2.3 9.5,5.8 4,3.3" />
          {/* Tripod Legs */}
          <path
            d="M -2,5.3 L -5.6,10.2 M -0.8,5.3 L -0.8,10.5 M 0.5,5.3 L 4.2,10.2"
            stroke="#4A2E1B"
            strokeWidth="1.55"
            strokeLinecap="round"
          />
        </g>
      )}

      {type === 'stays' && (
        <g transform="translate(0, -35.5)" fill="#4A2E1B">
          {/* Headboard & Footboard Posts */}
          <rect x="-10.8" y="-5.8" width="2.3" height="12.8" rx="0.8" />
          <rect x="8.5" y="-1.6" width="2.3" height="8.6" rx="0.8" />
          {/* Pillow */}
          <rect x="-7.4" y="-3.0" width="5.4" height="2.9" rx="1.1" />
          {/* Mattress & Frame */}
          <path d="M -1.2,-2.3 L 6.8,-2.3 C 7.9,-2.3 8.8,-1.4 8.8,-0.2 L 8.8,1.1 L -8.8,1.1 L -8.8,0 Z" />
          <rect x="-9.8" y="1.7" width="19.6" height="2.7" rx="0.5" />
        </g>
      )}
    </g>
  );
}

export function HeroVideo(_props: HeroVideoProps) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-transparent select-none pointer-events-none">
      {/* ─────────────────────────────────────────────────────────────────────
          1. CLEAN RESPONSIVE HERO COMPOSITIONS (Mobile/Tablet 4:3 & Desktop 16:9)
      ───────────────────────────────────────────────────────────────────── */}

      {/* Mobile & Tablet (<1024px): Natural Unstretched 4:3 Base Panorama */}
      <Image
        src="/assets/aistudio/uttarkunth-hero-mobile-tablet-kullvi-border.jpg"
        alt="Uttarkunth Himalayan Panorama — Snow Peaks, Small Grazing Sheep, Centered Kath-Kuni Gateway, Pagoda Mandir, Green-Roofed Homestay, and Artisanal Kullvi-Bordered Products"
        fill
        priority
        sizes="(max-width: 1023px) 100vw, 1px"
        referrerPolicy="no-referrer"
        className="lg:hidden object-cover object-center"
      />

      {/* Desktop (1024px+): Full 16:9 Widescreen Base Panorama */}
      <Image
        src="/assets/aistudio/uttarkunth-hero-desktop-kullvi-border.jpg"
        alt="Uttarkunth Himalayan Panorama — Snow Peaks, Grazing Sheep, Kath-Kuni Gateway, Pagoda Mandir, Homestay, and Artisanal Kullvi-Bordered Products"
        fill
        priority
        sizes="(min-width: 1024px) 100vw, 1px"
        referrerPolicy="no-referrer"
        className="hidden lg:block object-cover object-center"
      />

      {/* ─────────────────────────────────────────────────────────────────────
          2. CONTINUOUS DOTTED TRAIL + 4 EVENLY DISTRIBUTED ICONS
             • Starts on the left ABOVE the "Born In The Himalayas" div (never behind the words)
             • Flows to the right a little ABOVE the Kath-Kuni gate and BELOW the pagoda temple
             • 4 balanced medium-sized teardrop pins (Products, Community, Filming, Stays)
               evenly spaced (210, 590, 970, 1350 on desktop; 160, 450, 740, 1030 on mobile/tablet)
               with their pointed bottom tips directly touching the dotted curve
      ───────────────────────────────────────────────────────────────────── */}

      {/* 2A. Desktop (16:9) Precision Overlay (1600×900 Coordinate Space) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="hidden lg:block pointer-events-none absolute inset-0 w-full h-full z-10"
      >
        {/* Continuous Dotted Trail: Just Above "Born In The Himalayas" on Left -> Little Above Gate -> Below Temple on Right */}
        <path
          d="M 0,214 C 75,204 140,200 210,202 C 340,206 460,240 590,254 C 720,268 840,326 970,336 C 1100,346 1220,356 1350,362 C 1445,366 1525,356 1600,346"
          fill="none"
          stroke="#F6EFE0"
          strokeWidth="2.8"
          strokeDasharray="4 7.5"
          strokeLinecap="round"
          strokeOpacity="0.92"
        />

        {/* 4 Evenly Distributed Medium-Sized Ecosystem Pins Touching the Dotted Line */}
        <MinimalEcosystemPin x={210} y={202} scale={1.08} type="products" />
        <MinimalEcosystemPin x={590} y={254} scale={1.08} type="community" />
        <MinimalEcosystemPin x={970} y={336} scale={1.08} type="filming" />
        <MinimalEcosystemPin x={1350} y={362} scale={1.08} type="stays" />
      </svg>

      {/* 2B. Mobile & Tablet (4:3) Precision Overlay (1200×900 Coordinate Space) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
        className="lg:hidden pointer-events-none absolute inset-0 w-full h-full z-10"
      >
        {/* Continuous Dotted Trail: Just Above "Born In The Himalayas" on Left -> Little Above Gate -> Below Temple on Right */}
        <path
          d="M 0,198 C 55,190 105,186 160,188 C 260,192 350,218 450,232 C 550,248 640,312 740,328 C 840,342 930,354 1030,360 C 1095,364 1150,356 1200,348"
          fill="none"
          stroke="#F6EFE0"
          strokeWidth="2.8"
          strokeDasharray="4 7.5"
          strokeLinecap="round"
          strokeOpacity="0.92"
        />

        {/* 4 Evenly Distributed Medium-Sized Ecosystem Pins Touching the Dotted Line */}
        <MinimalEcosystemPin x={160} y={188} scale={0.96} type="products" />
        <MinimalEcosystemPin x={450} y={232} scale={0.96} type="community" />
        <MinimalEcosystemPin x={740} y={328} scale={0.96} type="filming" />
        <MinimalEcosystemPin x={1030} y={360} scale={0.96} type="stays" />
      </svg>

      {/* ─────────────────────────────────────────────────────────────────────
          3. SUBTLE AMBIENT HIMALAYAN VALLEY MIST (No Hover Effects)
      ───────────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[24%] h-[36%] overflow-hidden"
      >
        <div
          style={{
            animationName: 'heroFogDriftRight',
            animationDuration: '24s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }}
          className="absolute left-[10%] right-[16%] top-[10%] h-16 sm:h-24 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,252,246,0.28)_0%,rgba(246,238,226,0.12)_52%,transparent_78%)] blur-xl"
        />
        <div
          style={{
            animationName: 'heroFogDriftLeft',
            animationDuration: '29s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }}
          className="absolute left-[16%] right-[24%] top-[38%] h-16 sm:h-28 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,250,242,0.24)_0%,rgba(236,228,216,0.1)_56%,transparent_80%)] blur-2xl"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          4. CAPTIVATING HIMALAYAN BIRDS FLYING HERE & THERE ACROSS THE SKY
      ───────────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden z-15"
      >
        {/* Group A: Birds Gliding Eastward Across the Peaks */}
        {EASTWARD_GLIDERS.map((b) => (
          <div
            key={b.id}
            style={{
              left: 0,
              top: b.top,
              animationName: 'heroBirdGlideEast',
              animationDuration: b.flightDur,
              animationTimingFunction: 'linear',
              animationDelay: b.delay,
              animationIterationCount: 'infinite',
            }}
            className="pointer-events-none absolute"
          >
            <svg
              width={Math.round(18 * b.scale)}
              height={Math.round(10 * b.scale)}
              viewBox="0 0 18 10"
              style={{
                animationName: 'heroBirdWingFlap',
                animationDuration: b.flapDur,
                animationTimingFunction: 'ease-in-out',
                animationDelay: b.delay,
                animationIterationCount: 'infinite',
              }}
              className="overflow-visible drop-shadow-[0_1px_2px_rgba(255,248,235,0.45)]"
            >
              <path
                d="M1,6.5 Q5,1.2 9,5.2 Q13,1.2 17,6.5 Q13,3.6 9,6.6 Q5,3.6 1,6.5 Z"
                fill="#1E1916"
                fillOpacity="0.85"
              />
            </svg>
          </div>
        ))}

        {/* Group B: Birds Soaring Westward From the Temple Ridge */}
        {WESTWARD_SOARERS.map((b) => (
          <div
            key={b.id}
            style={{
              left: 0,
              top: b.top,
              animationName: 'heroBirdGlideWest',
              animationDuration: b.flightDur,
              animationTimingFunction: 'linear',
              animationDelay: b.delay,
              animationIterationCount: 'infinite',
            }}
            className="pointer-events-none absolute"
          >
            <svg
              width={Math.round(17 * b.scale)}
              height={Math.round(10 * b.scale)}
              viewBox="0 0 18 10"
              style={{
                animationName: 'heroBirdWingFlap',
                animationDuration: b.flapDur,
                animationTimingFunction: 'ease-in-out',
                animationDelay: b.delay,
                animationIterationCount: 'infinite',
              }}
              className="overflow-visible drop-shadow-[0_1px_2px_rgba(255,248,235,0.45)]"
            >
              <path
                d="M1,6.5 Q5,1.2 9,5.2 Q13,1.2 17,6.5 Q13,3.6 9,6.6 Q5,3.6 1,6.5 Z"
                fill="#221D1A"
                fillOpacity="0.82"
              />
            </svg>
          </div>
        ))}

        {/* Group C: Birds Wheeling in Mountain Thermals & Swooping Over the Valley */}
        {THERMAL_AND_VALLEY_BIRDS.map((b) => (
          <div
            key={b.id}
            style={{
              left: b.left,
              top: b.top,
              animationName: b.anim,
              animationDuration: b.flightDur,
              animationTimingFunction: 'ease-in-out',
              animationDelay: b.delay,
              animationIterationCount: 'infinite',
            }}
            className="pointer-events-none absolute"
          >
            <svg
              width={Math.round(16 * b.scale)}
              height={Math.round(9 * b.scale)}
              viewBox="0 0 18 10"
              style={{
                animationName: 'heroBirdWingFlap',
                animationDuration: b.flapDur,
                animationTimingFunction: 'ease-in-out',
                animationDelay: b.delay,
                animationIterationCount: 'infinite',
              }}
              className="overflow-visible drop-shadow-[0_1px_2px_rgba(255,248,235,0.4)]"
            >
              <path
                d="M1,6.5 Q5,1.2 9,5.2 Q13,1.2 17,6.5 Q13,3.6 9,6.6 Q5,3.6 1,6.5 Z"
                fill="#221D1A"
                fillOpacity="0.8"
              />
            </svg>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          5. SMOOTH BOTTOM TRANSITION TO NEXT DIV (#F5F0E6 bg-warm-canvas)
      ───────────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2.5 sm:h-3.5 lg:h-4 bg-[linear-gradient(to_bottom,rgba(245,240,230,0)_0%,rgba(245,240,230,0.45)_52%,#F5F0E6_100%)]"
      />
    </div>
  );
}