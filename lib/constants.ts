export const AUTHENTIC_PRODUCTIONS = [
  {
    id: 'aaj-ka-devta',
    slug: 'aaj-ka-devta',
    title: 'Aaj Ka Devta',
    category: 'Documentary',
    description: 'An ethnographic exploration into the living oracle and deity traditions of the Kullu Valley.',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    videoSrc: '/assets/uttarkunth-hero-video.webm',
    youtubeUrl: 'https://youtube.com',
  },
  {
    id: 'ruk-gayi-gupt-bali',
    slug: 'ruk-gayi-gupt-bali',
    title: 'Ruk Gayi Gupt Bali',
    category: 'Cultural Monologue',
    description: 'A critical investigation into cultural transitions and ritual shifts across sacred Himalayan hamlets.',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    videoSrc: '/assets/uttarkunth-hero-video.webm',
    youtubeUrl: 'https://youtube.com',
  },
];

export const BRAND = {
  name: "Uttarkunth",
  officialDomain: "https://uttarkunth.com",
  founder: "Gaurav Negi",
  headquarters: "Jari, Kasol, Kullu, Parvati Valley, Himachal Pradesh, India",
  philosophy: "Learn by Doing • Grow by Serving 💜",
  motto: "Why over what — Think 5%, do 95% work",
  karmayog: "Karmayog as an action- and service-oriented mindset",
  tagline: "Ideas born in the mountains. Built through people.",
  description: "Uttarkunth is a growing platform rooted in the Himalayas, bringing together meaningful stays, thoughtful products, creative productions and community initiatives.",
  contactEmail: "info@uttarkunth.com",
  email: "info@uttarkunth.com",
  phone: "+91 98765 43210",
  colors: {
    forest: "#263D32",       // Primary brand green
    terracotta: "#C55B23",   // Accent terracotta
    warmBackground: "#F5F0E6", // Warm canvas
    beige: "#D9CCB8",        // Subtle border & panel
    charcoal: "#29251F",     // High-contrast text
    white: "#FFFFFF"
  }
};

export const PILLARS = [
  {
    id: "stays",
    title: "Stays",
    href: "/stays",
    tagline: "Find Your Place in the Mountains",
    description: "Discover accommodation, request bookings, manage trips and provide property-hosting tools.",
    cta: "List Your Property",
    ctaHref: "/stays/partner",
  },
  {
    id: "products",
    title: "Products",
    href: "/products",
    tagline: "Products With Purpose",
    description: "Valuable goods from Himalayan makers and responsible brands. Authentic provenance and craftsmanship.",
    cta: "Sell Your Products",
    ctaHref: "/products/sell",
  },
  {
    id: "productions",
    title: "Productions",
    href: "/production",
    tagline: "Stories Worth Telling",
    description: "Independent mountain films, documentaries, cultural archives and creative visual storytelling.",
    cta: "Collaborate on Films",
    ctaHref: "/production/collaborate",
  },
  {
    id: "community",
    title: "Community",
    href: "/community",
    tagline: "Build Something Meaningful With Us",
    description: "Partnership pathways, local initiatives, skill-building and hands-on participation in the Himalayas.",
    cta: "Join Our Mission",
    ctaHref: "/community/join",
  },
];

// Commercial policy note: Host commission arrangements remain subject to separate formal approval.
// Platform commercial rates are not active or promised by default.

/**
 * Obsolete email allowlist removed.
 * Never grant administrator access based on email identity.
 */
export const ADMIN_EMAILS: string[] = [];

/**
 * Notice: Email allowlists, user_metadata, and app_metadata roles are strictly abolished.
 * The SOLE authoritative source for administrator authorization is the protected
 * public.platform_admins table, verified server-side via checkIsPlatformAdmin(userId).
 * This helper returns true only if an object has an explicit server-verified flag
 * (is_platform_admin === true). All emails and unverified objects return false.
 */
export function isPlatformAdmin(userOrMetadata?: any): boolean {
  if (!userOrMetadata) return false;
  if (typeof userOrMetadata === 'object' && userOrMetadata !== null) {
    return userOrMetadata.is_platform_admin === true;
  }
  // Any string email or unverified object returns false: allowlists and metadata roles are abolished
  return false;
}

export const DESTINATIONS = [
  { name: "Jari", valley: "Parvati Valley", state: "Himachal Pradesh", count: 1, featured: true },
  { name: "Kasol", valley: "Parvati Valley", state: "Himachal Pradesh", count: 0, featured: true },
  { name: "Tosh & Pulga", valley: "Parvati Valley", state: "Himachal Pradesh", count: 0, featured: false },
  { name: "Kullu", valley: "Kullu Valley", state: "Himachal Pradesh", count: 0, featured: true },
  { name: "Manali", valley: "Kullu Valley", state: "Himachal Pradesh", count: 0, featured: false },
  { name: "Tirthan Valley", valley: "Tirthan", state: "Himachal Pradesh", count: 0, featured: false },
  { name: "Spiti Valley", valley: "Spiti", state: "Himachal Pradesh", count: 0, featured: false },
];

export const AMENITIES_LIST = [
  "Free Wi-Fi",
  "Mountain-view room",
  "Breakfast and dinner meal plans",
  "Tea and coffee",
  "Free Parking",
  "Balcony",
  "Kitchenette",
  "Laundry",
  "Pet-friendly by prior agreement",
  "Hot Water",
  "Local Guided Hikes",
  "Bonfire on Request"
];

export const PROPERTY_TYPES = [
  { id: "homestay", value: "homestay", label: "Traditional Homestay" },
  { id: "estate", value: "estate", label: "Heritage Estate" },
  { id: "cottage", value: "cottage", label: "Mountain Cottage" },
  { id: "cabin", value: "cabin", label: "Pine Cabin" },
  { id: "retreat", value: "retreat", label: "Wellness Retreat" },
  { id: "other", value: "other", label: "Unique Stay" }
] as const;

// Preserved live properties from Supabase for static fallback resilience
export const EXISTING_PROPERTIES = [
  {
    id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
    slug: 'yash-home-stay',
    name: 'Yash Home Stay',
    description: 'A peaceful homestay in Jari, close to the mountains and village life. A welcoming place to relax, enjoy home-style food, and experience the Himalayas.',
    village: 'Jari',
    district: 'Kullu',
    state: 'Himachal Pradesh',
    property_type: 'other',
    booking_mode: 'request_only',
    published: true,
    moderation_status: 'approved',
    photos: [
      'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/Yash%20home%20stay/unnamed.png',
      'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/Yash%20home%20stay/64749a66-252f-4c8f-a67e-028ce7557ce6.jpeg',
      'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/Yash%20home%20stay/17e473d2-e8a8-4904-85f2-0fccdb760b2e.jpeg'
    ],
    amenities: [
      'Free Wi-Fi',
      'Mountain-view room',
      'Breakfast and dinner meal plans',
      'Tea and coffee',
      'Laundry',
      'Pet-friendly by prior agreement'
    ],
    rooms: [
      {
        id: 'c7391669-92a0-4456-8e13-c7bab6661681',
        property_id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
        room_name: 'Mountain View Room',
        description: 'A peaceful room with mountain views, ideal for relaxing or working from the mountains.',
        max_guests: 2,
        base_price: 900.0,
        active: true
      }
    ]
  }
];

export const PRODUCT_CATEGORIES = [
  { id: 'himalayan', name: 'Himalayan Products', description: 'Pure regional harvests and traditional wellness formulations native to alpine altitudes.' },
  { id: 'crafts', name: 'Handmade Crafts', description: 'Woodcraft, stone carving, and vernacular artisanal goods shaped by mountain families.' },
  { id: 'textiles', name: 'Clothing and Textiles', description: 'Handloom shawls, pattu blankets, and hand-spun indigenous wool creations.' },
  { id: 'food', name: 'Food and Local Produce', description: 'Wild honey, walnuts, stone-ground flours, and small-batch mountain pantry staples.' },
  { id: 'lifestyle', name: 'Home and Lifestyle', description: 'Slow-living homeware, pine needle pottery, and natural botanical scents.' },
  { id: 'organic', name: 'Organic and Natural Products', description: 'Certified chemical-free botanicals, tisanes, and high-altitude wildcrafted herbs.' },
  { id: 'art', name: 'Art and Cultural Products', description: 'Folk paintings, brass temple art, and cultural documentation artifacts.' },
  { id: 'sustainable', name: 'Sustainable Products', description: 'Eco-conscious living essentials, zero-plastic alternatives, and bamboo craft.' },
  { id: 'other', name: 'Other Valuable Products', description: 'Curated products with genuine utility, integrity, and ethical provenance.' },
] as const;

// ============================================================================
// PHASE 2H: PROPOSED COMMUNITY INITIATIVES & GRASSROOTS FRAMEWORK
// Note: These 9 initiatives represent Uttarkunth's proposed community tracks.
// No real-world field outcomes, participant counts, or stories are fabricated.
// ============================================================================

export interface CommunityInitiative {
  id: string;
  slug: string;
  title: string;
  category: string;
  valley: string;
  location: string;
  tagline: string;
  description: string;
  objectives: string[];
  status: 'Proposed Initiative' | 'Planned Track' | 'Concept & Scoping';
  cohortSchedule: string;
  outcomes: string[];
}

export const COMMUNITY_INITIATIVES: CommunityInitiative[] = [
  {
    id: 'alpine-ecology-trails',
    slug: 'alpine-ecology-trails',
    title: 'Alpine Ecology & Zero-Plastic Trails',
    category: 'Ecology & Waste',
    valley: 'Parvati Valley',
    location: 'Jari, Kasol & Kheerganga trails',
    tagline: 'Proposed stewardship track for clean mountain passes and riverways.',
    description: 'A proposed grassroots initiative focused on trail clean-up drives, waste segregation at homestays, and community-led pack-it-in/pack-it-out trail guidelines along vulnerable high-altitude water catchment areas.',
    objectives: [
      'Reduce single-use plastic bottles across partner homestays in Jari and Kasol',
      'Organize seasonal trail cleanups and waste audits along local trekking paths',
      'Promote decentralized composting for homestay organic kitchen waste'
    ],
    status: 'Proposed Initiative',
    cohortSchedule: 'Proposed — Cohort dates to be announced once field operations open',
    outcomes: []
  },
  {
    id: 'kath-kuni-conservation',
    slug: 'kath-kuni-conservation',
    title: 'Kath-Kuni Vernacular Architecture Preservation',
    category: 'Architecture & Heritage',
    valley: 'Kullu & Parvati Valleys',
    location: 'Naggar, Jari, and Upper Kullu hamlets',
    tagline: 'Proposed documentation track for interlocking timber-and-stone building traditions.',
    description: 'A proposed architectural documentation program to learn from senior village mistris (master craftsmen), survey traditional homes, and compile reference notes for vernacular repair.',
    objectives: [
      'Prepare measured architectural drawings of traditional Kath-Kuni structures',
      'Record oral interviews with senior master carpenters on wood-jointing traditions',
      'Host introductory learning workshops with local youth and architecture students'
    ],
    status: 'Proposed Initiative',
    cohortSchedule: 'Proposed — Cohort dates to be announced once field operations open',
    outcomes: []
  },
  {
    id: 'youth-digital-mentorship',
    slug: 'youth-digital-mentorship',
    title: 'Youth Digital & Creative Mentorship',
    category: 'Education & Livelihoods',
    valley: 'Parvati Valley',
    location: 'Jari Community Hub',
    tagline: 'Proposed skill-sharing track for digital storytelling and hospitality tools.',
    description: 'A planned mentorship initiative offering practical skill-sharing in photography, video editing, homestay reservation management, and communication to support self-reliant local livelihoods.',
    objectives: [
      'Deliver practical sessions on smartphone photography and visual storytelling',
      'Assist homestay families with digital booking calendar and listing hygiene',
      'Share wilderness safety and guest communication practices with aspiring local guides'
    ],
    status: 'Planned Track',
    cohortSchedule: 'Proposed — Cohort dates to be announced once field operations open',
    outcomes: []
  },
  {
    id: 'indigenous-seed-bank',
    slug: 'indigenous-seed-bank',
    title: 'High-Altitude Seed Bank & Agroecology',
    category: 'Agriculture & Food',
    valley: 'Spiti & Upper Kullu',
    location: 'High-altitude cold desert & temperate orchards',
    tagline: 'Proposed conservation track for heirloom mountain grains, millets, and pulses.',
    description: 'A concept-stage agroecology initiative aimed at documenting and preserving climate-resilient heritage seeds—such as Ogla (buckwheat), Fafra, black soybean, and traditional barley varieties.',
    objectives: [
      'Document heirloom seed varieties cultivated in high-altitude villages',
      'Explore community seed exchange models with local farming families',
      'Document traditional organic companion planting and soil care practices'
    ],
    status: 'Concept & Scoping',
    cohortSchedule: 'Proposed — Cohort dates to be announced once field operations open',
    outcomes: []
  },
  {
    id: 'oral-history-archive',
    slug: 'oral-history-archive',
    title: 'Himalayan Oral Folk Songs & Living Archives',
    category: 'Oral History & Folklore',
    valley: 'Parvati & Seraj Valleys',
    location: 'Mountain settlements and village squares',
    tagline: 'Proposed archival track for pastoral songlines, folklore, and village histories.',
    description: 'A planned cultural archiving track to record consenting elderly singers, traditional musicians, and village elders sharing folk ballads, seasonal harvest songs, and oral histories.',
    objectives: [
      'Record traditional Pahari folk songs and oral verses with explicit elder consent',
      'Transcribe dialect lyrics with bilingual Hindi and English context notes',
      'Build an open cultural reference archive for students and local communities'
    ],
    status: 'Proposed Initiative',
    cohortSchedule: 'Proposed — Cohort dates to be announced once field operations open',
    outcomes: []
  },
  {
    id: 'wool-handloom-revival',
    slug: 'wool-handloom-revival',
    title: 'Traditional Wool, Weaving & Natural Dye Revival',
    category: 'Textiles & Crafts',
    valley: 'Kullu & Kinnaur',
    location: 'Artisan hamlets across Parvati and Beas basins',
    tagline: 'Proposed craft track for hand-spun desi wool and botanical dyes.',
    description: 'A planned craft documentation and support track exploring natural mordants and mountain botanical dye sources (walnut hulls, madder root, pine bark) alongside traditional handloom weavers.',
    objectives: [
      'Document indigenous botanical dye recipes with weavers in Kullu',
      'Connect independent handloom weavers with ethical raw wool sourcing',
      'Highlight verified chemical-free textile craftsmanship when marketplace operations open'
    ],
    status: 'Planned Track',
    cohortSchedule: 'Proposed — Cohort dates to be announced once field operations open',
    outcomes: []
  },
  {
    id: 'homestay-waste-stewardship',
    slug: 'homestay-waste-stewardship',
    title: 'Community Homestay Waste & Energy Management',
    category: 'Sustainable Living',
    valley: 'Parvati Valley',
    location: 'Jari & surrounding hamlets',
    tagline: 'Proposed sustainability track for circular waste and passive thermal warmth.',
    description: 'A proposed technical support track to help independent family homestays evaluate energy-efficient thermal insulation, solar water heating, and greywater filtration options.',
    objectives: [
      'Conduct baseline energy and heating assessments for interested family homestays',
      'Design low-cost passive window draft and roof insulation improvements',
      'Evaluate practical greywater filtration designs suited to mountain terrain'
    ],
    status: 'Proposed Initiative',
    cohortSchedule: 'Proposed — Cohort dates to be announced once field operations open',
    outcomes: []
  },
  {
    id: 'flora-forest-documentation',
    slug: 'flora-forest-documentation',
    title: 'Mountain Forest & Medicinal Flora Documentation',
    category: 'Ecology & Botany',
    valley: 'Great Himalayan National Park Buffer Zone',
    location: 'Tirthan & Sainj valleys',
    tagline: 'Proposed botanical documentation of alpine herbs and cedar ecosystems.',
    description: 'A planned documentation initiative working alongside local herbalists and forest watchers to catalog native flora and encourage responsible conservation awareness.',
    objectives: [
      'Catalog native mountain flora with photographic and local-name references',
      'Observe seasonal flowering cycles across elevation gradients',
      'Prepare educational biodiversity reference sheets for local nature guides'
    ],
    status: 'Planned Track',
    cohortSchedule: 'Proposed — Cohort dates to be announced once field operations open',
    outcomes: []
  },
  {
    id: 'pastoralist-route-archiving',
    slug: 'pastoralist-route-archiving',
    title: 'Transhumant Pastoralist Rights & Route Archiving',
    category: 'Culture & Geography',
    valley: 'Chamba, Kangra, Kullu & Spiti passes',
    location: 'High-altitude migration passes',
    tagline: 'Proposed cultural mapping of traditional shepherd trails across mountain passes.',
    description: 'A concept-stage research initiative to document generational migratory corridors used by transhumant shepherds, recording pastoral ecological terminology and customary camp histories.',
    objectives: [
      'Document historic shepherd migration routes across Himachal mountain ranges',
      'Record pastoral ecological terminology and traditional weather lore',
      'Compile research notes supporting route safety and seasonal grazing awareness'
    ],
    status: 'Concept & Scoping',
    cohortSchedule: 'Proposed — Cohort dates to be announced once field operations open',
    outcomes: []
  }
];

export const COMMUNITY_STORIES: Array<{
  id: string;
  slug: string;
  title: string;
  author: string;
  role: string;
  village: string;
  valley: string;
  date: string;
  excerpt: string;
  readTime: string;
  content: string;
}> = [];

