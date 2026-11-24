import {
  normalizeAmenitiesList,
  formatPropertyTypeLabel,
  type CategorizedAmenity,
} from './property-quick-view';
import { EXISTING_REVIEWS, type PublicReviewItem } from './reviews';

export const STAYS_TRANSITION_STORAGE_KEY = 'uttarkunth_stays_shared_transition_v1';

export interface BoundingBoxRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type SharedTransitionPhase = 'opening' | 'active-detail' | 'closing';

export interface QuickViewTransitionRecord {
  propertyId: string;
  propertySlug: string;
  propertyName: string;
  propertyTypeLabel: string;
  locationLabel: string;
  startingPrice: number | null;
  coverPhoto: string | null;
  sourcePath: string;
  scrollY: number;
  ctaRect: BoundingBoxRect;
  cardRect: BoundingBoxRect;
  viewportWidth: number;
  viewportHeight: number;
  phase: SharedTransitionPhase;
  timestamp: number;
}

export interface SharedElementFlipGeometry {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  transformOriginX: number;
  transformOriginY: number;
  initialTransform: string;
  settledTransform: string;
}

export interface PropertyRatingSummary {
  hasGenuineReviews: boolean;
  reviewCount: number;
  averageRating: number | null;
  averageRatingLabel: string | null;
  isGuestFavourite: boolean;
}

function normalizeStr(val: unknown): string {
  return typeof val === 'string' ? val.toLowerCase().trim() : '';
}

/**
 * Computes genuine rating and Guest Favourite status strictly from verified approved reviews
 * or explicit database flags. Never invents ratings for properties without records.
 */
export function computePropertyRatingSummary(
  property: Record<string, any> | null | undefined,
  approvedReviews: PublicReviewItem[] = EXISTING_REVIEWS
): PropertyRatingSummary {
  if (!property) {
    return {
      hasGenuineReviews: false,
      reviewCount: 0,
      averageRating: null,
      averageRatingLabel: null,
      isGuestFavourite: false,
    };
  }

  const propId = String(property.id || '').trim();
  const propSlug = normalizeStr(property.slug);
  const propName = normalizeStr(property.name);

  const matching = (approvedReviews || []).filter((rev) => {
    if (!rev || rev.moderation_status !== 'approved') return false;
    if (propId && rev.property_id && rev.property_id === propId) return true;
    const revSlug = normalizeStr(rev.properties?.slug);
    if (propSlug && revSlug && (propSlug === revSlug || propSlug.startsWith(revSlug))) {
      return true;
    }
    const revName = normalizeStr(rev.properties?.name);
    if (propName && revName && propName === revName) {
      return true;
    }
    return false;
  });

  if (matching.length === 0) {
    const explicitFav =
      property.is_guest_favourite === true || property.featured === true;
    return {
      hasGenuineReviews: false,
      reviewCount: 0,
      averageRating: null,
      averageRatingLabel: null,
      isGuestFavourite: explicitFav,
    };
  }

  const total = matching.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
  const avg = Number((total / matching.length).toFixed(1));
  const isGuestFavourite =
    avg >= 4.8 || property.is_guest_favourite === true || property.featured === true;

  return {
    hasGenuineReviews: true,
    reviewCount: matching.length,
    averageRating: avg,
    averageRatingLabel: avg.toFixed(1),
    isGuestFavourite,
  };
}

/**
 * Extracts compact desktop (max 3) and mobile (max 2) genuine amenities
 * without fabricating missing values.
 */
export function formatCardAmenities(
  rawAmenities: unknown,
  maxDesktop = 3,
  maxMobile = 2
): {
  desktopAmenities: CategorizedAmenity[];
  mobileAmenities: CategorizedAmenity[];
  mobileInlineText: string;
} {
  const all = normalizeAmenitiesList(rawAmenities);
  const desktopAmenities = all.slice(0, Math.max(0, maxDesktop));
  const mobileAmenities = all.slice(0, Math.max(0, maxMobile));
  const mobileInlineText = mobileAmenities.map((a) => a.label).join(' · ');

  return {
    desktopAmenities,
    mobileAmenities,
    mobileInlineText,
  };
}

/**
 * Extracts the actual starting room rate from active room units or direct property fields.
 * Returns null if no genuine rate is available.
 */
export function getPropertyStartingRate(property: Record<string, any> | null | undefined): number | null {
  if (!property) return null;
  const rooms = Array.isArray(property.rooms)
    ? property.rooms.filter((r: any) => r && r.active !== false)
    : [];

  const validRoomPrices = rooms
    .map((r: any) => Number(r.base_price))
    .filter((price: number) => Number.isFinite(price) && price > 0);

  if (validRoomPrices.length > 0) {
    return Math.min(...validRoomPrices);
  }

  const directPrice = Number(property.base_price ?? property.starting_price);
  if (Number.isFinite(directPrice) && directPrice > 0) {
    return directPrice;
  }

  return null;
}

/**
 * Computes deterministic FLIP transform parameters so the destination page (or closing view)
 * unfolds directly from—and collapses directly back into—the exact screen bounding box
 * of the tapped Quick View CTA button.
 */
export function computeSharedElementTransform(
  ctaRect: BoundingBoxRect,
  targetRect: BoundingBoxRect
): SharedElementFlipGeometry {
  const safeTargetWidth = Math.max(1, targetRect.width);
  const safeTargetHeight = Math.max(1, targetRect.height);
  const safeCtaWidth = Math.max(24, ctaRect.width);
  const safeCtaHeight = Math.max(24, ctaRect.height);

  // Scale ratios from the full destination container down to the Quick View CTA dimensions
  const rawScaleX = safeCtaWidth / safeTargetWidth;
  const rawScaleY = safeCtaHeight / safeTargetHeight;

  const scaleX = Number(Math.min(1, Math.max(0.08, rawScaleX)).toFixed(4));
  const scaleY = Number(Math.min(1, Math.max(0.06, rawScaleY)).toFixed(4));

  // Center of the Quick View CTA in viewport coordinates
  const ctaCenterX = ctaRect.left + safeCtaWidth / 2;
  const ctaCenterY = ctaRect.top + safeCtaHeight / 2;

  // Top-center / center reference of target container in viewport coordinates
  // Using top-anchored scaling with transformOrigin at top-left (0, 0) makes the math exact:
  // When transform-origin is 0 0, a point (0, 0) on target is at (targetRect.left, targetRect.top).
  // After translate3d(tx, ty, 0) scale(sx, sy), the scaled box's center is at:
  //   targetRect.left + tx + (safeTargetWidth * scaleX) / 2 = ctaCenterX
  //   targetRect.top  + ty + (safeTargetHeight * scaleY) / 2 = ctaCenterY
  const translateX = Math.round(
    ctaCenterX - targetRect.left - (safeTargetWidth * scaleX) / 2
  );
  const translateY = Math.round(
    ctaCenterY - targetRect.top - (safeTargetHeight * scaleY) / 2
  );

  const transformOriginX = Math.round(
    Math.min(safeTargetWidth, Math.max(0, ctaCenterX - targetRect.left))
  );
  const transformOriginY = Math.round(
    Math.min(safeTargetHeight, Math.max(0, ctaCenterY - targetRect.top))
  );

  return {
    translateX,
    translateY,
    scaleX,
    scaleY,
    transformOriginX,
    transformOriginY,
    initialTransform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`,
    settledTransform: 'translate3d(0px, 0px, 0) scale(1, 1)',
  };
}

/**
 * Checks whether a stored transition record matches a given property ID or slug.
 */
export function matchesTransitionProperty(
  record: QuickViewTransitionRecord | null | undefined,
  propertyId?: string | null,
  propertySlug?: string | null
): boolean {
  if (!record) return false;
  const recId = normalizeStr(record.propertyId);
  const recSlug = normalizeStr(record.propertySlug);
  const targetId = normalizeStr(propertyId);
  const targetSlug = normalizeStr(propertySlug);

  if (targetId && (recId === targetId || recSlug === targetId)) return true;
  if (targetSlug && (recSlug === targetSlug || recId === targetSlug)) return true;
  if (
    targetSlug &&
    recSlug &&
    (targetSlug.startsWith(recSlug) || recSlug.startsWith(targetSlug))
  ) {
    return true;
  }
  return false;
}

export function isTransitionRecordFresh(
  record: QuickViewTransitionRecord | null | undefined,
  now = Date.now(),
  maxAgeMs = 300_000
): boolean {
  if (!record || typeof record.timestamp !== 'number') return false;
  return now - record.timestamp >= 0 && now - record.timestamp <= maxAgeMs;
}

let inMemoryTransitionRecord: QuickViewTransitionRecord | null = null;

export function saveQuickViewTransitionRecord(record: QuickViewTransitionRecord): void {
  inMemoryTransitionRecord = record;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STAYS_TRANSITION_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage quota or private mode restrictions
  }
}

export function readQuickViewTransitionRecord(): QuickViewTransitionRecord | null {
  if (typeof window === 'undefined') return inMemoryTransitionRecord;
  try {
    const raw = window.sessionStorage.getItem(STAYS_TRANSITION_STORAGE_KEY);
    if (!raw) return inMemoryTransitionRecord;
    const parsed = JSON.parse(raw) as QuickViewTransitionRecord;
    if (
      parsed &&
      typeof parsed.propertySlug === 'string' &&
      parsed.ctaRect &&
      typeof parsed.ctaRect.top === 'number'
    ) {
      inMemoryTransitionRecord = parsed;
      return parsed;
    }
  } catch {
    // Fall back to in-memory record
  }
  return inMemoryTransitionRecord;
}

export function updateQuickViewTransitionPhase(
  phase: SharedTransitionPhase
): QuickViewTransitionRecord | null {
  const current = readQuickViewTransitionRecord();
  if (!current) return null;
  const updated: QuickViewTransitionRecord = {
    ...current,
    phase,
    timestamp: Date.now(),
  };
  saveQuickViewTransitionRecord(updated);
  return updated;
}

export function clearQuickViewTransitionRecord(): void {
  inMemoryTransitionRecord = null;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STAYS_TRANSITION_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export { formatPropertyTypeLabel };
