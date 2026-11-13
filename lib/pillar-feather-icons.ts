export type PillarFeatherCategory = 'stays' | 'products' | 'productions' | 'community';

export type FeatherWingSide = 'left' | 'right';

export type FeatherVisualTone = 'forest' | 'terracotta' | 'warm-gold' | 'charcoal' | 'sage';

export type FeatherIconKey =
  // Stays (14 icons)
  | 'stays-bed'
  | 'stays-homestay'
  | 'stays-cabin'
  | 'stays-tent'
  | 'stays-bonfire'
  | 'stays-lounge-chair'
  | 'stays-trekking'
  | 'stays-mountains'
  | 'stays-pines'
  | 'stays-backpack'
  | 'stays-tandoor'
  | 'stays-dining'
  | 'stays-tea'
  | 'stays-sunrise'
  | 'stays-hammock'
  // Products (14 icons)
  | 'products-handmade'
  | 'products-bag'
  | 'products-gift'
  | 'products-woodcraft'
  | 'products-pottery'
  | 'products-basket'
  | 'products-wool'
  | 'products-herbs'
  | 'products-honey'
  | 'products-produce'
  | 'products-apples'
  | 'products-handcrafted'
  | 'products-packaging'
  | 'products-leaf'
  // Productions (14 icons)
  | 'productions-cinema-camera'
  | 'productions-film-camera'
  | 'productions-clapperboard'
  | 'productions-film-reel'
  | 'productions-film-strip'
  | 'productions-play'
  | 'productions-microphone'
  | 'productions-doc-rig'
  | 'productions-headphones'
  | 'productions-spotlight'
  | 'productions-screen'
  | 'productions-script'
  | 'productions-photography'
  | 'productions-storytelling'
  // Community (14 icons)
  | 'community-people'
  | 'community-handshake'
  | 'community-helping-hands'
  | 'community-connection'
  | 'community-village'
  | 'community-volunteer'
  | 'community-plantation'
  | 'community-sustainability'
  | 'community-collaboration'
  | 'community-teamwork'
  | 'community-culture'
  | 'community-gathering'
  | 'community-development'
  | 'community-local-business';

export interface FeatherIconPlacement {
  id: string;
  pillar: PillarFeatherCategory;
  iconKey: FeatherIconKey;
  label: string;
  side: FeatherWingSide;
  /** Desktop horizontal offset (px) from center of active card */
  dx: number;
  /** Desktop vertical offset (px) from center of active card */
  dy: number;
  /** Mobile horizontal offset (px) from center of active card */
  mobileDx: number;
  /** Mobile vertical offset (px) from center of active card */
  mobileDy: number;
  /** Outward feather tilt angle in degrees */
  rotateDeg: number;
  /** Relative size scale (0.85 to 1.15) */
  scale: number;
  /** Base opacity when bloomed (0.72 to 0.96) */
  opacity: number;
  /** Brand palette tone */
  tone: FeatherVisualTone;
  /** Staggered entrance delay in milliseconds */
  staggerMs: number;
  /** Continuous organic breeze duration in seconds */
  breezeDurationSec: number;
  /** Continuous organic breeze phase delay in seconds */
  breezeDelaySec: number;
  /** Whether visible on compact mobile screens (<640px) */
  mobileVisible: boolean;
  /** Icon container size tier */
  sizeTier: 'sm' | 'md' | 'lg';
}

interface WingSlotTemplate {
  side: FeatherWingSide;
  dx: number;
  dy: number;
  mobileDx: number;
  mobileDy: number;
  rotateDeg: number;
  scale: number;
  opacity: number;
  tone: FeatherVisualTone;
  staggerMs: number;
  breezeDurationSec: number;
  breezeDelaySec: number;
  mobileVisible: boolean;
  sizeTier: 'sm' | 'md' | 'lg';
}

/**
 * 14-feather organic wing geometry (7 Left Wing + 7 Right Wing).
 * Designed with subtle natural asymmetry so the plumage reads like an organic
 * Himalayan bird's wing emerging from behind the central portrait card.
 */
const WING_SLOTS: readonly WingSlotTemplate[] = [
  // ─── LEFT WING (7 FEATHERS: Primary Upper → Outer Tip → Coverts → Lower Tertials) ───
  {
    side: 'left',
    dx: -176,
    dy: -134,
    mobileDx: -118,
    mobileDy: -112,
    rotateDeg: -24,
    scale: 0.94,
    opacity: 0.88,
    tone: 'forest',
    staggerMs: 25,
    breezeDurationSec: 6.2,
    breezeDelaySec: 0.1,
    mobileVisible: true,
    sizeTier: 'md',
  },
  {
    side: 'left',
    dx: -244,
    dy: -106,
    mobileDx: -142,
    mobileDy: -74,
    rotateDeg: -31,
    scale: 1.04,
    opacity: 0.92,
    tone: 'terracotta',
    staggerMs: 75,
    breezeDurationSec: 7.1,
    breezeDelaySec: 0.8,
    mobileVisible: true,
    sizeTier: 'lg',
  },
  {
    side: 'left',
    dx: -302,
    dy: -52,
    mobileDx: -152,
    mobileDy: -34,
    rotateDeg: -19,
    scale: 1.1,
    opacity: 0.95,
    tone: 'warm-gold',
    staggerMs: 125,
    breezeDurationSec: 5.8,
    breezeDelaySec: 1.5,
    mobileVisible: true,
    sizeTier: 'lg',
  },
  {
    side: 'left',
    dx: -186,
    dy: -28,
    mobileDx: -116,
    mobileDy: -12,
    rotateDeg: -12,
    scale: 0.88,
    opacity: 0.82,
    tone: 'charcoal',
    staggerMs: 55,
    breezeDurationSec: 6.8,
    breezeDelaySec: 2.1,
    mobileVisible: false,
    sizeTier: 'sm',
  },
  {
    side: 'left',
    dx: -278,
    dy: 22,
    mobileDx: -146,
    mobileDy: 44,
    rotateDeg: -8,
    scale: 1.02,
    opacity: 0.9,
    tone: 'forest',
    staggerMs: 150,
    breezeDurationSec: 7.5,
    breezeDelaySec: 0.5,
    mobileVisible: true,
    sizeTier: 'md',
  },
  {
    side: 'left',
    dx: -224,
    dy: 82,
    mobileDx: -128,
    mobileDy: 92,
    rotateDeg: 9,
    scale: 0.95,
    opacity: 0.86,
    tone: 'terracotta',
    staggerMs: 105,
    breezeDurationSec: 6.4,
    breezeDelaySec: 1.9,
    mobileVisible: true,
    sizeTier: 'md',
  },
  {
    side: 'left',
    dx: -172,
    dy: 132,
    mobileDx: -114,
    mobileDy: 120,
    rotateDeg: 18,
    scale: 0.86,
    opacity: 0.78,
    tone: 'sage',
    staggerMs: 65,
    breezeDurationSec: 5.9,
    breezeDelaySec: 2.7,
    mobileVisible: false,
    sizeTier: 'sm',
  },

  // ─── RIGHT WING (7 FEATHERS: Primary Upper → Outer Tip → Coverts → Lower Tertials) ───
  {
    side: 'right',
    dx: 178,
    dy: -130,
    mobileDx: 118,
    mobileDy: -110,
    rotateDeg: 23,
    scale: 0.95,
    opacity: 0.88,
    tone: 'terracotta',
    staggerMs: 40,
    breezeDurationSec: 6.5,
    breezeDelaySec: 0.4,
    mobileVisible: true,
    sizeTier: 'md',
  },
  {
    side: 'right',
    dx: 248,
    dy: -102,
    mobileDx: 142,
    mobileDy: -72,
    rotateDeg: 30,
    scale: 1.05,
    opacity: 0.92,
    tone: 'forest',
    staggerMs: 90,
    breezeDurationSec: 7.3,
    breezeDelaySec: 1.2,
    mobileVisible: true,
    sizeTier: 'lg',
  },
  {
    side: 'right',
    dx: 304,
    dy: -46,
    mobileDx: 152,
    mobileDy: -32,
    rotateDeg: 18,
    scale: 1.1,
    opacity: 0.95,
    tone: 'warm-gold',
    staggerMs: 140,
    breezeDurationSec: 6.0,
    breezeDelaySec: 1.8,
    mobileVisible: true,
    sizeTier: 'lg',
  },
  {
    side: 'right',
    dx: 188,
    dy: -22,
    mobileDx: 116,
    mobileDy: -10,
    rotateDeg: 11,
    scale: 0.88,
    opacity: 0.82,
    tone: 'sage',
    staggerMs: 70,
    breezeDurationSec: 6.9,
    breezeDelaySec: 2.4,
    mobileVisible: false,
    sizeTier: 'sm',
  },
  {
    side: 'right',
    dx: 280,
    dy: 26,
    mobileDx: 146,
    mobileDy: 46,
    rotateDeg: 7,
    scale: 1.02,
    opacity: 0.9,
    tone: 'terracotta',
    staggerMs: 165,
    breezeDurationSec: 7.6,
    breezeDelaySec: 0.9,
    mobileVisible: true,
    sizeTier: 'md',
  },
  {
    side: 'right',
    dx: 226,
    dy: 86,
    mobileDx: 128,
    mobileDy: 94,
    rotateDeg: -10,
    scale: 0.95,
    opacity: 0.86,
    tone: 'forest',
    staggerMs: 115,
    breezeDurationSec: 6.3,
    breezeDelaySec: 1.6,
    mobileVisible: true,
    sizeTier: 'md',
  },
  {
    side: 'right',
    dx: 174,
    dy: 134,
    mobileDx: 114,
    mobileDy: 122,
    rotateDeg: -17,
    scale: 0.86,
    opacity: 0.78,
    tone: 'charcoal',
    staggerMs: 80,
    breezeDurationSec: 6.1,
    breezeDelaySec: 2.9,
    mobileVisible: false,
    sizeTier: 'sm',
  },
];

const RAW_PILLAR_ICONS: Record<
  PillarFeatherCategory,
  ReadonlyArray<{ iconKey: FeatherIconKey; label: string }>
> = {
  stays: [
    // Left Wing (7)
    { iconKey: 'stays-homestay', label: 'Traditional Homestay' },
    { iconKey: 'stays-mountains', label: 'Himalayan Peaks' },
    { iconKey: 'stays-sunrise', label: 'Mountain Sunrise' },
    { iconKey: 'stays-bed', label: 'Mountain Bedroom' },
    { iconKey: 'stays-bonfire', label: 'Evening Bonfire' },
    { iconKey: 'stays-tea', label: 'Hot Mountain Tea' },
    { iconKey: 'stays-lounge-chair', label: 'Valley Deck Chair' },
    // Right Wing (7)
    { iconKey: 'stays-cabin', label: 'Timber Cabin' },
    { iconKey: 'stays-pines', label: 'Deodar Pine Forest' },
    { iconKey: 'stays-tent', label: 'Alpine Camping' },
    { iconKey: 'stays-backpack', label: 'Hiking Backpack' },
    { iconKey: 'stays-trekking', label: 'Mountain Trekking' },
    { iconKey: 'stays-tandoor', label: 'Traditional Cooking' },
    { iconKey: 'stays-hammock', label: 'Mountain Hammock' },
  ],
  products: [
    // Left Wing (7)
    { iconKey: 'products-handmade', label: 'Handmade Craftsmanship' },
    { iconKey: 'products-pottery', label: 'Traditional Pottery' },
    { iconKey: 'products-wool', label: 'Handloom & Wool' },
    { iconKey: 'products-bag', label: 'Ethical Shopping' },
    { iconKey: 'products-honey', label: 'Wild Mountain Honey' },
    { iconKey: 'products-herbs', label: 'High-Altitude Herbs' },
    { iconKey: 'products-gift', label: 'Thoughtful Gifting' },
    // Right Wing (7)
    { iconKey: 'products-woodcraft', label: 'Carved Woodcraft' },
    { iconKey: 'products-basket', label: 'Woven Bamboo Basket' },
    { iconKey: 'products-apples', label: 'Orchard Harvests' },
    { iconKey: 'products-handcrafted', label: 'Artisanal Objects' },
    { iconKey: 'products-produce', label: 'Organic Produce' },
    { iconKey: 'products-packaging', label: 'Sustainable Packaging' },
    { iconKey: 'products-leaf', label: 'Natural Botanicals' },
  ],
  productions: [
    // Left Wing (7)
    { iconKey: 'productions-cinema-camera', label: 'Cinema Camera' },
    { iconKey: 'productions-clapperboard', label: 'Clapperboard' },
    { iconKey: 'productions-film-reel', label: 'Archival Film Reel' },
    { iconKey: 'productions-play', label: 'Screening Room' },
    { iconKey: 'productions-microphone', label: 'Field Audio & Oral Lore' },
    { iconKey: 'productions-headphones', label: 'Soundscape Design' },
    { iconKey: 'productions-script', label: 'Documentary Screenplay' },
    // Right Wing (7)
    { iconKey: 'productions-film-camera', label: 'Documentary Camera' },
    { iconKey: 'productions-film-strip', label: '35mm Film Strip' },
    { iconKey: 'productions-spotlight', label: 'Studio & Valley Light' },
    { iconKey: 'productions-doc-rig', label: 'Ethnographic Lens' },
    { iconKey: 'productions-screen', label: 'Premiere Projection' },
    { iconKey: 'productions-photography', label: 'Visual Storytelling' },
    { iconKey: 'productions-storytelling', label: 'Creative Chronicle' },
  ],
  community: [
    // Left Wing (7)
    { iconKey: 'community-people', label: 'Community Groups' },
    { iconKey: 'community-handshake', label: 'Mutual Partnership' },
    { iconKey: 'community-helping-hands', label: 'Karmayog Service' },
    { iconKey: 'community-connection', label: 'Human Connection' },
    { iconKey: 'community-village', label: 'Himalayan Villages' },
    { iconKey: 'community-plantation', label: 'Forest Stewardship' },
    { iconKey: 'community-culture', label: 'Living Heritage' },
    // Right Wing (7)
    { iconKey: 'community-collaboration', label: 'Shared Collaboration' },
    { iconKey: 'community-volunteer', label: 'Grassroots Volunteering' },
    { iconKey: 'community-sustainability', label: 'Ecological Balance' },
    { iconKey: 'community-teamwork', label: 'Collective Action' },
    { iconKey: 'community-gathering', label: 'Village Chokar & Dialogue' },
    { iconKey: 'community-development', label: 'Livelihood Growth' },
    { iconKey: 'community-local-business', label: 'Local Micro-Enterprises' },
  ],
};

export const PILLAR_FEATHER_COLLECTIONS: Record<
  PillarFeatherCategory,
  ReadonlyArray<FeatherIconPlacement>
> = (['stays', 'products', 'productions', 'community'] as const).reduce(
  (acc, pillar) => {
    const rawList = RAW_PILLAR_ICONS[pillar];
    acc[pillar] = rawList.map((item, idx) => {
      const slot = WING_SLOTS[idx % WING_SLOTS.length];
      return {
        id: `${pillar}-feather-${idx}-${item.iconKey}`,
        pillar,
        iconKey: item.iconKey,
        label: item.label,
        ...slot,
      };
    });
    return acc;
  },
  {} as Record<PillarFeatherCategory, ReadonlyArray<FeatherIconPlacement>>
);

export function getFeatherIconsForPillar(
  pillar: PillarFeatherCategory
): ReadonlyArray<FeatherIconPlacement> {
  return PILLAR_FEATHER_COLLECTIONS[pillar] || PILLAR_FEATHER_COLLECTIONS.stays;
}
