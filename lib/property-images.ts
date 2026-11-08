/**
 * Return usable HTTPS photo URLs in cover-first order.
 * Inline data URLs are intentionally excluded: they bypass image optimization
 * and can inflate the HTML/RSC payload with large base64 strings.
 */
export function getPropertyPhotoList(coverPhoto: unknown, photos: unknown): string[] {
  const candidates = [coverPhoto, ...(Array.isArray(photos) ? photos : [])];
  const usable = candidates.filter((value): value is string => {
    if (typeof value !== 'string' || value.length > 4096) return false;
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  });
  return Array.from(new Set(usable));
}
