export interface StayLocationGroup {
  key: string;
  title: string;
  href: string;
  properties: any[];
  collagePhotos: string[];
}

/**
 * Resolves a human-friendly location group key, heading ("Stays in ..."), and link
 * from a Supabase property row based on its village, address, and district.
 */
export function resolvePropertyLocationGroup(property: any): {
  key: string;
  title: string;
  href: string;
  priority: number;
} {
  const village = String(property?.village || '').trim();
  const district = String(property?.district || '').trim();
  const address = String(property?.address || '').trim();
  const combined = `${village} ${address} ${district}`.toLowerCase();

  // 1. Parvati Valley & Kullu (Jari, Kasol, Tosh, Pulga, Kalga, Malana, Kullu)
  if (
    combined.includes('jari') ||
    combined.includes('kasol') ||
    combined.includes('parvati') ||
    combined.includes('tosh') ||
    combined.includes('pulga') ||
    combined.includes('kalga') ||
    combined.includes('chalal') ||
    combined.includes('malana') ||
    (village === '' && combined.includes('kullu')) ||
    village.toLowerCase() === 'kullu'
  ) {
    return {
      key: 'parvati-valley-kullu',
      title: 'Stays in Parvati Valley, Kullu',
      href: '/stays/destinations/kullu-jari',
      priority: 1,
    };
  }

  // 2. Manali (Manali, Old Manali, Vashisht, Nasogi, Prini)
  if (
    combined.includes('manali') ||
    combined.includes('vashisht') ||
    combined.includes('vashist') ||
    combined.includes('nasogi') ||
    combined.includes('prini')
  ) {
    return {
      key: 'manali',
      title: 'Stays in Manali',
      href: '/stays/destinations/manali',
      priority: 2,
    };
  }

  // 3. Jibhi & Tirthan Valley
  if (
    combined.includes('jibhi') ||
    combined.includes('tirthan') ||
    combined.includes('banjar') ||
    combined.includes('shangarh')
  ) {
    return {
      key: 'jibhi-tirthan',
      title: 'Stays in Jibhi & Tirthan Valley',
      href: '/stays/destinations/jibhi',
      priority: 3,
    };
  }

  // 4. Shimla
  if (combined.includes('shimla') || combined.includes('kufri') || combined.includes('mashobra')) {
    return {
      key: 'shimla',
      title: 'Stays in Shimla',
      href: '/stays/destinations/shimla',
      priority: 4,
    };
  }

  // 5. Dharamshala & McLeod Ganj
  if (
    combined.includes('dharamshala') ||
    combined.includes('mcleod') ||
    combined.includes('dharamkot')
  ) {
    return {
      key: 'dharamshala',
      title: 'Stays in Dharamshala',
      href: '/stays/destinations/dharamshala',
      priority: 5,
    };
  }

  // 6. Bir Billing
  if (combined.includes('bir') || combined.includes('billing')) {
    return {
      key: 'bir-billing',
      title: 'Stays in Bir Billing',
      href: '/stays/destinations/bir-billing',
      priority: 6,
    };
  }

  // 7. Spiti Valley
  if (combined.includes('spiti') || combined.includes('kaza') || combined.includes('kibber')) {
    return {
      key: 'spiti-valley',
      title: 'Stays in Spiti Valley',
      href: '/stays/destinations/spiti-valley',
      priority: 7,
    };
  }

  // 8. Any other custom locality from village, address, or district
  const locality = village || district || address.split(',')[0]?.trim() || 'the Himalayas';
  const normalizedKey = locality.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    key: normalizedKey || 'himalayas',
    title: `Stays in ${locality}`,
    href: `/stays?q=${encodeURIComponent(locality)}`,
    priority: 50,
  };
}

/**
 * Extracts normalized photo URLs from a property row.
 */
function extractPhotos(property: any): string[] {
  const result: string[] = [];
  if (typeof property?.cover_photo === 'string' && property.cover_photo.trim()) {
    result.push(property.cover_photo.trim());
  }
  if (Array.isArray(property?.photos)) {
    for (const p of property.photos) {
      if (typeof p === 'string' && p.trim() && !result.includes(p.trim())) {
        result.push(p.trim());
      }
    }
  }
  return result;
}

/**
 * Groups an array of approved properties into ordered location rows
 * (e.g., "Stays in Parvati Valley, Kullu", "Stays in Manali", etc.),
 * filtering out any deprecated 'wonderway-retreat' entries.
 */
export function groupPropertiesByLocation(properties: any[]): StayLocationGroup[] {
  if (!Array.isArray(properties) || properties.length === 0) return [];

  const validProperties = properties.filter(
    (p) => p && p.slug !== 'wonderway-retreat' && p.name?.toLowerCase() !== 'wonderway retreat'
  );

  const map = new Map<
    string,
    {
      key: string;
      title: string;
      href: string;
      priority: number;
      properties: any[];
      collagePhotos: string[];
    }
  >();

  for (const prop of validProperties) {
    const groupMeta = resolvePropertyLocationGroup(prop);
    let entry = map.get(groupMeta.key);
    if (!entry) {
      entry = {
        ...groupMeta,
        properties: [],
        collagePhotos: [],
      };
      map.set(groupMeta.key, entry);
    }
    entry.properties.push(prop);
    for (const photo of extractPhotos(prop)) {
      if (entry.collagePhotos.length < 6 && !entry.collagePhotos.includes(photo)) {
        entry.collagePhotos.push(photo);
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => a.priority - b.priority)
    .map(({ key, title, href, properties: list, collagePhotos }) => ({
      key,
      title,
      href,
      properties: list,
      collagePhotos,
    }));
}
