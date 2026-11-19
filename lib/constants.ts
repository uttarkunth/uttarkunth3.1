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
  phone: "+91 86270 25502",
  whatsapp: "918627025502",
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
// PHASE 2H: ACTIVE HIMALAYAN INITIATIVE — UTTARKUNTH
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
  status: 'Active Himalayan Initiative' | 'Proposed Initiative' | 'Planned Track' | 'Concept & Scoping';
  cohortSchedule: string;
  outcomes: string[];
}

export const COMMUNITY_INITIATIVES: CommunityInitiative[] = [
  {
    id: 'uttarkunth',
    slug: 'uttarkunth',
    title: 'Uttarkunth — Initiative of the People of Jari',
    category: 'Economic Upliftment & Grassroots Development',
    valley: 'Parvati & Kullu Valleys',
    location: 'Jari, Himachal Pradesh',
    tagline:
      'An initiative of the people of Jari for economic upliftment through engines of business—building regional capacity and a grassroots community to solve real mountain problems.',
    description:
      'Uttarkunth is an active Himalayan initiative born from the people of Jari for economic upliftment through sustainable engines of business. Rather than relying on external aid, Uttarkunth builds commercial and entrepreneurial strength from within the village so local people have the resources, ownership, and capacity to develop their own region and solve real problems arising on the ground—from environmental, cultural, and economical challenges to educational, developmental, and other regional needs.\n\nAt the heart of building Uttarkunth is a visionary scope: to cultivate a wider Uttarkunth Community dedicated to real grassroots development. Just as Uttarkunth began in Jari, a village initiative—whether a startup, a local enterprise, or any other responsible business—becomes a practical force that helps develop its own village and strengthens the wider Himalayan region.',
    objectives: [
      'Drive economic upliftment for the people of Jari and neighbouring valleys through sustainable engines of business',
      'Build local capacity and self-reliance to solve real regional problems—spanning environmental, cultural, economical, educational, and developmental challenges',
      'Cultivate a visionary Uttarkunth Community committed to real grassroots development across Himalayan villages',
      'Encourage village-born startups and businesses that directly strengthen local livelihoods and help develop their own villages',
    ],
    status: 'Active Himalayan Initiative',
    cohortSchedule:
      'Active & Ongoing — Rooted in Jari, open to village startups, businesses, and grassroots collaborators',
    outcomes: [
      'Environmental Stewardship & Regional Ecology',
      'Cultural Heritage & Identity Preservation',
      'Economic Upliftment & Local Enterprise Engines',
      'Educational & Youth Capacity Building',
      'Grassroots Village & Regional Development',
    ],
  },
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
