'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Clock,
  X,
  Home,
  Clapperboard,
  ArrowRight,
  ArrowUpRight,
  Trash2,
  Tent,
  Building2,
  Landmark,
  Trees,
  Mountain,
  Hammer,
  Shirt,
  Wheat,
  Lamp,
  Leaf,
  Palette,
  Recycle,
  Package,
  Film,
  Sparkles,
  MapPin,
  Compass,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
} from 'lucide-react';
import type { Destination } from '@/lib/destinations';
import { parseVoiceSearchCommand } from '@/lib/voice-search';
import {
  unifiedClientSearchHandler,
  segmentHighlightedText,
  getDestinationCardMeta,
  getProductCategoryCardMeta,
  getGenreCardMeta,
  PRODUCTION_GENRES_CATALOG,
  type PillarCategory,
  type SearchableServiceType,
  type StayPropertyItem,
  type ProductItem,
  type ProductCategoryItem,
  type ProductionItem,
  type RecentSearchEntry,
  type SuggestionItem,
} from '@/lib/smart-suggestions';

export {
  unifiedClientSearchHandler,
  segmentHighlightedText,
  getDestinationCardMeta,
  getProductCategoryCardMeta,
  getGenreCardMeta,
  PRODUCTION_GENRES_CATALOG,
  type PillarCategory,
  type SearchableServiceType,
  type StayPropertyItem,
  type ProductItem,
  type ProductCategoryItem,
  type ProductionItem,
  type RecentSearchEntry,
  type SuggestionItem,
};

export interface AdaptiveHeroSearchBarProps {
  activePillar?: PillarCategory;
  destinations: Destination[];
  properties: StayPropertyItem[];
  products: ProductItem[];
  productCategories: readonly ProductCategoryItem[];
  productions: ProductionItem[];
  onInteractionChange?: (isInteracting: boolean) => void;
  spotlightPhase?: 'idle' | 'peak' | 'settling';
}

const STORAGE_KEYS: Record<SearchableServiceType, string> = {
  stays: 'uttarkunth_hero_recent_stays_v1',
  products: 'uttarkunth_hero_recent_products_v1',
  productions: 'uttarkunth_hero_recent_originals_v1',
};

const MAX_RECENT_ITEMS = 5;
const INITIAL_VISIBLE_DESTINATIONS = 6;
const INITIAL_VISIBLE_CATEGORIES = 4;

const CORE_PROPERTY_TYPES = ['Homestays', 'Camps', 'Hotels', 'Villas', 'Resorts'] as const;

function getPropertyTypeIcon(typeLabel: string) {
  const lower = typeLabel.toLowerCase();
  if (lower.includes('camp')) return Tent;
  if (lower.includes('hotel')) return Building2;
  if (lower.includes('villa')) return Landmark;
  if (lower.includes('resort')) return Trees;
  return Home;
}

function getProductCategoryIcon(catIdOrName: string) {
  const lower = catIdOrName.toLowerCase();
  if (lower.includes('himalayan') || lower === 'products') return Mountain;
  if (lower.includes('craft') || lower.includes('handmade')) return Hammer;
  if (lower.includes('cloth') || lower.includes('textile') || lower.includes('fashion'))
    return Shirt;
  if (lower.includes('food') || lower.includes('produce')) return Wheat;
  if (lower.includes('home') || lower.includes('lifestyle')) return Lamp;
  if (lower.includes('organic') || lower.includes('natural')) return Leaf;
  if (lower.includes('art') || lower.includes('cultural')) return Palette;
  if (lower.includes('sustain') || lower.includes('eco')) return Recycle;
  return Package;
}

function getGenreIcon(genre: string) {
  const lower = genre.toLowerCase();
  if (lower.includes('documentary')) return Film;
  if (lower.includes('monologue') || lower.includes('cultural')) return Clapperboard;
  return Sparkles;
}

/**
 * Highlights all occurrences of matching query tokens inside text without splitting words visually
 */
export function HighlightMatch({
  text,
  query,
  highlightClassName,
}: {
  text: string;
  query: string;
  highlightClassName?: string;
}) {
  if (!text) return null;
  const segments = segmentHighlightedText(text, query);
  if (segments.length === 0) return <>{text}</>;

  return (
    <>
      {segments.map((seg, idx) =>
        seg.highlighted ? (
          <mark
            key={idx}
            className={
              highlightClassName ||
              'bg-[#FDE2A8] text-[#1A2B23] font-bold rounded-[2px] decoration-[#C55B23]/40 underline decoration-1 underline-offset-2'
            }
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={idx}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
}

export function UnifiedHeroSearchBar({
  activePillar = 'stays',
  destinations,
  properties,
  products,
  productCategories,
  productions,
  onInteractionChange,
  spotlightPhase = 'idle',
}: AdaptiveHeroSearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasOpenOnPointerDownRef = useRef<boolean>(false);

  // Independent per-category search & filter state (preserved across carousel transitions)
  const [staysState, setStaysState] = useState<{
    query: string;
    destination: string;
    propertyTypes: string[];
  }>({
    query: '',
    destination: '',
    propertyTypes: [],
  });

  const [productsState, setProductsState] = useState<{
    query: string;
    categories: string[];
  }>({
    query: '',
    categories: [],
  });

  const [productionsState, setProductionsState] = useState<{
    query: string;
    genres: string[];
  }>({
    query: '',
    genres: [],
  });

  // Dropdown open state & progressive "+ More" expansion toggles
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [showAllDestinations, setShowAllDestinations] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time fetched smart suggestions state (from /api/search/suggestions when typing)
  const [remoteSuggestions, setRemoteSuggestions] = useState<{
    key: string;
    items: SuggestionItem[];
  } | null>(null);
  const [isFetchingSmart, setIsFetchingSmart] = useState<boolean>(false);

  // Per-service recent searches loaded from client-side localStorage
  const [recentByService, setRecentByService] = useState<
    Record<SearchableServiceType, RecentSearchEntry[]>
  >({
    stays: [],
    products: [],
    productions: [],
  });

  // Load recent searches on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loaded: Record<SearchableServiceType, RecentSearchEntry[]> = {
      stays: [],
      products: [],
      productions: [],
    };
    (['stays', 'products', 'productions'] as SearchableServiceType[]).forEach((svc) => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEYS[svc]);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            loaded[svc] = parsed.slice(0, MAX_RECENT_ITEMS);
          }
        }
      } catch {
        // Ignore storage errors
      }
    });
    setRecentByService(loaded);
  }, []);

  // Reset keyboard highlight & expand state when active carousel slide changes, while keeping the search handler open
  useEffect(() => {
    setHighlightedIndex(-1);
    setShowAllDestinations(false);
    setShowAllCategories(false);
  }, [activePillar]);

  // Notify parent carousel whether visitor is actively interacting with the bar
  useEffect(() => {
    onInteractionChange?.(suggestionsOpen);
  }, [suggestionsOpen, onInteractionChange]);

  // Close dropdowns on outside click (ignoring carousel navigation controls so sliding the carousel keeps the search handler open)
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Element | null;
      if (target?.closest?.('[data-carousel-nav="true"]')) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Save a recent search entry for a specific service (deduplicated, most recent first, max 5)
  const saveRecentSearch = useCallback(
    (entry: Omit<RecentSearchEntry, 'id' | 'timestamp'>) => {
      setRecentByService((prev) => {
        const existing = prev[entry.service] || [];
        const normalizedQuery = entry.query.trim().toLowerCase();
        const deduped = existing.filter(
          (item) =>
            !(
              item.query.trim().toLowerCase() === normalizedQuery &&
              item.subtitle === entry.subtitle
            )
        );
        const nextEntry: RecentSearchEntry = {
          ...entry,
          id: `${entry.service}-${Date.now()}`,
          timestamp: Date.now(),
        };
        const updated = [nextEntry, ...deduped].slice(0, MAX_RECENT_ITEMS);
        try {
          window.localStorage.setItem(STORAGE_KEYS[entry.service], JSON.stringify(updated));
        } catch {
          // Ignore storage quota errors
        }
        return {
          ...prev,
          [entry.service]: updated,
        };
      });
    },
    []
  );

  const clearRecentSearches = useCallback((service: SearchableServiceType) => {
    setRecentByService((prev) => ({
      ...prev,
      [service]: [],
    }));
    try {
      window.localStorage.removeItem(STORAGE_KEYS[service]);
    } catch {
      // Ignore
    }
  }, []);

  // Clean property types list (Homestays, Camps, Hotels, Villas, Resorts)
  const availablePropertyTypes = useMemo(() => {
    const types = new Set<string>(CORE_PROPERTY_TYPES);
    properties.forEach((p) => {
      if (p.property_type) {
        const raw = p.property_type.trim();
        if (raw && raw.toLowerCase() !== 'other') {
          const normalized = raw.charAt(0).toUpperCase() + raw.slice(1);
          const alreadyCovered = Array.from(types).some(
            (existing) =>
              existing.toLowerCase().replace(/s$/, '') ===
              normalized.toLowerCase().replace(/s$/, '')
          );
          if (!alreadyCovered) {
            types.add(normalized);
          }
        }
      }
    });
    return Array.from(types);
  }, [properties]);

  // Derive actual available product categories (excluding generic 'other' so cards stay crisp)
  const availableProductCategories = useMemo(() => {
    const map = new Map<string, ProductCategoryItem>();
    productCategories.forEach((cat) => {
      if (cat.id !== 'other') {
        map.set(cat.id, cat);
      }
    });
    products.forEach((p) => {
      if (p.category && p.category.toLowerCase() !== 'other') {
        const exists = Array.from(map.values()).some(
          (c) => c.id === p.category || c.name.toLowerCase() === p.category.toLowerCase()
        );
        if (!exists) {
          map.set(p.category, {
            id: p.category,
            name: p.category,
            description: 'Verified Himalayan Maker Category',
          });
        }
      }
    });
    return Array.from(map.values());
  }, [productCategories, products]);

  // Derive available production genres (combining catalog + dynamic films)
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    productions.forEach((film) => {
      if (film.category) {
        genres.add(film.category);
      }
    });
    PRODUCTION_GENRES_CATALOG.forEach((g) => {
      genres.add(g.name);
    });
    return Array.from(genres);
  }, [productions]);

  const activeSearchService: SearchableServiceType | null =
    activePillar === 'community' ? null : activePillar;

  const currentQuery =
    activePillar === 'stays'
      ? staysState.query
      : activePillar === 'products'
        ? productsState.query
        : activePillar === 'productions'
          ? productionsState.query
          : '';

  const isTyping = currentQuery.trim().length > 0;

  const setCurrentQuery = useCallback(
    (val: string) => {
      if (activePillar === 'stays') {
        setStaysState((prev) => ({
          ...prev,
          query: val,
          destination: val.trim() === '' ? '' : prev.destination,
        }));
      } else if (activePillar === 'products') {
        setProductsState((prev) => ({ ...prev, query: val }));
      } else if (activePillar === 'productions') {
        setProductionsState((prev) => ({ ...prev, query: val }));
      }
    },
    [activePillar]
  );

  const showVoiceFeedbackMessage = useCallback((msg: string) => {
    if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
    setVoiceFeedback(msg);
    voiceTimerRef.current = setTimeout(() => {
      setVoiceFeedback(null);
    }, 2800);
  }, []);

  const applyVoiceTranscript = useCallback(
    (rawTranscript: string) => {
      const parsed = parseVoiceSearchCommand(rawTranscript, destinations);
      if (!parsed.cleanedQuery) return;

      if (activePillar === 'stays') {
        setStaysState((prev) => ({
          ...prev,
          query: parsed.matchedDestinationName || parsed.cleanedQuery,
          destination: parsed.matchedDestinationSlug || prev.destination,
        }));
      } else if (activePillar === 'products') {
        setProductsState((prev) => ({ ...prev, query: parsed.cleanedQuery }));
      } else if (activePillar === 'productions') {
        setProductionsState((prev) => ({ ...prev, query: parsed.cleanedQuery }));
      }

      setSuggestionsOpen(true);
      inputRef.current?.focus();
    },
    [activePillar, destinations]
  );

  // Clean up active voice recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      if (voiceTimerRef.current) {
        clearTimeout(voiceTimerRef.current);
      }
    };
  }, []);

  const handleToggleVoiceSearch = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      setIsListening(false);
      return;
    }

    // Support deterministic mock transcript hook for headless browser verification
    const win = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
      __mockSpeechTranscript?: string;
    };

    if (typeof win.__mockSpeechTranscript === 'string' && win.__mockSpeechTranscript.trim()) {
      setIsListening(true);
      const mockText = win.__mockSpeechTranscript;
      setTimeout(() => {
        applyVoiceTranscript(mockText);
        setIsListening(false);
      }, 120);
      return;
    }

    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      showVoiceFeedbackMessage('Voice search is not supported in this browser.');
      inputRef.current?.focus();
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex || 0; i < event.results.length; i += 1) {
          transcript += event.results[i][0]?.transcript || '';
        }
        if (transcript.trim()) {
          applyVoiceTranscript(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          showVoiceFeedbackMessage('Microphone access was denied.');
        } else if (event?.error !== 'aborted' && event?.error !== 'no-speech') {
          showVoiceFeedbackMessage('Could not capture voice input. Try typing instead.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      showVoiceFeedbackMessage('Unable to start voice search.');
    }
  }, [isListening, applyVoiceTranscript, showVoiceFeedbackMessage]);

  const staysPropTypesKey = staysState.propertyTypes.join(',');
  const productsCategoriesKey = productsState.categories.join(',');
  const productionsGenresKey = productionsState.genres.join(',');

  // Real-time fetch of smart suggestions from /api/search/suggestions when the user types
  useEffect(() => {
    if (!activeSearchService || !currentQuery.trim()) {
      setRemoteSuggestions(null);
      setIsFetchingSmart(false);
      return;
    }

    const requestKey = `${activeSearchService}::${currentQuery.trim()}::${staysPropTypesKey}::${productsCategoriesKey}::${productionsGenresKey}`;
    const controller = new AbortController();
    setIsFetchingSmart(true);

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          category: activeSearchService,
          q: currentQuery.trim(),
        });
        if (staysPropTypesKey) params.set('propertyTypes', staysPropTypesKey);
        if (productsCategoriesKey) params.set('categories', productsCategoriesKey);
        if (productionsGenresKey) params.set('genres', productionsGenresKey);

        const res = await fetch(`/api/search/suggestions?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          setIsFetchingSmart(false);
          return;
        }
        const data = await res.json();
        if (Array.isArray(data?.suggestions)) {
          setRemoteSuggestions({
            key: requestKey,
            items: data.suggestions,
          });
        }
      } catch {
        // Ignore abort or transient network error; local smart suggestions remain active
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingSmart(false);
        }
      }
    }, 90);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    activeSearchService,
    currentQuery,
    staysPropTypesKey,
    productsCategoriesKey,
    productionsGenresKey,
  ]);

  // Unified client-side live filtering + merged real-time API results for the active carousel category
  const { matchingRecents, liveSuggestions, navigableItems } = useMemo(() => {
    if (!activeSearchService) {
      return {
        matchingRecents: [] as RecentSearchEntry[],
        liveSuggestions: [] as SuggestionItem[],
        navigableItems: [] as SuggestionItem[],
      };
    }

    const localResult = unifiedClientSearchHandler({
      activeCategory: activeSearchService,
      query: currentQuery,
      filters: {
        propertyTypes: staysState.propertyTypes,
        categories: productsState.categories,
        genres: productionsState.genres,
      },
      recentSearches: recentByService[activeSearchService] || [],
      destinations,
      properties,
      products,
      productCategories: availableProductCategories,
      productions,
      availableGenres,
    });

    const expectedKey = `${activeSearchService}::${currentQuery.trim()}::${staysPropTypesKey}::${productsCategoriesKey}::${productionsGenresKey}`;
    if (remoteSuggestions && remoteSuggestions.key === expectedKey) {
      const mergedMap = new Map<string, SuggestionItem>();
      localResult.liveSuggestions.forEach((item) => mergedMap.set(item.id, item));
      remoteSuggestions.items.forEach((item) => {
        if (!mergedMap.has(item.id)) {
          mergedMap.set(item.id, item);
        }
      });
      const mergedLive = Array.from(mergedMap.values());
      const recentSuggestionItems: SuggestionItem[] = localResult.matchingRecents.map((r) => ({
        id: r.id,
        kind: 'recent',
        title: r.query,
        shortTitle: r.query,
        subtitle: r.subtitle || 'Recent Search',
        meta: 'Recent',
        valueToPopulate: r.query,
        recentEntry: r,
      }));
      return {
        matchingRecents: localResult.matchingRecents,
        liveSuggestions: mergedLive,
        navigableItems: [...recentSuggestionItems, ...mergedLive],
      };
    }

    return localResult;
  }, [
    activeSearchService,
    currentQuery,
    staysState.propertyTypes,
    productsState.categories,
    productionsState.genres,
    staysPropTypesKey,
    productsCategoriesKey,
    productionsGenresKey,
    recentByService,
    destinations,
    properties,
    products,
    availableProductCategories,
    productions,
    availableGenres,
    remoteSuggestions,
  ]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [currentQuery, activePillar]);

  // Execute search / direct navigation for the currently active carousel category
  const executeSearch = useCallback(
    (overrideSuggestion?: SuggestionItem) => {
      if (activePillar === 'stays') {
        let query = staysState.query.trim();
        let destinationSlug = staysState.destination;
        let propertyTypes = [...staysState.propertyTypes];

        if (overrideSuggestion) {
          query = overrideSuggestion.shortTitle || overrideSuggestion.valueToPopulate;
          if (overrideSuggestion.destinationSlug) {
            destinationSlug = overrideSuggestion.destinationSlug;
          }
          if (overrideSuggestion.propertyType) {
            propertyTypes = [overrideSuggestion.propertyType];
          }
          if (overrideSuggestion.recentEntry?.filters) {
            const rf = overrideSuggestion.recentEntry.filters;
            destinationSlug = rf.destination ?? destinationSlug;
            propertyTypes = rf.propertyTypes ?? propertyTypes;
          }
        }

        const exactProperty =
          overrideSuggestion?.kind === 'property' && overrideSuggestion.directUrl
            ? overrideSuggestion.directUrl
            : properties.find((p) => p.name.toLowerCase() === query.toLowerCase())
              ? `/stays/${properties.find((p) => p.name.toLowerCase() === query.toLowerCase())!.slug}`
              : null;

        if (!destinationSlug && query) {
          const matchedDest = destinations.find(
            (d) =>
              d.name.toLowerCase() === query.toLowerCase() ||
              d.slug.toLowerCase() === query.toLowerCase() ||
              getDestinationCardMeta(d).shortName.toLowerCase() === query.toLowerCase()
          );
          if (matchedDest) {
            destinationSlug = matchedDest.slug;
          }
        }

        const params = new URLSearchParams();
        if (destinationSlug) params.set('destination', destinationSlug);
        if (query) params.set('q', query);
        if (propertyTypes.length > 0) params.set('type', propertyTypes.join(','));

        // Direct route for Destination cards when no propertyType filter overrides it
        const targetUrl =
          overrideSuggestion?.kind === 'recent' && overrideSuggestion.recentEntry?.targetUrl
            ? overrideSuggestion.recentEntry.targetUrl
            : exactProperty && propertyTypes.length === 0
              ? exactProperty
              : destinationSlug && propertyTypes.length === 0
                ? `/stays/destinations/${destinationSlug}`
                : `/stays${params.toString() ? `?${params.toString()}` : ''}`;

        const destName = destinations.find((d) => d.slug === destinationSlug)?.name;
        const labelForHistory =
          query ||
          destName ||
          (propertyTypes.length > 0 ? propertyTypes.join(', ') : 'All Mountain Stays');
        const subtitleParts: string[] = [];
        if (destName && destName !== labelForHistory) subtitleParts.push(destName);
        if (propertyTypes.length > 0) subtitleParts.push(propertyTypes.join(', '));

        saveRecentSearch({
          service: 'stays',
          query: labelForHistory,
          subtitle: subtitleParts.join(' · ') || 'Stays',
          targetUrl,
          filters: {
            destination: destinationSlug,
            propertyTypes,
          },
        });

        setSuggestionsOpen(false);
        router.push(targetUrl);
        return;
      }

      if (activePillar === 'products') {
        let query = productsState.query.trim();
        let categories = [...productsState.categories];

        if (overrideSuggestion) {
          query = overrideSuggestion.shortTitle || overrideSuggestion.valueToPopulate;
          if (overrideSuggestion.categoryId) {
            categories = [overrideSuggestion.categoryId];
          } else if (overrideSuggestion.recentEntry?.filters?.categories) {
            categories = overrideSuggestion.recentEntry.filters.categories;
          }
        }

        if (categories.length === 0 && query) {
          const matchedCat = availableProductCategories.find(
            (c) =>
              c.name.toLowerCase() === query.toLowerCase() ||
              c.id.toLowerCase() === query.toLowerCase() ||
              getProductCategoryCardMeta(c).shortName.toLowerCase() === query.toLowerCase()
          );
          if (matchedCat) {
            categories = [matchedCat.id];
          }
        }

        const params = new URLSearchParams();
        if (query && overrideSuggestion?.kind !== 'product-category') {
          params.set('q', query);
        }
        if (categories.length > 0) {
          params.set('category', categories.join(','));
        }

        const targetUrl =
          overrideSuggestion?.kind === 'recent' && overrideSuggestion.recentEntry?.targetUrl
            ? overrideSuggestion.recentEntry.targetUrl
            : overrideSuggestion?.kind === 'product' && overrideSuggestion.directUrl
              ? overrideSuggestion.directUrl
              : overrideSuggestion?.kind === 'product-category' && overrideSuggestion.directUrl
                ? overrideSuggestion.directUrl
                : `/products${params.toString() ? `?${params.toString()}` : ''}`;

        const categoryLabels = categories
          .map((id) => {
            const found = availableProductCategories.find((c) => c.id === id);
            return found ? getProductCategoryCardMeta(found).shortName : id;
          })
          .join(', ');

        saveRecentSearch({
          service: 'products',
          query: query || categoryLabels || 'All Himalayan Products',
          subtitle: categoryLabels ? categoryLabels : 'Products',
          targetUrl,
          filters: { categories },
        });

        setSuggestionsOpen(false);
        router.push(targetUrl);
        return;
      }

      if (activePillar === 'productions') {
        let query = productionsState.query.trim();
        let genres = [...productionsState.genres];

        if (overrideSuggestion) {
          query = overrideSuggestion.shortTitle || overrideSuggestion.valueToPopulate;
          if (overrideSuggestion.genreName) {
            genres = [overrideSuggestion.genreName];
          } else if (overrideSuggestion.recentEntry?.filters?.genres) {
            genres = overrideSuggestion.recentEntry.filters.genres;
          }
        }

        const exactFilm =
          overrideSuggestion?.kind === 'film' && overrideSuggestion.directUrl
            ? overrideSuggestion.directUrl
            : productions.find((f) => f.title.toLowerCase() === query.toLowerCase())
              ? `/production/${productions.find((f) => f.title.toLowerCase() === query.toLowerCase())!.slug}`
              : null;

        const params = new URLSearchParams();
        if (query && overrideSuggestion?.kind !== 'genre') {
          params.set('q', query);
        }
        if (genres.length > 0) {
          params.set('genre', genres.join(','));
        }

        const targetUrl =
          overrideSuggestion?.kind === 'recent' && overrideSuggestion.recentEntry?.targetUrl
            ? overrideSuggestion.recentEntry.targetUrl
            : exactFilm && genres.length === 0
              ? exactFilm
              : overrideSuggestion?.kind === 'genre' && overrideSuggestion.directUrl
                ? overrideSuggestion.directUrl
                : `/production${params.toString() ? `?${params.toString()}` : ''}`;

        saveRecentSearch({
          service: 'productions',
          query: query || (genres.length > 0 ? genres.join(', ') : 'Uttarkunth Originals'),
          subtitle: exactFilm ? 'Original Film' : genres.length > 0 ? genres.join(', ') : 'Originals',
          targetUrl,
          filters: { genres },
        });

        setSuggestionsOpen(false);
        router.push(targetUrl);
      }
    },
    [
      activePillar,
      staysState,
      productsState,
      productionsState,
      properties,
      destinations,
      availableProductCategories,
      productions,
      saveRecentSearch,
      router,
    ]
  );

  // Clicking any suggestion card (Destination, Stay, Product Category, Product, Genre, Original, or Recent)
  // populates state AND directly opens the destination/category/production page
  const handleSelectSuggestion = useCallback(
    (item: SuggestionItem) => {
      const displayValue = item.shortTitle || item.valueToPopulate;

      if (activePillar === 'stays') {
        setStaysState((prev) => ({
          ...prev,
          query: displayValue,
          destination: item.destinationSlug ? item.destinationSlug : prev.destination,
        }));
      } else if (activePillar === 'products') {
        setProductsState((prev) => ({
          query: displayValue,
          categories: item.categoryId
            ? Array.from(new Set([...prev.categories, item.categoryId]))
            : prev.categories,
        }));
      } else if (activePillar === 'productions') {
        setProductionsState((prev) => ({
          query: displayValue,
          genres: item.genreName
            ? Array.from(new Set([...prev.genres, item.genreName]))
            : prev.genres,
        }));
      }

      executeSearch(item);
    },
    [activePillar, executeSearch]
  );

  // Keyboard navigation inside the search input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSuggestionsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!suggestionsOpen) {
        setSuggestionsOpen(true);
      }
      if (navigableItems.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % navigableItems.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!suggestionsOpen) {
        setSuggestionsOpen(true);
      }
      if (navigableItems.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + navigableItems.length) % navigableItems.length);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestionsOpen && highlightedIndex >= 0 && highlightedIndex < navigableItems.length) {
        const chosen = navigableItems[highlightedIndex];
        handleSelectSuggestion(chosen);
      } else {
        executeSearch();
      }
    }
  };

  const togglePropertyType = (typeLabel: string) => {
    setStaysState((prev) => {
      const exists = prev.propertyTypes.includes(typeLabel);
      return {
        ...prev,
        propertyTypes: exists
          ? prev.propertyTypes.filter((t) => t !== typeLabel)
          : [...prev.propertyTypes, typeLabel],
      };
    });
  };

  const toggleProductCategory = (catId: string) => {
    setProductsState((prev) => {
      const exists = prev.categories.includes(catId);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== catId)
          : [...prev.categories, catId],
      };
    });
  };

  const toggleProductionGenre = (genre: string) => {
    setProductionsState((prev) => {
      const exists = prev.genres.includes(genre);
      return {
        ...prev,
        genres: exists ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre],
      };
    });
  };

  const clearActiveFilters = () => {
    if (activePillar === 'stays') {
      setStaysState((prev) => ({ ...prev, propertyTypes: [] }));
    } else if (activePillar === 'products') {
      setProductsState((prev) => ({ ...prev, categories: [] }));
    } else if (activePillar === 'productions') {
      setProductionsState((prev) => ({ ...prev, genres: [] }));
    }
  };

  const placeholderText =
    activePillar === 'stays'
      ? 'Search destinations, stays or valleys...'
      : activePillar === 'products'
        ? 'Search Himalayan products, crafts, fashion, food...'
        : 'Search films, documentaries and genres...';

  const activeFilterCount =
    activePillar === 'stays'
      ? staysState.propertyTypes.length
      : activePillar === 'products'
        ? productsState.categories.length
        : activePillar === 'productions'
          ? productionsState.genres.length
          : 0;

  // Partition liveSuggestions by type
  const destinationSuggestions = useMemo(
    () => liveSuggestions.filter((item) => item.kind === 'destination'),
    [liveSuggestions]
  );
  const propertySuggestions = useMemo(
    () => liveSuggestions.filter((item) => item.kind === 'property'),
    [liveSuggestions]
  );
  const productCategorySuggestions = useMemo(
    () => liveSuggestions.filter((item) => item.kind === 'product-category'),
    [liveSuggestions]
  );
  const productItemSuggestions = useMemo(
    () => liveSuggestions.filter((item) => item.kind === 'product'),
    [liveSuggestions]
  );
  const genreSuggestions = useMemo(
    () => liveSuggestions.filter((item) => item.kind === 'genre'),
    [liveSuggestions]
  );
  const filmSuggestions = useMemo(
    () => liveSuggestions.filter((item) => item.kind === 'film'),
    [liveSuggestions]
  );

  // Progressive "+ More" disclosure slices
  const visibleDestinationSuggestions = useMemo(
    () =>
      showAllDestinations
        ? destinationSuggestions
        : destinationSuggestions.slice(0, INITIAL_VISIBLE_DESTINATIONS),
    [destinationSuggestions, showAllDestinations]
  );
  const hiddenDestinationCount = Math.max(
    0,
    destinationSuggestions.length - INITIAL_VISIBLE_DESTINATIONS
  );

  const visibleProductCategorySuggestions = useMemo(
    () =>
      showAllCategories
        ? productCategorySuggestions
        : productCategorySuggestions.slice(0, INITIAL_VISIBLE_CATEGORIES),
    [productCategorySuggestions, showAllCategories]
  );
  const hiddenCategoryCount = Math.max(
    0,
    productCategorySuggestions.length - INITIAL_VISIBLE_CATEGORIES
  );

  // Map suggestion id -> navigable index for keyboard highlight support
  const navigableIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    navigableItems.forEach((item, index) => {
      map.set(item.id, index);
    });
    return map;
  }, [navigableItems]);

  return (
    <div
      ref={containerRef}
      className="relative z-40 w-full max-w-2xl mx-auto px-3 sm:px-6"
      aria-label="Uttarkunth Adaptive Hero Search and Action Bar"
    >
      {/* ─────────────────────────────────────────────────────────────────────
          ONE SHARED ROUNDED CAPSULE CONTAINER
          • Clean single input + single right-hand search CTA button
          • Pressing empty input toggles search handler open/closed
      ───────────────────────────────────────────────────────────────────── */}
      <div
        data-testid="hero-search-capsule"
        data-attention-pop={spotlightPhase}
        className={`relative min-h-[48px] sm:min-h-[56px] rounded-full backdrop-blur-md border px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center origin-center transition-[transform,filter,background-color,border-color,box-shadow] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
          spotlightPhase === 'peak'
            ? 'duration-300 scale-[1.045] translate-y-0 bg-[#FFFFFF] brightness-[1.12] border-[#FFFDF9] shadow-[0_0_42px_rgba(255,253,249,0.68),0_0_22px_rgba(253,226,168,0.48),0_14px_34px_-6px_rgba(38,61,50,0.18)]'
            : spotlightPhase === 'settling'
              ? 'duration-[850ms] scale-100 translate-y-0 bg-[#FFFDF9] brightness-100 border-[#D9CCB8] shadow-[0_10px_28px_-6px_rgba(38,61,50,0.12),0_2px_8px_-2px_rgba(38,61,50,0.05)]'
              : suggestionsOpen
                ? 'duration-150 scale-100 translate-y-0 bg-[#FFFDF9] brightness-100 border-[#C55B23] ring-4 ring-[#C55B23]/10 shadow-[0_14px_34px_-6px_rgba(38,61,50,0.18)]'
                : 'duration-150 scale-100 translate-y-0 bg-[#FFFDF9] brightness-100 border-[#D9CCB8] shadow-[0_10px_28px_-6px_rgba(38,61,50,0.12),0_2px_8px_-2px_rgba(38,61,50,0.05)] hover:border-[#263D32]/40'
        }`}
      >
        {/* Soft Light Overlay (Lightens up and slowly fades out in sync with scaling back to exact position) */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,253,249,0.42)_0%,rgba(253,226,168,0.24)_55%,transparent_90%)] transition-opacity [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
            spotlightPhase === 'peak'
              ? 'duration-300 opacity-100'
              : spotlightPhase === 'settling'
                ? 'duration-[850ms] opacity-0'
                : 'duration-300 opacity-0'
          }`}
        />
        {activePillar !== 'community' ? (
          <div
            key={activePillar}
            className="w-full flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in fade-in duration-200"
          >
            {/* 1. Main Search Input (Click toggles open/close when empty) */}
            <div className="flex-1 min-w-0 flex items-center gap-2 pl-3.5 sm:pl-4 pr-1">
              <input
                ref={inputRef}
                suppressHydrationWarning
                type="text"
                role="combobox"
                value={currentQuery}
                onMouseDown={() => {
                  wasOpenOnPointerDownRef.current = suggestionsOpen;
                }}
                onFocus={() => {
                  if (!wasOpenOnPointerDownRef.current) {
                    setSuggestionsOpen(true);
                  }
                }}
                onClick={() => {
                  if (currentQuery.trim() === '') {
                    setSuggestionsOpen(!wasOpenOnPointerDownRef.current);
                  } else {
                    setSuggestionsOpen(true);
                  }
                }}
                onChange={(e) => {
                  setCurrentQuery(e.target.value);
                  if (!suggestionsOpen) setSuggestionsOpen(true);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder={placeholderText}
                aria-label={placeholderText}
                aria-autocomplete="list"
                aria-expanded={suggestionsOpen}
                aria-controls="adaptive-hero-search-suggestions"
                className="w-full bg-transparent text-[13.5px] sm:text-sm font-medium text-[#29251F] placeholder:text-[#29251F]/55 focus:outline-none truncate cursor-pointer focus:cursor-text"
              />

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSuggestionsOpen(true)}
                  className="px-2.5 py-0.5 rounded-full bg-[#263D32] text-[#FDE2A8] text-[10px] font-semibold shrink-0 hover:bg-[#1e3128] transition-colors cursor-pointer"
                >
                  {activeFilterCount} selected
                </button>
              )}

              {currentQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentQuery('');
                    setSuggestionsOpen(true);
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search query"
                  className="p-1 rounded-full text-[#29251F]/45 hover:text-[#263D32] hover:bg-[#F5F0E6] transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Voice-to-Text Microphone Button */}
            <button
              type="button"
              data-testid="voice-search-button"
              onClick={handleToggleVoiceSearch}
              aria-label={
                isListening
                  ? 'Stop voice search'
                  : 'Search stays or destinations by voice'
              }
              aria-pressed={isListening}
              title={
                isListening
                  ? 'Listening... Click to stop'
                  : 'Search stays or destinations by voice'
              }
              className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full inline-flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-[#C55B23] text-[#FFFDF9] ring-4 ring-[#C55B23]/25 shadow-sm'
                  : 'bg-[#F5F0E6]/85 hover:bg-[#EFE6D5] text-[#263D32] hover:text-[#C55B23] border border-[#E5DEC9]'
              }`}
            >
              {isListening ? (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-[#C55B23]/35 animate-ping"
                  />
                  <MicOff className="relative z-10 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </>
              ) : (
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>

            {/* 3. Single Right-Hand Circular Forest-Green Search Button */}
            <button
              type="button"
              onClick={() => executeSearch()}
              aria-label={`Search ${activePillar}`}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#263D32] hover:bg-[#C55B23] text-[#F5F0E6] inline-flex items-center justify-center shadow-xs transition-all duration-200 active:scale-95 shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />
            </button>
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════════
             STATE D: COMMUNITY — PARTICIPATION & ACTION PANEL
          ═════════════════════════════════════════════════════════════════ */
          <div
            key="community"
            className="w-full px-3.5 sm:px-5 flex items-center justify-center py-1 sm:py-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in fade-in duration-200"
          >
            <p className="text-xs sm:text-sm font-medium text-[#263D32] leading-snug text-center">
              Connect, contribute and collaborate to strengthen Himalayan communities.
            </p>
          </div>
        )}
      </div>

      {/* Subtle Voice Status Pill (Listening / Feedback) */}
      {(isListening || voiceFeedback) && (
        <div
          role="status"
          aria-live="polite"
          className="mt-1.5 flex items-center justify-center"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFDF9]/95 border border-[#E5DEC9] shadow-xs text-[11px] font-medium text-[#263D32]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isListening ? 'bg-[#C55B23] animate-pulse' : 'bg-[#263D32]/60'
              }`}
            />
            <span>
              {isListening
                ? 'Listening… speak a destination or stay name'
                : voiceFeedback}
            </span>
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          DESIGNER-GRADE SMART SUGGESTIONS & DISCOVERY DROPDOWN PANEL
          • Natural scroll chaining (overscroll-auto) so page scrolls seamlessly when reaching top/bottom
          • Compact initial cards with "+ More" / "Show less" expansion
          • Direct navigation when clicking any destination, category, genre, stay, or film
      ───────────────────────────────────────────────────────────────────── */}
      {suggestionsOpen && activeSearchService && (
        <div
          id="adaptive-hero-search-suggestions"
          role="listbox"
          aria-label="Smart search suggestions and category filters"
          className="absolute left-2 right-2 sm:left-4 sm:right-4 top-full mt-2.5 z-50 rounded-[22px] bg-[#FFFDF9]/98 backdrop-blur-xl border border-[#D8CBB8] ring-1 ring-[#263D32]/[0.05] shadow-[0_28px_60px_-12px_rgba(26,43,35,0.26),0_6px_20px_-4px_rgba(197,91,35,0.08)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {/* Subtle Warm-Gold & Terracotta Designer Accent Hairline */}
          <div
            aria-hidden="true"
            className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C55B23]/45 to-transparent"
          />

          <div className="max-h-[390px] overflow-y-auto overscroll-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden divide-y divide-[#E6DEC8]/65">
            {/* 1. CONCISE ICON FILTER ROW ("Property Type" / "Category" / "Genre") */}
            <div className="px-3.5 py-3 sm:px-4 sm:py-3.5 bg-gradient-to-b from-[#F8F3EA] to-[#FAF7F2] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#263D32]/85">
                  {activeSearchService === 'stays'
                    ? 'Property Type'
                    : activeSearchService === 'products'
                      ? 'Category'
                      : 'Genre'}
                </span>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearActiveFilters}
                    className="text-[11px] font-semibold text-[#C55B23] hover:text-[#263D32] transition-colors cursor-pointer"
                  >
                    Clear ({activeFilterCount})
                  </button>
                )}
              </div>

              {/* Stays: Property Type Icon Pills */}
              {activeSearchService === 'stays' && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {availablePropertyTypes.map((typeLabel) => {
                    const selected = staysState.propertyTypes.includes(typeLabel);
                    const IconComp = getPropertyTypeIcon(typeLabel);
                    return (
                      <button
                        key={typeLabel}
                        type="button"
                        onClick={() => togglePropertyType(typeLabel)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 border transition-all duration-150 cursor-pointer ${
                          selected
                            ? 'bg-[#263D32] text-[#FFFDF9] border-[#263D32] shadow-xs'
                            : 'bg-[#FFFDF9] text-[#29251F] border-[#E2D6C3] hover:border-[#C55B23]/45 hover:bg-[#F5EFE4]'
                        }`}
                      >
                        <IconComp
                          className={`w-3.5 h-3.5 shrink-0 ${
                            selected ? 'text-[#FDE2A8]' : 'text-[#C55B23]'
                          }`}
                        />
                        <span>{typeLabel}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Products: Short Category Icon Pills (Products, Crafts, Fashion, Food, etc.) */}
              {activeSearchService === 'products' && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {availableProductCategories.map((cat) => {
                    const selected = productsState.categories.includes(cat.id);
                    const cardMeta = getProductCategoryCardMeta(cat);
                    const IconComp = getProductCategoryIcon(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleProductCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 border transition-all duration-150 cursor-pointer ${
                          selected
                            ? 'bg-[#263D32] text-[#FFFDF9] border-[#263D32] shadow-xs'
                            : 'bg-[#FFFDF9] text-[#29251F] border-[#E2D6C3] hover:border-[#C55B23]/45 hover:bg-[#F5EFE4]'
                        }`}
                      >
                        <IconComp
                          className={`w-3.5 h-3.5 shrink-0 ${
                            selected ? 'text-[#FDE2A8]' : 'text-[#C55B23]'
                          }`}
                        />
                        <span>{cardMeta.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Productions: Genre Icon Pills */}
              {activeSearchService === 'productions' && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {availableGenres.map((genre) => {
                    const selected = productionsState.genres.includes(genre);
                    const cardMeta = getGenreCardMeta(genre);
                    const IconComp = getGenreIcon(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleProductionGenre(genre)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 border transition-all duration-150 cursor-pointer ${
                          selected
                            ? 'bg-[#263D32] text-[#FFFDF9] border-[#263D32] shadow-xs'
                            : 'bg-[#FFFDF9] text-[#29251F] border-[#E2D6C3] hover:border-[#C55B23]/45 hover:bg-[#F5EFE4]'
                        }`}
                      >
                        <IconComp
                          className={`w-3.5 h-3.5 shrink-0 ${
                            selected ? 'text-[#FDE2A8]' : 'text-[#C55B23]'
                          }`}
                        />
                        <span>{cardMeta.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. REAL-TIME SMART SUGGESTIONS STATUS BANNER (Shown when typing) */}
            {isTyping && (
              <div
                data-testid="smart-suggestions-status"
                className="px-3.5 py-2 sm:px-4 bg-[#F5EFE4]/85 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#C55B23] shrink-0" />
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#263D32] truncate">
                    Smart Suggestions ·{' '}
                    {activeSearchService === 'stays'
                      ? 'Destinations & Stays'
                      : activeSearchService === 'products'
                        ? 'Product Categories'
                        : 'Production Genres & Originals'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isFetchingSmart && (
                    <Loader2
                      aria-label="Fetching real-time suggestions"
                      className="w-3 h-3 text-[#C55B23] animate-spin"
                    />
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-[#263D32]/10 text-[#263D32] text-[10px] font-semibold">
                    {liveSuggestions.length}{' '}
                    {liveSuggestions.length === 1 ? 'match' : 'matches'} for &ldquo;
                    {currentQuery.trim()}&rdquo;
                  </span>
                </div>
              </div>
            )}

            {/* 3. COMPACT RECENT SEARCHES ROW (Shown when user has matching recent searches) */}
            {matchingRecents.length > 0 && (
              <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[#FFFDF9] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#29251F]/55 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#C55B23]" />
                    <span>Recent</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => clearRecentSearches(activeSearchService)}
                    className="text-[11px] font-semibold text-[#C55B23] hover:text-[#263D32] inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {matchingRecents.map((r, idx) => {
                    const suggestionItem = navigableItems[idx];
                    const isKbHighlighted = highlightedIndex === idx;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          if (suggestionItem) {
                            handleSelectSuggestion(suggestionItem);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#F3ECE0] border text-left inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                          isKbHighlighted
                            ? 'border-[#C55B23] ring-2 ring-[#C55B23]/30'
                            : 'border-[#E6DEC8]'
                        }`}
                      >
                        <Clock className="w-3 h-3 text-[#263D32]/65 shrink-0" />
                        <span className="text-xs font-medium text-[#29251F] max-w-[160px] truncate">
                          <HighlightMatch text={r.query} query={currentQuery} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. AESTHETIC DESIGNER SMART SUGGESTION CARDS */}
            <div className="p-3.5 sm:p-4 space-y-3.5 bg-[#FFFDF9]">
              {/* ═════════════════════════════════════════════════════════════
                  STAYS SMART SUGGESTIONS:
                  • Destination Cards (6 shown initially with "+ More" toggle, click opens directly)
                  • Featured Mountain Stays
              ═════════════════════════════════════════════════════════════ */}
              {activeSearchService === 'stays' && (
                <>
                  {destinationSuggestions.length > 0 && (
                    <div className="space-y-2.5" data-testid="stays-destination-suggestions">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#29251F]/65 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-[#C55B23]" />
                          <span>
                            {isTyping ? 'Matching Destinations' : 'Destinations'}
                          </span>
                        </span>

                        {hiddenDestinationCount > 0 ? (
                          <button
                            type="button"
                            data-testid="toggle-more-destinations"
                            onClick={() => setShowAllDestinations((prev) => !prev)}
                            className="px-2.5 py-0.5 rounded-full bg-[#FAF5EB] hover:bg-[#263D32] text-[#263D32] hover:text-[#FFFDF9] border border-[#E2D5C1] hover:border-[#263D32] text-[10.5px] font-semibold inline-flex items-center gap-1 transition-all duration-150 cursor-pointer"
                          >
                            <span>
                              {showAllDestinations
                                ? 'Show less'
                                : `+${hiddenDestinationCount} More`}
                            </span>
                            {showAllDestinations ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-[#29251F]/50">
                            {destinationSuggestions.length}{' '}
                            {destinationSuggestions.length === 1
                              ? 'valley or town'
                              : 'valleys & towns'}
                          </span>
                        )}
                      </div>

                      <div
                        className={
                          isTyping
                            ? 'grid grid-cols-1 sm:grid-cols-2 gap-2'
                            : 'grid grid-cols-2 sm:grid-cols-3 gap-2'
                        }
                      >
                        {visibleDestinationSuggestions.map((dest) => {
                          const isSelectedDest =
                            staysState.destination === dest.destinationSlug &&
                            Boolean(dest.destinationSlug);
                          const isKbHighlighted =
                            highlightedIndex === navigableIndexMap.get(dest.id);

                          return (
                            <button
                              key={dest.id}
                              type="button"
                              role="option"
                              aria-selected={isSelectedDest || isKbHighlighted}
                              onClick={() => handleSelectSuggestion(dest)}
                              className={`group p-2.5 rounded-xl text-left flex items-center justify-between gap-2 border transition-all duration-200 cursor-pointer ${
                                isSelectedDest
                                  ? 'bg-[#263D32] text-[#FFFDF9] border-[#263D32] shadow-xs'
                                  : isKbHighlighted
                                    ? 'bg-[#F3ECE0] border-[#C55B23] ring-2 ring-[#C55B23]/30'
                                    : 'bg-gradient-to-br from-[#FFFDF9] to-[#F9F4EB]/90 hover:from-[#F6EFE2] hover:to-[#EFE5D4] border-[#E5DAC7]/90 hover:border-[#C55B23]/45 shadow-[0_2px_6px_rgba(38,61,50,0.04)] hover:shadow-[0_6px_14px_-4px_rgba(38,61,50,0.12)] hover:-translate-y-[1px]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200 ${
                                    isSelectedDest
                                      ? 'bg-[#FFFDF9]/15 border-[#FFFDF9]/20 text-[#FDE2A8]'
                                      : 'bg-[#263D32]/[0.07] border-[#263D32]/10 text-[#263D32] group-hover:bg-[#263D32] group-hover:text-[#FDE2A8] group-hover:border-[#263D32]'
                                  }`}
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span
                                    className={`block text-xs font-semibold leading-tight truncate ${
                                      isSelectedDest ? 'text-[#FFFDF9]' : 'text-[#263D32]'
                                    }`}
                                  >
                                    <HighlightMatch
                                      text={
                                        isTyping &&
                                        dest.title &&
                                        dest.shortTitle &&
                                        dest.title.toLowerCase() !== dest.shortTitle.toLowerCase()
                                          ? dest.title
                                          : dest.shortTitle || dest.title
                                      }
                                      query={currentQuery}
                                    />
                                  </span>
                                  <span
                                    className={`block text-[10px] leading-tight truncate mt-0.5 ${
                                      isSelectedDest ? 'text-[#FDE2A8]/90' : 'text-[#29251F]/65'
                                    }`}
                                  >
                                    <HighlightMatch text={dest.subtitle} query={currentQuery} />
                                  </span>
                                  {isTyping && dest.matchedSnippet && (
                                    <span
                                      className={`block text-[9.5px] leading-tight truncate mt-0.5 italic ${
                                        isSelectedDest ? 'text-[#FFFDF9]/80' : 'text-[#C55B23]'
                                      }`}
                                    >
                                      <HighlightMatch
                                        text={dest.matchedSnippet}
                                        query={currentQuery}
                                      />
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ArrowUpRight
                                className={`w-3.5 h-3.5 shrink-0 transition-all duration-200 ${
                                  isSelectedDest
                                    ? 'text-[#FDE2A8]'
                                    : 'text-[#C55B23]/45 group-hover:text-[#C55B23] group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {propertySuggestions.length > 0 && (
                    <div className="space-y-2 pt-1" data-testid="stays-property-suggestions">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#29251F]/65">
                        {isTyping ? 'Matching Mountain Stays' : 'Featured Stays'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {propertySuggestions.map((prop) => {
                          const isKbHighlighted =
                            highlightedIndex === navigableIndexMap.get(prop.id);
                          return (
                            <button
                              key={prop.id}
                              type="button"
                              role="option"
                              aria-selected={isKbHighlighted}
                              onClick={() => handleSelectSuggestion(prop)}
                              className={`group p-2.5 rounded-xl bg-gradient-to-br from-[#FFFDF9] to-[#F9F4EB]/90 hover:from-[#F6EFE2] hover:to-[#EFE5D4] border text-left flex items-center justify-between gap-2.5 shadow-[0_2px_6px_rgba(38,61,50,0.04)] hover:shadow-[0_6px_14px_-4px_rgba(38,61,50,0.12)] hover:-translate-y-[1px] transition-all duration-200 cursor-pointer ${
                                isKbHighlighted
                                  ? 'border-[#C55B23] ring-2 ring-[#C55B23]/30 bg-[#F3ECE0]'
                                  : 'border-[#E5DAC7]/90 hover:border-[#C55B23]/45'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-[#C55B23]/12 border border-[#C55B23]/20 text-[#C55B23] group-hover:bg-[#263D32] group-hover:text-[#FDE2A8] group-hover:border-[#263D32] flex items-center justify-center shrink-0 transition-all duration-200">
                                  <Home className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-xs font-semibold text-[#263D32] truncate">
                                    <HighlightMatch text={prop.title} query={currentQuery} />
                                  </span>
                                  <span className="block text-[10px] text-[#29251F]/65 truncate">
                                    <HighlightMatch text={prop.subtitle} query={currentQuery} />
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-2 py-0.5 rounded-md bg-[#263D32]/[0.08] text-[#263D32] text-[10px] font-semibold">
                                  <HighlightMatch
                                    text={prop.meta || 'Homestay'}
                                    query={currentQuery}
                                  />
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#C55B23]/50 group-hover:text-[#C55B23] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ═════════════════════════════════════════════════════════════
                  PRODUCTS SMART SUGGESTIONS:
                  • Category Cards (4 shown initially with "+ More" toggle, click opens directly)
                  • Matching Published Products
              ═════════════════════════════════════════════════════════════ */}
              {activeSearchService === 'products' && (
                <>
                  {productCategorySuggestions.length > 0 && (
                    <div className="space-y-2.5" data-testid="products-category-suggestions">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#29251F]/65">
                          {isTyping ? 'Matching Product Categories' : 'Categories'}
                        </span>

                        {hiddenCategoryCount > 0 ? (
                          <button
                            type="button"
                            data-testid="toggle-more-categories"
                            onClick={() => setShowAllCategories((prev) => !prev)}
                            className="px-2.5 py-0.5 rounded-full bg-[#FAF5EB] hover:bg-[#263D32] text-[#263D32] hover:text-[#FFFDF9] border border-[#E2D5C1] hover:border-[#263D32] text-[10.5px] font-semibold inline-flex items-center gap-1 transition-all duration-150 cursor-pointer"
                          >
                            <span>
                              {showAllCategories
                                ? 'Show less'
                                : `+${hiddenCategoryCount} More`}
                            </span>
                            {showAllCategories ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-[#29251F]/50">
                            {productCategorySuggestions.length}{' '}
                            {productCategorySuggestions.length === 1 ? 'category' : 'categories'}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {visibleProductCategorySuggestions.map((catItem) => {
                          const IconComp = getProductCategoryIcon(
                            catItem.categoryId || catItem.title
                          );
                          const isSelected = Boolean(
                            catItem.categoryId &&
                              productsState.categories.includes(catItem.categoryId)
                          );
                          const isKbHighlighted =
                            highlightedIndex === navigableIndexMap.get(catItem.id);

                          return (
                            <button
                              key={catItem.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected || isKbHighlighted}
                              onClick={() => handleSelectSuggestion(catItem)}
                              className={`group p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 border transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#263D32] text-[#FFFDF9] border-[#263D32] shadow-xs'
                                  : isKbHighlighted
                                    ? 'bg-[#F3ECE0] border-[#C55B23] ring-2 ring-[#C55B23]/30'
                                    : 'bg-gradient-to-br from-[#FFFDF9] to-[#F9F4EB]/90 hover:from-[#F6EFE2] hover:to-[#EFE5D4] border-[#E5DAC7]/90 hover:border-[#C55B23]/45 shadow-[0_2px_6px_rgba(38,61,50,0.04)] hover:shadow-[0_6px_14px_-4px_rgba(38,61,50,0.12)] hover:-translate-y-[1px]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-[#FFFDF9]/15 border-[#FFFDF9]/20 text-[#FDE2A8]'
                                      : 'bg-[#C55B23]/12 border-[#C55B23]/20 text-[#C55B23] group-hover:bg-[#263D32] group-hover:text-[#FDE2A8] group-hover:border-[#263D32]'
                                  }`}
                                >
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span
                                    className={`block text-xs font-semibold leading-tight truncate ${
                                      isSelected ? 'text-[#FFFDF9]' : 'text-[#263D32]'
                                    }`}
                                  >
                                    <HighlightMatch
                                      text={
                                        isTyping
                                          ? `${catItem.shortTitle || catItem.title} · ${catItem.title}`
                                          : catItem.shortTitle || catItem.title
                                      }
                                      query={currentQuery}
                                    />
                                  </span>
                                  <span
                                    className={`block text-[10px] leading-tight truncate mt-0.5 ${
                                      isSelected ? 'text-[#FDE2A8]/90' : 'text-[#29251F]/65'
                                    }`}
                                  >
                                    <HighlightMatch text={catItem.subtitle} query={currentQuery} />
                                  </span>
                                  {isTyping && catItem.matchedSnippet && (
                                    <span
                                      className={`block text-[9.5px] leading-tight truncate mt-0.5 italic ${
                                        isSelected ? 'text-[#FFFDF9]/80' : 'text-[#C55B23]'
                                      }`}
                                    >
                                      <HighlightMatch
                                        text={catItem.matchedSnippet}
                                        query={currentQuery}
                                      />
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ArrowUpRight
                                className={`w-3.5 h-3.5 shrink-0 transition-all duration-200 ${
                                  isSelected
                                    ? 'text-[#FDE2A8]'
                                    : 'text-[#C55B23]/45 group-hover:text-[#C55B23] group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {productItemSuggestions.length > 0 && (
                    <div className="space-y-2 pt-1" data-testid="products-item-suggestions">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#29251F]/65">
                        {isTyping ? 'Matching Products' : 'Featured Products'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {productItemSuggestions.map((prod) => {
                          const isKbHighlighted =
                            highlightedIndex === navigableIndexMap.get(prod.id);
                          return (
                            <button
                              key={prod.id}
                              type="button"
                              role="option"
                              aria-selected={isKbHighlighted}
                              onClick={() => handleSelectSuggestion(prod)}
                              className={`group p-2.5 rounded-xl bg-gradient-to-br from-[#FFFDF9] to-[#F9F4EB]/90 hover:from-[#F6EFE2] hover:to-[#EFE5D4] border text-left flex items-center justify-between gap-2.5 shadow-[0_2px_6px_rgba(38,61,50,0.04)] hover:shadow-[0_6px_14px_-4px_rgba(38,61,50,0.12)] hover:-translate-y-[1px] transition-all duration-200 cursor-pointer ${
                                isKbHighlighted
                                  ? 'border-[#C55B23] ring-2 ring-[#C55B23]/30 bg-[#F3ECE0]'
                                  : 'border-[#E5DAC7]/90 hover:border-[#C55B23]/45'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold text-[#263D32] truncate">
                                  <HighlightMatch text={prod.title} query={currentQuery} />
                                </span>
                                <span className="block text-[10px] text-[#29251F]/65 truncate">
                                  <HighlightMatch text={prod.subtitle} query={currentQuery} />
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-2 py-0.5 rounded-md bg-[#263D32]/[0.08] text-[#263D32] text-[10px] font-semibold">
                                  Product
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#C55B23]/50 group-hover:text-[#C55B23] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ═════════════════════════════════════════════════════════════
                  PRODUCTIONS SMART SUGGESTIONS:
                  • Matching Genre Smart Suggestions (shown in real time when user types)
                  • Uttarkunth Originals Film Cards (Aaj Ka Devta, Ruk Gayi Gupt Bali, etc.)
              ═════════════════════════════════════════════════════════════ */}
              {activeSearchService === 'productions' && (
                <>
                  {genreSuggestions.length > 0 && (
                    <div className="space-y-2" data-testid="productions-genre-suggestions">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#29251F]/65 flex items-center gap-1.5">
                          <Clapperboard className="w-3 h-3 text-[#C55B23]" />
                          <span>Matching Genres</span>
                        </span>
                        <span className="text-[10px] font-medium text-[#29251F]/50">
                          {genreSuggestions.length}{' '}
                          {genreSuggestions.length === 1 ? 'genre' : 'genres'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {genreSuggestions.map((gItem) => {
                          const IconComp = getGenreIcon(gItem.genreName || gItem.title);
                          const isSelectedGenre = Boolean(
                            gItem.genreName &&
                              productionsState.genres.includes(gItem.genreName)
                          );
                          const isKbHighlighted =
                            highlightedIndex === navigableIndexMap.get(gItem.id);

                          return (
                            <button
                              key={gItem.id}
                              type="button"
                              role="option"
                              aria-selected={isSelectedGenre || isKbHighlighted}
                              onClick={() => handleSelectSuggestion(gItem)}
                              className={`group p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 border transition-all duration-200 cursor-pointer ${
                                isSelectedGenre
                                  ? 'bg-[#263D32] text-[#FFFDF9] border-[#263D32] shadow-xs'
                                  : isKbHighlighted
                                    ? 'bg-[#F3ECE0] border-[#C55B23] ring-2 ring-[#C55B23]/30'
                                    : 'bg-gradient-to-br from-[#FFFDF9] to-[#F9F4EB]/90 hover:from-[#F6EFE2] hover:to-[#EFE5D4] border-[#E5DAC7]/90 hover:border-[#C55B23]/45 shadow-[0_2px_6px_rgba(38,61,50,0.04)] hover:shadow-[0_6px_14px_-4px_rgba(38,61,50,0.12)] hover:-translate-y-[1px]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200 ${
                                    isSelectedGenre
                                      ? 'bg-[#FFFDF9]/15 border-[#FFFDF9]/20 text-[#FDE2A8]'
                                      : 'bg-[#C55B23]/12 border-[#C55B23]/20 text-[#C55B23] group-hover:bg-[#263D32] group-hover:text-[#FDE2A8] group-hover:border-[#263D32]'
                                  }`}
                                >
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span
                                    className={`block text-xs font-semibold truncate ${
                                      isSelectedGenre ? 'text-[#FFFDF9]' : 'text-[#263D32]'
                                    }`}
                                  >
                                    <HighlightMatch text={gItem.title} query={currentQuery} />
                                  </span>
                                  <span
                                    className={`block text-[10px] truncate ${
                                      isSelectedGenre ? 'text-[#FDE2A8]/90' : 'text-[#29251F]/65'
                                    }`}
                                  >
                                    <HighlightMatch text={gItem.subtitle} query={currentQuery} />
                                  </span>
                                  {gItem.matchedSnippet && (
                                    <span
                                      className={`block text-[9.5px] truncate mt-0.5 italic ${
                                        isSelectedGenre ? 'text-[#FFFDF9]/80' : 'text-[#C55B23]'
                                      }`}
                                    >
                                      <HighlightMatch
                                        text={gItem.matchedSnippet}
                                        query={currentQuery}
                                      />
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                    isSelectedGenre
                                      ? 'bg-[#FFFDF9]/15 text-[#FDE2A8]'
                                      : 'bg-[#C55B23]/12 text-[#C55B23]'
                                  }`}
                                >
                                  Genre
                                </span>
                                <ArrowUpRight
                                  className={`w-3.5 h-3.5 transition-all ${
                                    isSelectedGenre
                                      ? 'text-[#FDE2A8]'
                                      : 'text-[#C55B23]/50 group-hover:text-[#C55B23] group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                                  }`}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filmSuggestions.length > 0 && (
                    <div className="space-y-2" data-testid="productions-film-suggestions">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#29251F]/65">
                        Uttarkunth Originals
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filmSuggestions.map((film) => {
                          const isKbHighlighted =
                            highlightedIndex === navigableIndexMap.get(film.id);
                          return (
                            <button
                              key={film.id}
                              type="button"
                              role="option"
                              aria-selected={isKbHighlighted}
                              onClick={() => handleSelectSuggestion(film)}
                              className={`group p-2.5 rounded-xl bg-gradient-to-br from-[#FFFDF9] to-[#F9F4EB]/90 hover:from-[#F6EFE2] hover:to-[#EFE5D4] border text-left flex items-center justify-between gap-2.5 shadow-[0_2px_6px_rgba(38,61,50,0.04)] hover:shadow-[0_6px_14px_-4px_rgba(38,61,50,0.12)] hover:-translate-y-[1px] transition-all duration-200 cursor-pointer ${
                                isKbHighlighted
                                  ? 'border-[#C55B23] ring-2 ring-[#C55B23]/30 bg-[#F3ECE0]'
                                  : 'border-[#E5DAC7]/90 hover:border-[#C55B23]/45'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-[#263D32]/[0.08] border border-[#263D32]/10 text-[#263D32] group-hover:bg-[#263D32] group-hover:text-[#FDE2A8] group-hover:border-[#263D32] flex items-center justify-center shrink-0 transition-all duration-200">
                                  <Film className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-xs font-semibold text-[#263D32] truncate">
                                    <HighlightMatch text={film.title} query={currentQuery} />
                                  </span>
                                  <span className="block text-[10px] text-[#29251F]/65 truncate">
                                    <HighlightMatch text={film.subtitle} query={currentQuery} />
                                  </span>
                                  {isTyping && film.matchedSnippet && (
                                    <span className="block text-[9.5px] text-[#C55B23] truncate mt-0.5 italic">
                                      <HighlightMatch
                                        text={film.matchedSnippet}
                                        query={currentQuery}
                                      />
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-2 py-0.5 rounded-md bg-[#263D32]/[0.08] text-[#263D32] text-[10px] font-semibold">
                                  Original
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#C55B23]/50 group-hover:text-[#C55B23] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Empty state when no suggestions match */}
              {liveSuggestions.length === 0 && (
                <div className="py-4 text-center space-y-1">
                  <p className="text-xs font-semibold text-[#263D32]">
                    No matches found{currentQuery ? ` for “${currentQuery}”` : ''}
                  </p>
                  <p className="text-[11px] text-[#29251F]/60">
                    Try another keyword or clear active filters above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export { UnifiedHeroSearchBar as AdaptiveHeroSearch };
