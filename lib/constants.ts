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
    id: '7fab8bb8-a04a-462a-8124-26eb100d172f',
    slug: 'yash-home-stay',
    canonical_slug: 'yash-home-stay-jari-4u07',
    name: 'Yash Home Stay',
    description:
      'A  homestay nestled amidst beautiful mountains.  Experience peaceful village hospitality,enjoy traditional pahadi meals,  deodar forest air  and peaceful village vibes .',
    address: 'Jari, Kullu, Himachal Pradesh',
    village: 'Jari',
    district: 'Kullu',
    state: 'Himachal Pradesh',
    property_type: 'homestay',
    booking_mode: 'request',
    published: true,
    moderation_status: 'approved',
    house_rules:
      'Quiet hours after 10:00 PM. Home-cooked vegetarian or non-vegetarian meals served on advance notice. Smoking strictly outdoors only.',
    check_in_time: '12:00 PM',
    check_out_time: '11:00 AM',
    cover_photo:
      'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/host-uploads/137984ba-31be-490e-9ccd-d582f9a58a5b/deduplicated/b64cc671cd52f73f1b9f64df01d6f565bd9dad55afa9308986484a1ffa01bf0b.jpg',
    photos: [
      'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/host-uploads/137984ba-31be-490e-9ccd-d582f9a58a5b/deduplicated/6d106bd898ce9e4a01985866142ed8a3b7125703e54c4ee1ad675e20dc958d41.png',
      'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/host-uploads/137984ba-31be-490e-9ccd-d582f9a58a5b/deduplicated/b64cc671cd52f73f1b9f64df01d6f565bd9dad55afa9308986484a1ffa01bf0b.jpg',
    ],
    shared_washroom_photos: [
      'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/host-uploads/137984ba-31be-490e-9ccd-d582f9a58a5b/deduplicated/0f8015db1df2f388997d843e17abc0067acb60cd4b6b39cfe643869297ead8b0.jpg',
    ],
    amenities: [
      'Mountain View Balcony',
      'Home-Cooked Himachali Meals',
      'Hot Water Geyser',
      'High-Speed Wi-Fi',
      'Orchard / Garden Sit-Out',
      'Guided Village Walks',
      'Bonfire Facility',
      'Wood-Fired Bukhari / Heater',
      'Pet Friendly',
      'Free Wi-Fi',
      'Mountain-view room',
      'Laundry',
      'Hot Water',
      'Kitchenette',
      'Tea and coffee',
      'Breakfast and dinner meal plans',
      'Bonfire on Request',
      'Local Guided Hikes',
    ],
    rooms: [
      {
        id: '50b7b4aa-7168-49c1-bd0e-9274e0c6e106',
        property_id: '7fab8bb8-a04a-462a-8124-26eb100d172f',
        room_name: 'Village View Room',
        description: 'Next to your window , you will Persimons and Apple  orchard.',
        max_guests: 2,
        base_price: 1000,
        attached_washroom: false,
        view_type: 'village',
        bed_type: 'King / Double Bed',
        photos: [
          'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/host-uploads/137984ba-31be-490e-9ccd-d582f9a58a5b/deduplicated/4be05dbdeae7e41427f74e802ff48543f324a619f15bbe87032db6c3d6147a07.jpg',
        ],
        washroom_photos: [],
        sort_order: 1,
        active: true,
      },
      {
        id: '2e2b367b-1491-47e5-80c1-d0c0abf3e012',
        property_id: '7fab8bb8-a04a-462a-8124-26eb100d172f',
        room_name: 'Standard Room',
        description: 'Standard room with peaceful vibes.',
        max_guests: 2,
        base_price: 900,
        attached_washroom: false,
        view_type: 'none',
        bed_type: 'King Bed + Single Bed (Triple)',
        photos: [
          'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/host-uploads/137984ba-31be-490e-9ccd-d582f9a58a5b/deduplicated/12798c2df2771f46177cb9c8d37b1c533861e8a41e26022ddc1d94ff63984c26.jpg',
        ],
        washroom_photos: [],
        sort_order: 2,
        active: true,
      },
      {
        id: '9e7d68d1-f84d-49bf-91c7-8cd38c12666e',
        property_id: '7fab8bb8-a04a-462a-8124-26eb100d172f',
        room_name: 'Mountain View Room',
        description: 'Cozy mountain view room with peaceful vibes .',
        max_guests: 2,
        base_price: 1000,
        attached_washroom: false,
        view_type: 'mountain',
        bed_type: 'King / Double Bed',
        photos: [
          'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/host-uploads/137984ba-31be-490e-9ccd-d582f9a58a5b/deduplicated/19ecd3d1186369164d3ca060c9df1a332b01befd668581ca790cbd3a624b7719.jpg',
        ],
        washroom_photos: [],
        sort_order: 3,
        active: true,
      },
      {
        id: '15dba374-83c1-4222-96b1-f3e039ef3678',
        property_id: '7fab8bb8-a04a-462a-8124-26eb100d172f',
        room_name: 'Village View Room',
        description: 'Next to your window , you will see a Temple made with traditional Kath-Kuni architecture.',
        max_guests: 2,
        base_price: 1500,
        attached_washroom: true,
        view_type: 'village',
        bed_type: 'King / Double Bed',
        photos: [
          'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/host-uploads/137984ba-31be-490e-9ccd-d582f9a58a5b/deduplicated/8df5e82c3856100b1adfe3812ea002c2eb792c4885281e87293c7619bac62457.jpg',
        ],
        washroom_photos: [
          'https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/host-uploads/137984ba-31be-490e-9ccd-d582f9a58a5b/deduplicated/fc403821001058382c22bc3ff6e7e97fc759b0af042feabd82a966d73ed4b2da.jpg',
        ],
        sort_order: 4,
        active: true,
      },
    ],
  },
  {
    id: '23e7bd58-7b5e-4e64-b5fb-76db18037d6b',
    slug: 'wonderway-retreat',
    name: 'Wonderway Retreat',
    description: 'Archived reference retreat record.',
    village: 'Jari',
    district: 'Kullu',
    state: 'Himachal Pradesh',
    property_type: 'retreat',
    booking_mode: 'request_only',
    published: false,
    moderation_status: 'archived',
    photos: [],
    amenities: [],
    rooms: [],
  },
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
