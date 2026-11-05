export interface Destination {
  id: string;
  slug: string;
  name: string;
  region: 'Himachal Pradesh' | 'Jammu & Kashmir' | 'Uttarakhand';
  tagline: string;
  description: string;
  matchTerms: string[];
  featured?: boolean;
  propertyCount?: number;
  nearbyDestinations?: string[];
  nearbyLabel?: string;
}

export const CURATED_DESTINATIONS: Destination[] = [
  // HIMACHAL PRADESH
  {
    id: 'manali',
    slug: 'manali',
    name: 'Manali',
    region: 'Himachal Pradesh',
    tagline: 'Cedar forests, apple orchards and gateway to high passes',
    description: 'Surrounded by pine-clad peaks and alpine streams at 6,700 feet, Manali has long welcomed travelers seeking authentic mountain air, deodar walks, and high-altitude trails.',
    matchTerms: ['manali', 'old manali', 'vashisht'],
    featured: true,
  },
  {
    id: 'kasol',
    slug: 'kasol',
    name: 'Kasol and Parvati Valley',
    region: 'Himachal Pradesh',
    tagline: 'Riverside timber hamlets, ancient trails and pine solitude',
    description: 'Carved by the crystal waters of the Parvati River, the valley is home to indigenous Kathkuni timber homes, ancient deodar groves, and welcoming village homestays.',
    matchTerms: ['kasol', 'chalal', 'katagla', 'choj', 'tosh', 'pulga', 'kalga', 'grahan'],
    featured: true,
    nearbyDestinations: ['kullu-jari'],
    nearbyLabel: 'Nearby in Jari (Parvati Valley, ~10 km away)',
  },
  {
    id: 'kullu-jari',
    slug: 'kullu-jari',
    name: 'Kullu and Jari',
    region: 'Himachal Pradesh',
    tagline: 'Home of Uttarkunth, vernacular architecture and mountain hospitality',
    description: 'The historic heart of the valley where timber traditions meet deep community bonds. Jari sits quietly beneath the snow-crested Malana peaks, offering genuine Himalayan warmth.',
    matchTerms: ['jari', 'kullu', 'kullu valley', 'bhuntar', 'naggar'],
    featured: true,
  },
  {
    id: 'jibhi',
    slug: 'jibhi',
    name: 'Jibhi and Tirthan Valley',
    region: 'Himachal Pradesh',
    tagline: 'Trout streams, stone-and-wood cottages and quiet cedar paths',
    description: 'Nestled beside the Great Himalayan National Park, Tirthan and Jibhi offer tranquil river trails, waterfall paths, and community-led eco-tourism.',
    matchTerms: ['jibhi', 'tirthan', 'tirthan valley', 'shoji', 'banjar'],
    featured: true,
  },
  {
    id: 'shimla',
    slug: 'shimla',
    name: 'Shimla',
    region: 'Himachal Pradesh',
    tagline: 'Heritage ridge trails, colonial architecture and pine ridges',
    description: 'Perched along seven forested hills with expansive southern Himalayan views, historic walking trails, and pine-scented orchards.',
    matchTerms: ['shimla', 'kufri', 'mashobra', 'narkanda'],
    featured: false,
  },
  {
    id: 'dharamshala',
    slug: 'dharamshala',
    name: 'Dharamshala and McLeod Ganj',
    region: 'Himachal Pradesh',
    tagline: 'Under the Dhauladhar crags: Buddhist sanctuaries and mountain cafes',
    description: 'Sheltered beneath the sheer granite walls of the Dhauladhar range, where Tibetan cultural heritage and peaceful cedar trails coexist.',
    matchTerms: ['dharamshala', 'mcleod ganj', 'mcleodganj', 'dharamsala', 'bhagsunag', 'dharamkot'],
    featured: false,
  },
  {
    id: 'bir-billing',
    slug: 'bir-billing',
    name: 'Bir Billing',
    region: 'Himachal Pradesh',
    tagline: 'Glider thermals, Tibetan monasteries and tea garden serenity',
    description: 'World-renowned for quiet village living, eco-communities, organic tea estates, and panoramic launches facing the Kangra Valley.',
    matchTerms: ['bir', 'billing', 'bir billing', 'baijnath'],
    featured: false,
  },
  {
    id: 'spiti-valley',
    slug: 'spiti-valley',
    name: 'Spiti Valley',
    region: 'Himachal Pradesh',
    tagline: 'High cold desert, 1,000-year-old monasteries and star-filled skies',
    description: 'A remote trans-Himalayan plateau characterized by mud-brick hamlets, wind-swept fossil beds, and millennia-old spiritual heritage.',
    matchTerms: ['spiti', 'kaza', 'tabo', 'kibber', 'langza', 'mudh'],
    featured: false,
  },
  {
    id: 'dalhousie',
    slug: 'dalhousie',
    name: 'Dalhousie and Khajjiar',
    region: 'Himachal Pradesh',
    tagline: 'Rolling alpine meadows, deodar forests and colonial quietude',
    description: 'Surrounded by ancient deodar canopy and emerald meadows that open onto panoramic views of the Pir Panjal mountain range.',
    matchTerms: ['dalhousie', 'khajjiar', 'bakrota'],
    featured: false,
  },
  {
    id: 'chamba',
    slug: 'chamba',
    name: 'Chamba',
    region: 'Himachal Pradesh',
    tagline: 'Ravi river banks, stone-shingle craft and ancient temple lore',
    description: 'A historic valley celebrated for hand-painted rumals, wood-carved temples, and warm village hospitality on the banks of the Ravi.',
    matchTerms: ['chamba', 'bharmour', 'pangi'],
    featured: false,
  },

  // JAMMU & KASHMIR
  {
    id: 'srinagar',
    slug: 'srinagar',
    name: 'Srinagar',
    region: 'Jammu & Kashmir',
    tagline: 'Dal Lake reflections, pinewood houseboats and walnut woodcraft',
    description: 'The timeless heart of the Kashmir Valley, famous for its hand-carved cedar houseboats, historic Mughal gardens, and traditional artisans.',
    matchTerms: ['srinagar', 'dal lake', 'nigeen'],
    featured: true,
  },
  {
    id: 'gulmarg',
    slug: 'gulmarg',
    name: 'Gulmarg',
    region: 'Jammu & Kashmir',
    tagline: 'Apharwat peaks, pristine powder and alpine meadow paths',
    description: 'The Meadow of Flowers, flanked by snowbound peaks, towering fir forests, and expansive high-altitude alpine views.',
    matchTerms: ['gulmarg', 'apharwat', 'tangmarg'],
    featured: false,
  },
  {
    id: 'pahalgam',
    slug: 'pahalgam',
    name: 'Pahalgam',
    region: 'Jammu & Kashmir',
    tagline: 'Lidder river murmurs, pine valleys and shepherd trails',
    description: 'Sheltered in the Lidder Valley, surrounded by dense pine woodlands, alpine pastures, and historic trekking routes into high glacial lakes.',
    matchTerms: ['pahalgam', 'aru', 'aru valley', 'betaab'],
    featured: false,
  },
  {
    id: 'sonamarg',
    slug: 'sonamarg',
    name: 'Sonamarg',
    region: 'Jammu & Kashmir',
    tagline: 'Meadow of Gold, Thajiwas glacier and gateway to Ladakh',
    description: 'Cradled between glaciers and high passes, where the Sindh River flows through flower-strewn mountain terraces.',
    matchTerms: ['sonamarg', 'thajiwas', 'baltal'],
    featured: false,
  },
  {
    id: 'jammu',
    slug: 'jammu',
    name: 'Jammu',
    region: 'Jammu & Kashmir',
    tagline: 'City of Temples, Tawi river bluffs and foothills gateway',
    description: 'The historic gateway to Jammu & Kashmir, situated on the slopes of the Shivalik hills overlooking the Tawi river basin.',
    matchTerms: ['jammu', 'katra', 'patnitop'],
    featured: false,
  },

  // UTTARAKHAND
  {
    id: 'rishikesh',
    slug: 'rishikesh',
    name: 'Rishikesh',
    region: 'Uttarakhand',
    tagline: 'Ganges river banks, yoga sanctuaries and foothills forest trails',
    description: 'Where the sacred Ganges emerges from the Himalayan gorges into emerald foothills, long celebrated for mindful living and yoga.',
    matchTerms: ['rishikesh', 'tapovan', 'shivpuri'],
    featured: true,
  },
  {
    id: 'mussoorie',
    slug: 'mussoorie',
    name: 'Mussoorie',
    region: 'Uttarakhand',
    tagline: 'Queen of the Hills, Doon Valley panoramas and mist-clad ridges',
    description: 'Perched atop horseshoe ridges offering sweeping views of the snowbound Garhwal peaks and the glittering Doon valley below.',
    matchTerms: ['mussoorie', 'landour', 'dhanaulti'],
    featured: false,
  },
  {
    id: 'nainital',
    slug: 'nainital',
    name: 'Nainital',
    region: 'Uttarakhand',
    tagline: 'Pear-shaped emerald lake, oak forests and Kumaon mountain lore',
    description: 'Nestled in a tranquil valley around the eye-shaped Naini Lake, enveloped by ancient oaks, rhododendrons, and Kumaoni heritage.',
    matchTerms: ['nainital', 'bhimtal', 'naukuchiatal', 'pangot'],
    featured: false,
  },
  {
    id: 'auli',
    slug: 'auli',
    name: 'Auli',
    region: 'Uttarakhand',
    tagline: 'Nanda Devi vistas, high bugyals and oak-shaded winter slopes',
    description: 'Surrounded by majestic 23,000+ foot Himalayan peaks including Nanda Devi, Kamet, and Dunagiri across expansive meadows.',
    matchTerms: ['auli', 'joshimath'],
    featured: false,
  },
  {
    id: 'chopta',
    slug: 'chopta',
    name: 'Chopta',
    region: 'Uttarakhand',
    tagline: 'The mini-Switzerland of Uttarakhand: rhododendron woods and Tungnath trail',
    description: 'An unspoiled alpine clearing flanked by thick rhododendron and pine forests, basecamp for the historic Tungnath and Chandrashila peaks.',
    matchTerms: ['chopta', 'tungnath', 'deoriatal'],
    featured: false,
  },
  {
    id: 'mukteshwar',
    slug: 'mukteshwar',
    name: 'Mukteshwar',
    region: 'Uttarakhand',
    tagline: 'Fruit orchards, panoramic 180° Himalayan horizons and cliff walks',
    description: 'A serene ridge village in Kumaon known for stone cottages, apple and apricot orchards, and unhindered Himalayan panoramas.',
    matchTerms: ['mukteshwar', 'ramgarh', 'peora'],
    featured: false,
  },
  {
    id: 'jim-corbett',
    slug: 'jim-corbett',
    name: 'Jim Corbett',
    region: 'Uttarakhand',
    tagline: 'Kosi river wilderness, Sal forests and wild Himalayan foothills',
    description: 'The oldest national park in India, nestled in the sub-Himalayan belt with riverine vegetation, dense sal woodlands, and wildlife biodiversity.',
    matchTerms: ['corbett', 'jim corbett', 'ramnagar', 'dhikala'],
    featured: false,
  },
];

/**
 * Returns the single canonical primary destination slug for a property.
 * Guarantees that every property has exactly ONE primary destination and cannot be double-counted.
 */
export function getCanonicalDestinationSlug(property: any): string {
  if (!property) return 'kullu-jari';

  // Explicit override if present in database
  if (property.destination_slug) {
    return property.destination_slug;
  }

  const village = (property.village || '').toLowerCase().trim();
  const address = (property.address || '').toLowerCase().trim();
  const district = (property.district || '').toLowerCase().trim();

  // Yash Home Stay & Wonderway Retreat are located in Jari
  if (village === 'jari' || address.includes('jari') || (village === '' && district === 'kullu')) {
    return 'kullu-jari';
  }
  if (village === 'kasol' || address.includes('kasol')) {
    return 'kasol';
  }
  if (village === 'manali' || address.includes('manali')) {
    return 'manali';
  }
  if (village === 'jibhi' || address.includes('jibhi') || address.includes('tirthan')) {
    return 'jibhi';
  }

  return 'kullu-jari';
}

/**
 * Filter properties that DIRECTLY belong to a specific destination.
 * Enforces one primary destination per listing to prevent duplicate destination counts.
 */
export function filterPropertiesForDestination(properties: any[], destination: Destination) {
  if (!properties || properties.length === 0 || !destination) return [];

  return properties.filter((property) => {
    if (property.published !== true || property.moderation_status !== 'approved') {
      return false;
    }
    return getCanonicalDestinationSlug(property) === destination.slug;
  });
}

/**
 * Returns nearby stays for a destination without counting them in the destination's primary tally.
 * For example, Kasol displays authentic nearby partner stays located in Jari (~10 km away).
 */
export function getNearbyPropertiesForDestination(properties: any[], destination: Destination) {
  if (!properties || properties.length === 0 || !destination) return [];
  if (!destination.nearbyDestinations || destination.nearbyDestinations.length === 0) return [];

  const nearbySlugs = destination.nearbyDestinations;

  return properties.filter((property) => {
    if (property.published !== true || property.moderation_status !== 'approved') {
      return false;
    }
    const canonical = getCanonicalDestinationSlug(property);
    return canonical !== destination.slug && nearbySlugs.includes(canonical);
  });
}

/**
 * Browser-safe curated destinations list (zero server/DB imports).
 * For live DB-enriched destinations on server pages, use getActiveDestinations from '@/lib/destinations.server'.
 */
export async function getActiveDestinations(): Promise<Destination[]> {
  return CURATED_DESTINATIONS;
}

/**
 * Browser-safe curated destination lookup by slug (zero server/DB imports).
 * For live DB-enriched destinations on server pages, use getDestinationBySlug from '@/lib/destinations.server'.
 */
export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  return CURATED_DESTINATIONS.find((d) => d.slug === slug) || null;
}