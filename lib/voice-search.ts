import { CURATED_DESTINATIONS, type Destination } from './destinations';

export interface ParsedVoiceSearchCommand {
  rawTranscript: string;
  cleanedQuery: string;
  matchedDestinationSlug: string | null;
  matchedDestinationName: string | null;
  extractedGuests: number | null;
}

const VOICE_PREFIX_PATTERNS: RegExp[] = [
  /^(?:please\s+)?(?:search\s+for|search|find|show\s+me|look\s+for|explore|book|take\s+me\s+to|open|go\s+to)\s+(?:stays?\s+in|homestays?\s+in|hotels?\s+in|camps?\s+in|properties\s+in|destinations?\s+in)?\s*/i,
  /^(?:stays?\s+in|homestays?\s+in|hotels?\s+in|camps?\s+in|places?\s+in|retreats?\s+in)\s+/i,
];

/**
 * Pure parser for spoken voice search transcripts.
 * Strips conversational filler ("find stays in Manali for 4 guests."),
 * extracts optional guest counts, and resolves matching Himalayan destinations.
 */
export function parseVoiceSearchCommand(
  rawTranscript: string,
  destinations: readonly Destination[] = CURATED_DESTINATIONS
): ParsedVoiceSearchCommand {
  const trimmedRaw = (rawTranscript || '').trim();
  if (!trimmedRaw) {
    return {
      rawTranscript: '',
      cleanedQuery: '',
      matchedDestinationSlug: null,
      matchedDestinationName: null,
      extractedGuests: null,
    };
  }

  // Strip trailing punctuation added by speech recognition engines
  let working = trimmedRaw.replace(/[.?!,;]+$/g, '').trim();

  // Extract optional "for N guest(s)" or "N guest(s)" phrase
  let extractedGuests: number | null = null;
  const guestMatch = working.match(/(?:\bfor\s+)?\b(\d{1,2})\s+(?:guests?|people|persons?|adults?)\b/i);
  if (guestMatch) {
    const parsedNum = parseInt(guestMatch[1], 10);
    if (!Number.isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 20) {
      extractedGuests = parsedNum;
    }
    working = working.replace(guestMatch[0], ' ').replace(/\s+/g, ' ').trim();
  }

  // Strip leading voice command prefixes ("search for stays in ...", "find ...", etc.)
  for (const pattern of VOICE_PREFIX_PATTERNS) {
    const next = working.replace(pattern, '').trim();
    if (next.length > 0 && next !== working) {
      working = next;
      break;
    }
  }

  // Clean trailing prepositions left over after guest removal
  working = working.replace(/\b(?:in|at|near|around|for)\s*$/i, '').trim();

  const cleanedQuery = working || trimmedRaw.replace(/[.?!,;]+$/g, '').trim();
  const norm = cleanedQuery.toLowerCase();

  let matchedDestination: Destination | null = null;

  if (norm.length > 0) {
    // 1. Exact or prefix match on destination name or slug
    matchedDestination =
      destinations.find(
        (d) =>
          d.name.toLowerCase() === norm ||
          d.slug.toLowerCase() === norm ||
          d.name.toLowerCase().startsWith(norm) ||
          norm.includes(d.name.toLowerCase())
      ) || null;

    // 2. Match against destination matchTerms (e.g. "Tosh", "Jari", "Parvati Valley", "McLeod Ganj")
    if (!matchedDestination) {
      matchedDestination =
        destinations.find((d) =>
          (d.matchTerms || []).some(
            (term) =>
              term.toLowerCase() === norm ||
              (norm.length >= 3 && term.toLowerCase().includes(norm)) ||
              (term.length >= 3 && norm.includes(term.toLowerCase()))
          )
        ) || null;
    }
  }

  return {
    rawTranscript: trimmedRaw,
    cleanedQuery,
    matchedDestinationSlug: matchedDestination ? matchedDestination.slug : null,
    matchedDestinationName: matchedDestination ? matchedDestination.name : null,
    extractedGuests,
  };
}
