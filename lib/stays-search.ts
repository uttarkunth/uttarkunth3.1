import {
  CURATED_DESTINATIONS,
  Destination,
  filterPropertiesForDestination,
  getNearbyPropertiesForDestination,
} from '@/lib/destinations';
import { EXISTING_PROPERTIES } from '@/lib/constants';
import { EXISTING_REVIEWS, PublicReviewItem } from '@/lib/reviews';
import { calculateNights } from '@/lib/booking-calculator';

export interface StaysWhereSuggestion {
  id: string;
  type: 'destination' | 'property';
  slug: string;
  name: string;
  subtitle: string;
  region: string;
  featured?: boolean;
  imageUrl?: string;
}

function resolveDestinationThumbnail(dest: Destination): string | undefined {
  if (dest.image) return dest.image;
  const slug = (dest.slug || '').toLowerCase().trim();
  if (slug === 'kullu-jari' || slug === 'kullu-and-jari' || slug === 'jari') {
    return '/assets/destinations/jari-card.webp';
  }
  return slug ? `/assets/destinations/${slug}-card.webp` : undefined;
}

export interface CalendarDayCell {
  dateStr: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
}

export type CalendarDayVisualState =
  | 'past-disabled'
  | 'default'
  | 'today'
  | 'check-in-start'
  | 'check-out-end'
  | 'in-selected-range'
  | 'in-valid-preview-range'
  | 'valid-preview-end'
  | 'in-invalid-preview-range'
  | 'invalid-preview-target';

export interface CalendarDateClickOutcome {
  checkIn: string;
  checkOut: string;
  occupiedNights: number;
  invalidDateClicked: string | null;
  errorMessage: string | null;
  completedRange: boolean;
}

export interface StaysGuestSelection {
  adults: number;
  children: number;
  childAges: number[];
  infants: number;
}

export interface StaysGuestSummary {
  adults: number;
  children: number;
  childAges: number[];
  infants: number;
  totalSeatedGuests: number;
  summaryLabel: string;
  compactSummaryLabel: string;
  exceedsMaxPropertyCapacity: boolean;
  maxPropertyCapacity: number;
  capacityWarning: string | null;
}

export interface AmenityChipOption {
  id: string;
  label: string;
  category: 'designation' | 'amenity';
  matchingCount: number;
}

export interface StaysSearchCriteria {
  destinationSlug?: string;
  query?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  childAges?: number[];
  infants?: number;
  selectedAmenityIds?: string[];
  propertyType?: string;
}

export const INVALID_CHECKOUT_TOOLTIP_MESSAGE =
  'Please select a check-out date after your check-in date.';

/**
 * Normalizes a text query for case-insensitive matching.
 */
function normalizeText(value: string | null | undefined): string {
  return (value || '').toLowerCase().trim();
}

/**
 * Builds searchable WHERE suggestions from configured destinations and genuine published properties.
 * Never fabricates properties or locations.
 */
export function getStaysWhereSuggestions(
  rawQuery: string,
  destinations: Destination[] = CURATED_DESTINATIONS,
  properties: any[] = EXISTING_PROPERTIES
): {
  matchingProperties: StaysWhereSuggestion[];
  matchingDestinations: StaysWhereSuggestion[];
  popularDestinations: StaysWhereSuggestion[];
} {
  const query = normalizeText(rawQuery);
  const validProperties = (properties || []).filter(
    (p) =>
      p &&
      p.slug !== 'wonderway-retreat' &&
      p.published === true &&
      p.moderation_status === 'approved'
  );

  const allPropertySuggestions: StaysWhereSuggestion[] = validProperties.map((p) => ({
    id: `property-${p.slug}`,
    type: 'property',
    slug: p.slug,
    name: p.name,
    subtitle: [p.village, p.district, p.state].filter(Boolean).join(', '),
    region: p.state || 'Himachal Pradesh',
    featured: true,
    imageUrl:
      typeof p.cover_photo === 'string' && p.cover_photo
        ? p.cover_photo
        : Array.isArray(p.photos) && typeof p.photos[0] === 'string'
        ? p.photos[0]
        : undefined,
  }));

  const allDestinationSuggestions: StaysWhereSuggestion[] = (destinations || []).map((d) => ({
    id: `destination-${d.slug}`,
    type: 'destination',
    slug: d.slug,
    name: d.name,
    subtitle: d.tagline,
    region: d.region,
    featured: Boolean(d.featured),
    imageUrl: resolveDestinationThumbnail(d),
  }));

  const popularDestinations = allDestinationSuggestions.filter((d) => d.featured);

  if (!query) {
    return {
      matchingProperties: allPropertySuggestions,
      matchingDestinations: allDestinationSuggestions,
      popularDestinations:
        popularDestinations.length > 0
          ? popularDestinations
          : allDestinationSuggestions.slice(0, 8),
    };
  }

  const matchingProperties = allPropertySuggestions.filter((item) => {
    const rawProp = validProperties.find((p) => p.slug === item.slug);
    const haystack = [
      item.name,
      item.subtitle,
      rawProp?.village,
      rawProp?.district,
      rawProp?.address,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });

  const matchingDestinations = allDestinationSuggestions.filter((item) => {
    const rawDest = (destinations || []).find((d) => d.slug === item.slug);
    const terms = [
      item.name,
      item.region,
      item.subtitle,
      ...(rawDest?.matchTerms || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return terms.includes(query);
  });

  return {
    matchingProperties,
    matchingDestinations,
    popularDestinations,
  };
}

/**
 * Formats YYYY-MM-DD from year, 0-indexed month, and 1-indexed day in UTC.
 */
export function formatIsoDateString(year: number, monthIndex: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Builds a complete 7-column calendar grid for a given year and 0-indexed month.
 * Leading empty slots are null so each week aligns with Sunday..Saturday.
 */
export function buildCalendarMonthGrid(
  year: number,
  monthIndex: number
): (CalendarDayCell | null)[] {
  const firstDayOfWeek = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const cells: (CalendarDayCell | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      dateStr: formatIsoDateString(year, monthIndex, day),
      dayOfMonth: day,
      isCurrentMonth: true,
    });
  }

  return cells;
}

/**
 * Evaluates the visual state of a single day cell in the interactive range calendar.
 * Supports:
 * - Past date prevention
 * - Deep Forest Green check-in & check-out endpoints
 * - Continuous pale sage green preview range when hovering valid future checkout dates
 * - Muted red invalid-range preview when hovering dates earlier than check-in
 */
export function evaluateCalendarDayState(
  dateStr: string,
  todayStr: string,
  checkIn: string,
  checkOut: string,
  hoverDate: string | null = null
): CalendarDayVisualState {
  if (!dateStr) return 'default';
  if (todayStr && dateStr < todayStr) {
    return 'past-disabled';
  }

  if (checkIn && dateStr === checkIn) {
    return 'check-in-start';
  }

  if (checkIn && checkOut) {
    if (dateStr === checkOut) {
      return 'check-out-end';
    }
    if (dateStr > checkIn && dateStr < checkOut) {
      return 'in-selected-range';
    }
  }

  // When check-in is selected and user is previewing a tentative check-out date
  if (checkIn && !checkOut && hoverDate && hoverDate >= todayStr) {
    if (hoverDate > checkIn) {
      if (dateStr === hoverDate) {
        return 'valid-preview-end';
      }
      if (dateStr > checkIn && dateStr < hoverDate) {
        return 'in-valid-preview-range';
      }
    } else if (hoverDate < checkIn) {
      if (dateStr === hoverDate) {
        return 'invalid-preview-target';
      }
      if (dateStr > hoverDate && dateStr < checkIn) {
        return 'in-invalid-preview-range';
      }
    }
  }

  if (dateStr === todayStr) {
    return 'today';
  }

  return 'default';
}

/**
 * Handles clicking a date cell in the Stays WHEN calendar:
 * 1. Past dates are ignored.
 * 2. If no checkIn is set (or both checkIn and checkOut were already chosen), starts a new selection with checkIn = clickedDateStr.
 * 3. If checkIn is set and checkOut is empty:
 *    - If clickedDateStr <= checkIn: does NOT overwrite checkIn or restart; returns the contextual tooltip
 *      "Please select a check-out date after your check-in date." so the visitor can pick a valid checkout date.
 *    - If clickedDateStr > checkIn: completes the range and computes occupiedNights (distinguishing checkout date from occupied nights).
 */
export function handleCalendarDateClick(
  clickedDateStr: string,
  todayStr: string,
  currentCheckIn: string,
  currentCheckOut: string
): CalendarDateClickOutcome {
  if (!clickedDateStr || (todayStr && clickedDateStr < todayStr)) {
    return {
      checkIn: currentCheckIn,
      checkOut: currentCheckOut,
      occupiedNights:
        currentCheckIn && currentCheckOut
          ? calculateNights(currentCheckIn, currentCheckOut)
          : 0,
      invalidDateClicked: null,
      errorMessage: null,
      completedRange: Boolean(currentCheckIn && currentCheckOut),
    };
  }

  // Starting a brand-new date selection or resetting after a completed range
  if (!currentCheckIn || (currentCheckIn && currentCheckOut)) {
    return {
      checkIn: clickedDateStr,
      checkOut: '',
      occupiedNights: 0,
      invalidDateClicked: null,
      errorMessage: null,
      completedRange: false,
    };
  }

  // Attempting to select a check-out date on or before the check-in date
  if (clickedDateStr <= currentCheckIn) {
    return {
      checkIn: currentCheckIn,
      checkOut: '',
      occupiedNights: 0,
      invalidDateClicked: clickedDateStr,
      errorMessage: INVALID_CHECKOUT_TOOLTIP_MESSAGE,
      completedRange: false,
    };
  }

  // Valid check-out date after check-in
  const occupiedNights = calculateNights(currentCheckIn, clickedDateStr);
  return {
    checkIn: currentCheckIn,
    checkOut: clickedDateStr,
    occupiedNights,
    invalidDateClicked: null,
    errorMessage: null,
    completedRange: true,
  };
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a short readable date (e.g., "12 Dec").
 */
export function formatShortStayDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return isoDate;
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/**
 * Formats a check-in / check-out range and occupied night count clearly.
 */
export function formatStayDateRangeSummary(checkIn: string, checkOut: string): {
  rangeLabel: string;
  nightsLabel: string;
  occupiedNights: number;
} {
  if (!checkIn && !checkOut) {
    return {
      rangeLabel: 'Any dates',
      nightsLabel: 'Add dates for exact stay duration',
      occupiedNights: 0,
    };
  }

  if (checkIn && !checkOut) {
    return {
      rangeLabel: `${formatShortStayDate(checkIn)} – Select check-out`,
      nightsLabel: 'Select a check-out date',
      occupiedNights: 0,
    };
  }

  const nights = calculateNights(checkIn, checkOut);
  const inShort = formatShortStayDate(checkIn);
  const outShort = formatShortStayDate(checkOut);

  return {
    rangeLabel: `${inShort} – ${outShort}`,
    nightsLabel: `${nights} ${nights === 1 ? 'night' : 'nights'} (check-out ${outShort})`,
    occupiedNights: nights,
  };
}

/**
 * Computes maximum guest capacity for a single property from its active rooms.
 */
export function getPropertyMaxGuestCapacity(property: any): number {
  if (!property) return 2;
  const activeRooms = Array.isArray(property.rooms)
    ? property.rooms.filter((r: any) => r && r.active !== false)
    : [];
  if (activeRooms.length === 0) {
    return Number(property.max_guests) || 2;
  }
  const totalRoomCapacity = activeRooms.reduce(
    (sum: number, room: any) => sum + (Number(room.max_guests) || 0),
    0
  );
  return Math.max(totalRoomCapacity, 1);
}

/**
 * Computes the highest maximum guest capacity across all published properties.
 */
export function getCatalogMaxGuestCapacity(
  properties: any[] = EXISTING_PROPERTIES
): number {
  const valid = (properties || []).filter(
    (p) =>
      p &&
      p.slug !== 'wonderway-retreat' &&
      p.published === true &&
      p.moderation_status === 'approved'
  );
  if (valid.length === 0) return 2;
  return Math.max(...valid.map((p) => getPropertyMaxGuestCapacity(p)), 2);
}

/**
 * Validates and formats guest counts (Adults 18+, Children 2–17 with individual ages, Infants <2).
 * Infants under 2 are not treated as interchangeable with adults/children for bed occupancy.
 */
export function validateAndFormatGuests(
  selection: Partial<StaysGuestSelection>,
  maxPropertyCapacity = 2
): StaysGuestSummary {
  const adults = Math.max(1, Math.min(12, Math.floor(Number(selection.adults) || 1)));
  const children = Math.max(0, Math.min(8, Math.floor(Number(selection.children) || 0)));
  const infants = Math.max(0, Math.min(5, Math.floor(Number(selection.infants) || 0)));

  const rawAges = Array.isArray(selection.childAges) ? selection.childAges : [];
  const childAges: number[] = [];
  for (let i = 0; i < children; i += 1) {
    const candidate = Number(rawAges[i]);
    if (Number.isFinite(candidate) && candidate >= 2 && candidate <= 17) {
      childAges.push(Math.floor(candidate));
    } else {
      childAges.push(6);
    }
  }

  const totalSeatedGuests = adults + children;
  const guestPart = `${totalSeatedGuests} ${totalSeatedGuests === 1 ? 'guest' : 'guests'}`;
  const infantPart =
    infants > 0 ? `, ${infants} ${infants === 1 ? 'infant' : 'infants'}` : '';

  const summaryLabel = `${guestPart}${infantPart}`;
  const compactSummaryLabel = `${guestPart}${infantPart}`;

  const exceedsMaxPropertyCapacity = totalSeatedGuests > maxPropertyCapacity;
  const capacityWarning = exceedsMaxPropertyCapacity
    ? `Currently published mountain rooms accommodate up to ${maxPropertyCapacity} guests per room.`
    : null;

  return {
    adults,
    children,
    childAges,
    infants,
    totalSeatedGuests,
    summaryLabel,
    compactSummaryLabel,
    exceedsMaxPropertyCapacity,
    maxPropertyCapacity,
    capacityWarning,
  };
}

/**
 * Determines whether a property qualifies for the "Guest Favourite" designation
 * based on genuine approved guest reviews (average rating >= 4.8 with at least 1 approved review)
 * or an explicit `featured === true` / `is_guest_favourite === true` flag on the published record.
 */
export function isPropertyGuestFavourite(
  property: any,
  approvedReviews: PublicReviewItem[] = EXISTING_REVIEWS
): boolean {
  if (!property) return false;
  if (property.is_guest_favourite === true || property.featured === true) {
    return true;
  }

  const matchingReviews = (approvedReviews || []).filter((rev) => {
    if (!rev || rev.moderation_status !== 'approved') return false;
    if (rev.property_id && property.id && rev.property_id === property.id) return true;
    const revSlug = normalizeText(rev.properties?.slug);
    const propSlug = normalizeText(property.slug);
    if (revSlug && propSlug && (revSlug === propSlug || propSlug.startsWith(revSlug))) {
      return true;
    }
    const revName = normalizeText(rev.properties?.name);
    const propName = normalizeText(property.name);
    if (revName && propName && revName === propName) {
      return true;
    }
    return false;
  });

  if (matchingReviews.length === 0) return false;
  const sum = matchingReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  const avg = sum / matchingReviews.length;
  return avg >= 4.8;
}

interface CanonicalAmenityDefinition {
  id: string;
  label: string;
  category: 'designation' | 'amenity';
  matchesAmenityText: (normalizedAmenity: string, property: any) => boolean;
}

const CANONICAL_AMENITY_DEFINITIONS: CanonicalAmenityDefinition[] = [
  {
    id: 'wifi',
    label: 'Wi-Fi',
    category: 'amenity',
    matchesAmenityText: (text) =>
      text.includes('wi-fi') || text.includes('wifi') || text.includes('internet'),
  },
  {
    id: 'mountain-view',
    label: 'Mountain View',
    category: 'amenity',
    matchesAmenityText: (text, property) =>
      text.includes('mountain-view') ||
      text.includes('mountain view') ||
      (Array.isArray(property?.rooms) &&
        property.rooms.some((r: any) =>
          normalizeText(r?.room_name).includes('mountain view')
        )),
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    category: 'amenity',
    matchesAmenityText: (text) => text.includes('kitchen') || text.includes('kitchenette'),
  },
  {
    id: 'tv',
    label: 'TV',
    category: 'amenity',
    matchesAmenityText: (text) =>
      text === 'tv' || text.includes('television') || text.includes('smart tv'),
  },
  {
    id: 'attached-bathroom',
    label: 'Attached Bathroom',
    category: 'amenity',
    matchesAmenityText: (text) =>
      text.includes('attached bathroom') ||
      text.includes('private bathroom') ||
      text.includes('ensuite') ||
      text.includes('en-suite'),
  },
  {
    id: 'free-parking',
    label: 'Free Parking',
    category: 'amenity',
    matchesAmenityText: (text) => text.includes('parking'),
  },
  {
    id: 'meal-plans',
    label: 'Home-Style Meals',
    category: 'amenity',
    matchesAmenityText: (text) =>
      text.includes('breakfast') || text.includes('dinner') || text.includes('meal'),
  },
  {
    id: 'tea-coffee',
    label: 'Tea & Coffee',
    category: 'amenity',
    matchesAmenityText: (text) => text.includes('tea') || text.includes('coffee'),
  },
  {
    id: 'laundry',
    label: 'Laundry',
    category: 'amenity',
    matchesAmenityText: (text) => text.includes('laundry'),
  },
  {
    id: 'pet-friendly',
    label: 'Pet-Friendly',
    category: 'amenity',
    matchesAmenityText: (text) => text.includes('pet-friendly') || text.includes('pet friendly'),
  },
];

/**
 * Checks whether a single published property matches a given direct amenity chip ID.
 */
export function propertyMatchesAmenityChip(
  property: any,
  chipId: string,
  approvedReviews: PublicReviewItem[] = EXISTING_REVIEWS
): boolean {
  if (!property) return false;
  if (chipId === 'guest-favourite') {
    return isPropertyGuestFavourite(property, approvedReviews);
  }

  const amenitiesList: string[] = Array.isArray(property.amenities)
    ? property.amenities.map((a: any) => normalizeText(String(a)))
    : [];

  const definition = CANONICAL_AMENITY_DEFINITIONS.find((d) => d.id === chipId);
  if (definition) {
    return (
      amenitiesList.some((text) => definition.matchesAmenityText(text, property)) ||
      definition.matchesAmenityText('', property)
    );
  }

  return amenitiesList.some((text) => text === normalizeText(chipId));
}

/**
 * Derives the row of Direct Amenity Chips strictly from actual published property data
 * and genuine approved guest reviews. Never displays chips that have zero backing in published data.
 */
export function deriveAvailableAmenityChips(
  properties: any[] = EXISTING_PROPERTIES,
  approvedReviews: PublicReviewItem[] = EXISTING_REVIEWS
): AmenityChipOption[] {
  const validProperties = (properties || []).filter(
    (p) =>
      p &&
      p.slug !== 'wonderway-retreat' &&
      p.published === true &&
      p.moderation_status === 'approved'
  );

  const chips: AmenityChipOption[] = [];

  // 1. Check Guest Favourite designation backed by genuine reviews
  const guestFavCount = validProperties.filter((p) =>
    isPropertyGuestFavourite(p, approvedReviews)
  ).length;
  if (guestFavCount > 0) {
    chips.push({
      id: 'guest-favourite',
      label: 'Guest Favourite',
      category: 'designation',
      matchingCount: guestFavCount,
    });
  }

  // 2. Check each canonical amenity against real published property data
  for (const def of CANONICAL_AMENITY_DEFINITIONS) {
    const matchingCount = validProperties.filter((p) =>
      propertyMatchesAmenityChip(p, def.id, approvedReviews)
    ).length;

    if (matchingCount > 0) {
      chips.push({
        id: def.id,
        label: def.label,
        category: def.category,
        matchingCount,
      });
    }
  }

  return chips;
}

/**
 * Filters published properties by combined search criteria:
 * - Destination slug or free-text destination/property query
 * - Check-in / Check-out date validity
 * - Guest occupancy (Adults + Children <= property active room capacity)
 * - Selected Direct Amenity Chips (all selected chips must match)
 * - Optional propertyType filter
 */
export function filterStaysProperties(
  properties: any[] = EXISTING_PROPERTIES,
  criteria: StaysSearchCriteria = {},
  destinations: Destination[] = CURATED_DESTINATIONS,
  approvedReviews: PublicReviewItem[] = EXISTING_REVIEWS
): any[] {
  const validProperties = (properties || []).filter(
    (p) =>
      p &&
      p.slug !== 'wonderway-retreat' &&
      p.published === true &&
      p.moderation_status === 'approved'
  );

  let results = [...validProperties];

  const destinationQuery = normalizeText(criteria.destinationSlug);
  const textQuery = normalizeText(criteria.query);

  if (destinationQuery) {
    // Check if destinationQuery matches a published property slug directly
    const directPropMatch = results.filter(
      (p) => normalizeText(p.slug) === destinationQuery || normalizeText(p.name) === destinationQuery
    );
    if (directPropMatch.length > 0) {
      results = directPropMatch;
    } else {
      const matchedDest = (destinations || []).find(
        (d) =>
          d.slug === destinationQuery ||
          normalizeText(d.name) === destinationQuery ||
          d.matchTerms?.some((t) => normalizeText(t) === destinationQuery)
      );
      if (matchedDest) {
        const primary = filterPropertiesForDestination(results, matchedDest);
        const nearby = getNearbyPropertiesForDestination(results, matchedDest);
        results = primary.length > 0 ? primary : nearby;
      } else {
        results = results.filter(
          (p) =>
            normalizeText(p.village).includes(destinationQuery) ||
            normalizeText(p.district).includes(destinationQuery) ||
            normalizeText(p.name).includes(destinationQuery)
        );
      }
    }
  }

  if (textQuery) {
    const matchedDest = (destinations || []).find(
      (d) =>
        d.slug === textQuery ||
        normalizeText(d.name).includes(textQuery) ||
        d.matchTerms?.some((t) => normalizeText(t).includes(textQuery))
    );

    results = results.filter((p) => {
      const inProp =
        normalizeText(p.name).includes(textQuery) ||
        normalizeText(p.village).includes(textQuery) ||
        normalizeText(p.district).includes(textQuery) ||
        normalizeText(p.description).includes(textQuery);
      if (inProp) return true;
      if (matchedDest) {
        return (
          filterPropertiesForDestination([p], matchedDest).length > 0 ||
          getNearbyPropertiesForDestination([p], matchedDest).length > 0
        );
      }
      return false;
    });
  }

  // Filter by guest occupancy (Adults + Children seated capacity)
  const adults = Number(criteria.adults) || 0;
  const children = Number(criteria.children) || 0;
  const totalSeatedGuests = adults + children;
  if (totalSeatedGuests > 0) {
    results = results.filter((p) => {
      const maxCap = getPropertyMaxGuestCapacity(p);
      return totalSeatedGuests <= maxCap;
    });
  }

  // Filter by property type if specified
  const typeParam = normalizeText(criteria.propertyType);
  if (typeParam) {
    const selectedTypes = typeParam
      .split(',')
      .map((t) => t.trim().replace(/s$/, ''))
      .filter(Boolean);
    if (selectedTypes.length > 0) {
      results = results.filter((p) => {
        const pt = normalizeText(p.property_type || 'homestay').replace(/s$/, '');
        return selectedTypes.some((st) => pt.includes(st) || st.includes(pt));
      });
    }
  }

  // Filter by selected Direct Amenity Chips (every selected chip must match)
  const selectedChips = Array.isArray(criteria.selectedAmenityIds)
    ? criteria.selectedAmenityIds.filter(Boolean)
    : [];
  if (selectedChips.length > 0) {
    results = results.filter((p) =>
      selectedChips.every((chipId) =>
        propertyMatchesAmenityChip(p, chipId, approvedReviews)
      )
    );
  }

  return results;
}

/**
 * Formats the concise summary shown inside the compact mobile search capsule.
 * Default state: "Where to? · Any dates · 2 guests"
 */
export function formatSearchCapsuleSummary(params: {
  destinationLabel?: string;
  query?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  infants?: number;
}): {
  whereText: string;
  whenText: string;
  whoText: string;
  fullText: string;
} {
  const whereText =
    (params.destinationLabel || '').trim() ||
    (params.query || '').trim() ||
    'Where to?';

  let whenText = 'Any dates';
  if (params.checkIn && params.checkOut) {
    whenText = `${formatShortStayDate(params.checkIn)} – ${formatShortStayDate(params.checkOut)}`;
  } else if (params.checkIn) {
    whenText = `${formatShortStayDate(params.checkIn)} – Check-out`;
  }

  const guestSummary = validateAndFormatGuests({
    adults: params.adults ?? 2,
    children: params.children ?? 0,
    infants: params.infants ?? 0,
  });
  const whoText = guestSummary.compactSummaryLabel;

  return {
    whereText,
    whenText,
    whoText,
    fullText: `${whereText} · ${whenText} · ${whoText}`,
  };
}

const FULL_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface RoomOccupancyInterval {
  room_unit_id?: string;
  start_date: string;
  end_date: string;
  kind: 'booking' | 'block' | 'booked' | 'blocked' | string;
}

export interface RoomOccupancyConflictResult {
  conflictDateStr: string;
  formattedDate: string;
  status: 'booked' | 'blocked';
  message: string;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) with the day and full month name, e.g. "25 November".
 */
export function formatDateWithMonthName(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const parts = trimmed.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return trimmed;
  }
  const [, month, day] = parts;
  const monthName = FULL_MONTH_NAMES[month - 1];
  if (!monthName || day < 1 || day > 31) {
    return trimmed;
  }
  return `${day} ${monthName}`;
}

/**
 * Generates the professional response when a user attempts to select or book a date that is booked or blocked:
 * "The 25 November date you selected is booked. Please try different dates."
 * or
 * "The 25 November date you selected is blocked. Please try different dates."
 * (or "The date you selected is booked. Please try different dates." when no date label is provided)
 */
export function formatUnavailableDateMessage(
  dateStrOrLabel: string,
  status: 'booked' | 'blocked'
): string {
  const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test((dateStrOrLabel || '').trim())
    ? formatDateWithMonthName(dateStrOrLabel)
    : (dateStrOrLabel || '').trim();

  const statusWord = status === 'booked' ? 'booked' : 'blocked';

  if (!formattedDate) {
    return `The date you selected is ${statusWord}. Please try different dates.`;
  }

  return `The ${formattedDate} date you selected is ${statusWord}. Please try different dates.`;
}

/**
 * Checks whether a single date (checkIn without checkOut) or a stay range [checkIn, checkOut)
 * conflicts with any booked or host-blocked interval for the selected room unit (or all rooms if roomUnitId is omitted or 'all').
 * Returns the exact conflicting date formatted with its month name and the user-facing response message.
 */
export function findRoomOccupancyConflict(params: {
  checkIn: string;
  checkOut?: string;
  occupancy: RoomOccupancyInterval[];
  roomUnitId?: string;
}): RoomOccupancyConflictResult | null {
  const { checkIn, checkOut, occupancy, roomUnitId } = params;
  if (!checkIn || !Array.isArray(occupancy) || occupancy.length === 0) {
    return null;
  }

  const filterBySpecificRoom = Boolean(roomUnitId && roomUnitId !== 'all');

  const roomBlocks = occupancy
    .filter((o) => {
      if (!o || !o.start_date || !o.end_date) return false;
      if (filterBySpecificRoom) {
        if (!o.room_unit_id || String(o.room_unit_id) !== String(roomUnitId)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  // Case 1: Single date check (no checkOut or checkOut <= checkIn)
  if (!checkOut || checkOut <= checkIn) {
    const match = roomBlocks.find(
      (o) => checkIn >= o.start_date && checkIn < o.end_date
    );
    if (!match) return null;

    const status: 'booked' | 'blocked' =
      match.kind === 'booking' || match.kind === 'booked' ? 'booked' : 'blocked';
    const formattedDate = formatDateWithMonthName(checkIn);
    return {
      conflictDateStr: checkIn,
      formattedDate,
      status,
      message: formatUnavailableDateMessage(checkIn, status),
    };
  }

  // Case 2: Date range [checkIn, checkOut)
  const overlapping = roomBlocks.find(
    (o) => checkIn < o.end_date && checkOut > o.start_date
  );
  if (!overlapping) return null;

  // The first conflicting night inside the user's selected range [checkIn, checkOut)
  const conflictDateStr =
    overlapping.start_date > checkIn ? overlapping.start_date : checkIn;
  const status: 'booked' | 'blocked' =
    overlapping.kind === 'booking' || overlapping.kind === 'booked'
      ? 'booked'
      : 'blocked';
  const formattedDate = formatDateWithMonthName(conflictDateStr);

  return {
    conflictDateStr,
    formattedDate,
    status,
    message: formatUnavailableDateMessage(conflictDateStr, status),
  };
}

