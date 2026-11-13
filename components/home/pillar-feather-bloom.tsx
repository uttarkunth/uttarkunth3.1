'use client';

import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Home,
  Tent,
  Flame,
  Footprints,
  Mountain,
  Trees,
  Backpack,
  Coffee,
  Sunrise,
  Hammer,
  ShoppingBag,
  Gift,
  ShoppingBasket,
  Shirt,
  Sprout,
  Wheat,
  Apple,
  Gem,
  PackageCheck,
  Leaf,
  Video,
  Camera,
  Clapperboard,
  Film,
  Play,
  Mic,
  Aperture,
  Headphones,
  Tv,
  ScrollText,
  Focus,
  Feather,
  Users,
  Handshake,
  HandHeart,
  HeartHandshake,
  Heart,
  TreePine,
  Network,
  UserCheck,
  Landmark,
  Sparkles,
  Store,
} from 'lucide-react';
import {
  PILLAR_FEATHER_COLLECTIONS,
  type PillarFeatherCategory,
  type FeatherIconKey,
  type FeatherVisualTone,
} from '@/lib/pillar-feather-icons';

/**
 * Renders the refined line-art vector icon for each FeatherIconKey.
 * Combines Lucide icons with bespoke 1.65px-stroke SVGs for specialized Himalayan motifs
 * (mountain cabin, valley lounge chair, tandoor pot, hammock, pottery, woodcraft, honey jar, spotlight, film reel).
 */
function renderFeatherVectorIcon(iconKey: FeatherIconKey, className: string) {
  switch (iconKey) {
    // ─── STAYS ───
    case 'stays-bed':
      return <BedDouble className={className} strokeWidth={1.65} />;
    case 'stays-homestay':
      return <Home className={className} strokeWidth={1.65} />;
    case 'stays-cabin':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M3 11L12 3l9 8" />
          <path d="M5 9.5V20h14V9.5" />
          <path d="M9 14h6" />
          <path d="M10 20v-4h4v4" />
        </svg>
      );
    case 'stays-tent':
      return <Tent className={className} strokeWidth={1.65} />;
    case 'stays-bonfire':
      return <Flame className={className} strokeWidth={1.65} />;
    case 'stays-lounge-chair':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M4 7l5 8h11" />
          <path d="M7 15l-2 4" />
          <path d="M17 15l2 4" />
          <path d="M8.5 11.5h7" />
        </svg>
      );
    case 'stays-trekking':
      return <Footprints className={className} strokeWidth={1.65} />;
    case 'stays-mountains':
      return <Mountain className={className} strokeWidth={1.65} />;
    case 'stays-pines':
      return <Trees className={className} strokeWidth={1.65} />;
    case 'stays-backpack':
      return <Backpack className={className} strokeWidth={1.65} />;
    case 'stays-tandoor':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M7 10h10l1.5 5a5 5 0 0 1-4.8 6.5h-3.4A5 5 0 0 1 5.5 15L7 10Z" />
          <path d="M9 6.5c0-1.2 1-1.8 1-3" />
          <path d="M14 6.5c0-1.2 1-1.8 1-3" />
        </svg>
      );
    case 'stays-dining':
      return <Coffee className={className} strokeWidth={1.65} />;
    case 'stays-tea':
      return <Coffee className={className} strokeWidth={1.65} />;
    case 'stays-sunrise':
      return <Sunrise className={className} strokeWidth={1.65} />;
    case 'stays-hammock':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M3 5v14" />
          <path d="M21 5v14" />
          <path d="M3 9c4.5 6.5 13.5 6.5 18 0" />
          <path d="M6 11.5c3.5 3.5 8.5 3.5 12 0" />
        </svg>
      );

    // ─── PRODUCTS ───
    case 'products-handmade':
      return <Hammer className={className} strokeWidth={1.65} />;
    case 'products-bag':
      return <ShoppingBag className={className} strokeWidth={1.65} />;
    case 'products-gift':
      return <Gift className={className} strokeWidth={1.65} />;
    case 'products-woodcraft':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M12 3l7 4v10l-7 4-7-4V7l7-4Z" />
          <path d="M12 7v10" />
          <path d="M8 9.5l4 2.5 4-2.5" />
        </svg>
      );
    case 'products-pottery':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M9 4h6" />
          <path d="M10 4v3c-3 2-4.5 5-4 8.5.4 3 2.5 4.5 6 4.5s5.6-1.5 6-4.5c.5-3.5-1-6.5-4-8.5V4" />
          <path d="M7.5 13h9" />
        </svg>
      );
    case 'products-basket':
      return <ShoppingBasket className={className} strokeWidth={1.65} />;
    case 'products-wool':
      return <Shirt className={className} strokeWidth={1.65} />;
    case 'products-herbs':
      return <Sprout className={className} strokeWidth={1.65} />;
    case 'products-honey':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="7" y="7" width="10" height="13" rx="3" />
          <path d="M8.5 4h7" />
          <path d="M7 12h10" />
          <path d="M12 15.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
        </svg>
      );
    case 'products-produce':
      return <Wheat className={className} strokeWidth={1.65} />;
    case 'products-apples':
      return <Apple className={className} strokeWidth={1.65} />;
    case 'products-handcrafted':
      return <Gem className={className} strokeWidth={1.65} />;
    case 'products-packaging':
      return <PackageCheck className={className} strokeWidth={1.65} />;
    case 'products-leaf':
      return <Leaf className={className} strokeWidth={1.65} />;

    // ─── PRODUCTIONS ───
    case 'productions-cinema-camera':
      return <Video className={className} strokeWidth={1.65} />;
    case 'productions-film-camera':
      return <Camera className={className} strokeWidth={1.65} />;
    case 'productions-clapperboard':
      return <Clapperboard className={className} strokeWidth={1.65} />;
    case 'productions-film-reel':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="2.2" />
          <circle cx="12" cy="6.8" r="1" />
          <circle cx="12" cy="17.2" r="1" />
          <circle cx="6.8" cy="12" r="1" />
          <circle cx="17.2" cy="12" r="1" />
        </svg>
      );
    case 'productions-film-strip':
      return <Film className={className} strokeWidth={1.65} />;
    case 'productions-play':
      return <Play className={className} strokeWidth={1.65} />;
    case 'productions-microphone':
      return <Mic className={className} strokeWidth={1.65} />;
    case 'productions-doc-rig':
      return <Aperture className={className} strokeWidth={1.65} />;
    case 'productions-headphones':
      return <Headphones className={className} strokeWidth={1.65} />;
    case 'productions-spotlight':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M5 7l4-3 6 5-4 3-6-5Z" />
          <path d="M13 11l7 5" />
          <path d="M10 13l5 7" />
          <path d="M7 11v9" />
        </svg>
      );
    case 'productions-screen':
      return <Tv className={className} strokeWidth={1.65} />;
    case 'productions-script':
      return <ScrollText className={className} strokeWidth={1.65} />;
    case 'productions-photography':
      return <Focus className={className} strokeWidth={1.65} />;
    case 'productions-storytelling':
      return <Feather className={className} strokeWidth={1.65} />;

    // ─── COMMUNITY ───
    case 'community-people':
      return <Users className={className} strokeWidth={1.65} />;
    case 'community-handshake':
      return <Handshake className={className} strokeWidth={1.65} />;
    case 'community-helping-hands':
      return <HandHeart className={className} strokeWidth={1.65} />;
    case 'community-connection':
      return <HeartHandshake className={className} strokeWidth={1.65} />;
    case 'community-village':
      return <Home className={className} strokeWidth={1.65} />;
    case 'community-volunteer':
      return <Heart className={className} strokeWidth={1.65} />;
    case 'community-plantation':
      return <TreePine className={className} strokeWidth={1.65} />;
    case 'community-sustainability':
      return <Leaf className={className} strokeWidth={1.65} />;
    case 'community-collaboration':
      return <Network className={className} strokeWidth={1.65} />;
    case 'community-teamwork':
      return <UserCheck className={className} strokeWidth={1.65} />;
    case 'community-culture':
      return <Landmark className={className} strokeWidth={1.65} />;
    case 'community-gathering':
      return <Sparkles className={className} strokeWidth={1.65} />;
    case 'community-development':
      return <Sprout className={className} strokeWidth={1.65} />;
    case 'community-local-business':
      return <Store className={className} strokeWidth={1.65} />;
  }
}

function getToneClasses(tone: FeatherVisualTone): {
  vessel: string;
  icon: string;
  quill: string;
} {
  switch (tone) {
    case 'forest':
      return {
        vessel:
          'bg-[#FFFDF9]/92 border-[#263D32]/35 shadow-[0_8px_22px_-4px_rgba(38,61,50,0.22)]',
        icon: 'text-[#263D32]',
        quill: 'from-[#263D32]/45 via-[#263D32]/20 to-transparent',
      };
    case 'terracotta':
      return {
        vessel:
          'bg-[#FFFDF9]/92 border-[#C55B23]/40 shadow-[0_8px_22px_-4px_rgba(197,91,35,0.22)]',
        icon: 'text-[#C55B23]',
        quill: 'from-[#C55B23]/45 via-[#C55B23]/20 to-transparent',
      };
    case 'warm-gold':
      return {
        vessel:
          'bg-[#FAF3E3]/94 border-[#C55B23]/38 shadow-[0_8px_22px_-4px_rgba(38,61,50,0.20)]',
        icon: 'text-[#263D32]',
        quill: 'from-[#C55B23]/42 via-[#263D32]/18 to-transparent',
      };
    case 'sage':
      return {
        vessel:
          'bg-[#F5F0E6]/90 border-[#263D32]/30 shadow-[0_6px_16px_-3px_rgba(38,61,50,0.18)]',
        icon: 'text-[#263D32]',
        quill: 'from-[#263D32]/35 to-transparent',
      };
    case 'charcoal':
    default:
      return {
        vessel:
          'bg-[#F5F0E6]/90 border-[#C4B49D] shadow-[0_6px_16px_-3px_rgba(41,37,31,0.18)]',
        icon: 'text-[#29251F]',
        quill: 'from-[#29251F]/32 to-transparent',
      };
  }
}

export interface PillarFeatherBloomProps {
  activePillar: PillarFeatherCategory;
}

const ALL_PILLARS: readonly PillarFeatherCategory[] = [
  'stays',
  'products',
  'productions',
  'community',
];

export function PillarFeatherBloom({ activePillar }: PillarFeatherBloomProps) {
  const [isCompactMobile, setIsCompactMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsCompactMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <div
      data-testid="pillar-feather-bloom"
      data-active-pillar={activePillar}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[16] flex items-center justify-center overflow-visible [transform:translate3d(0,0,-20px)]"
    >
      {/* Delicate Wing-Quill Contour Lines Behind the Active Card */}
      <svg
        viewBox="-360 -190 720 380"
        className="pointer-events-none absolute w-[340px] sm:w-[680px] h-[290px] sm:h-[360px] overflow-visible opacity-75 transition-opacity duration-500"
      >
        {/* Left Wing Feather Rachis Curves */}
        <path
          d="M -110 -80 C -175 -115, -230 -128, -298 -52"
          fill="none"
          stroke="#263D32"
          strokeOpacity="0.22"
          strokeWidth="1.2"
          strokeDasharray="3 4"
        />
        <path
          d="M -115 -15 C -185 -35, -245 -18, -278 22"
          fill="none"
          stroke="#C55B23"
          strokeOpacity="0.24"
          strokeWidth="1.2"
          strokeDasharray="2 4"
        />
        <path
          d="M -110 45 C -165 65, -205 90, -225 84"
          fill="none"
          stroke="#263D32"
          strokeOpacity="0.18"
          strokeWidth="1.1"
        />

        {/* Right Wing Feather Rachis Curves */}
        <path
          d="M 110 -80 C 175 -115, 230 -128, 298 -52"
          fill="none"
          stroke="#263D32"
          strokeOpacity="0.22"
          strokeWidth="1.2"
          strokeDasharray="3 4"
        />
        <path
          d="M 115 -15 C 185 -35, 245 -18, 278 22"
          fill="none"
          stroke="#C55B23"
          strokeOpacity="0.24"
          strokeWidth="1.2"
          strokeDasharray="2 4"
        />
        <path
          d="M 110 45 C 165 65, 205 90, 225 84"
          fill="none"
          stroke="#263D32"
          strokeOpacity="0.18"
          strokeWidth="1.1"
        />
      </svg>

      {/* Render all 4 pillar icon sets so outgoing icons smoothly retract into the card while incoming icons bloom outward */}
      {ALL_PILLARS.map((pillarId) => {
        const isCurrentPillar = pillarId === activePillar;
        const icons = PILLAR_FEATHER_COLLECTIONS[pillarId];

        return (
          <div
            key={pillarId}
            data-pillar-wing={pillarId}
            data-wing-active={isCurrentPillar ? 'true' : 'false'}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            {icons.map((item) => {
              const toneStyle = getToneClasses(item.tone);

              const boxSizeClass =
                item.sizeTier === 'lg'
                  ? 'w-7 h-7 sm:w-9 sm:h-9'
                  : item.sizeTier === 'md'
                    ? 'w-6 h-6 sm:w-8 sm:h-8'
                    : 'w-6 h-6 sm:w-7 sm:h-7';

              const iconSizeClass =
                item.sizeTier === 'lg'
                  ? 'w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]'
                  : item.sizeTier === 'md'
                    ? 'w-3 h-3 sm:w-4 sm:h-4'
                    : 'w-3 h-3 sm:w-3.5 sm:h-3.5';

              // Feather-plume silhouette: tapered inward toward the card spine, gently rounded at the outer tip
              const featherShapeClass =
                item.side === 'left'
                  ? 'rounded-tl-[16px] rounded-br-[16px] rounded-tr-[6px] rounded-bl-[7px]'
                  : 'rounded-tr-[16px] rounded-bl-[16px] rounded-tl-[6px] rounded-br-[7px]';

              const targetX = isCompactMobile ? item.mobileDx : item.dx;
              const targetY = isCompactMobile ? item.mobileDy : item.dy;

              const retractedX = Math.round(targetX * 0.2);
              const retractedY = Math.round(targetY * 0.25);

              const nodeStyle: React.CSSProperties = isCurrentPillar
                ? {
                    opacity: item.opacity,
                    transform: `translate3d(${targetX}px, ${targetY}px, 0px) rotate(${item.rotateDeg}deg) scale(${item.scale})`,
                    transition:
                      'transform 660ms cubic-bezier(0.16, 1, 0.3, 1), opacity 520ms cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: `${item.staggerMs}ms`,
                  }
                : {
                    opacity: 0,
                    transform: `translate3d(${retractedX}px, ${retractedY}px, 0px) rotate(0deg) scale(0.36)`,
                    transition:
                      'transform 460ms cubic-bezier(0.4, 0, 0.2, 1), opacity 320ms ease-out',
                    transitionDelay: '0ms',
                  };

              const breezeStyle = {
                '--breeze-dur': `${item.breezeDurationSec}s`,
                '--breeze-delay': `${item.breezeDelaySec}s`,
              } as React.CSSProperties;

              return (
                <div
                  key={item.id}
                  style={nodeStyle}
                  className={`pointer-events-none absolute will-change-[transform,opacity] ${
                    item.mobileVisible ? 'block' : 'hidden sm:block'
                  }`}
                >
                  <div
                    style={breezeStyle}
                    className="pillar-feather-breeze relative flex items-center justify-center"
                  >
                    {/* Subtle Quill Stem Connecting Inward Toward Card Spine */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 h-[1.5px] w-5 sm:w-8 bg-gradient-to-r ${toneStyle.quill} ${
                        item.side === 'left'
                          ? 'left-full -ml-0.5'
                          : 'right-full -mr-0.5 rotate-180'
                      }`}
                    />

                    {/* Feather Plume Vessel */}
                    <div
                      title={item.label}
                      className={`${boxSizeClass} ${featherShapeClass} ${toneStyle.vessel} border backdrop-blur-[2px] flex items-center justify-center transition-colors duration-300`}
                    >
                      {renderFeatherVectorIcon(
                        item.iconKey,
                        `${iconSizeClass} ${toneStyle.icon}`
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
