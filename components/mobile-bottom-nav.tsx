'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CURATED_DESTINATIONS } from '@/lib/destinations';
import {
  AUTHENTIC_PRODUCTIONS,
  EXISTING_PROPERTIES,
  PRODUCT_CATEGORIES,
} from '@/lib/constants';
import { EXISTING_REVIEWS } from '@/lib/reviews';
import {
  PILLAR_SELECTOR_OPTIONS,
  resolveActivePillarFromPathname,
  getContextualQuickAction,
  resolveMobileSearchContext,
  type DynamicNavIconName,
  type QuickActionIconName,
} from '@/lib/mobile-navigation';
import {
  unifiedClientSearchHandler,
  globalEcosystemSearchHandler,
  segmentHighlightedText,
  PRODUCTION_GENRES_CATALOG,
  type PillarCategory,
} from '@/lib/smart-suggestions';
import {
  loadSavedItems,
  toggleSavedEcosystemItem,
  FAVOURITES_UPDATED_EVENT,
  SAVED_CATEGORY_LABELS,
  type SavedEcosystemItem,
  type SavedItemCategory,
} from '@/lib/favourites';
import {
  getStaysWhereSuggestions,
  validateAndFormatGuests,
  deriveAvailableAmenityChips,
  formatSearchCapsuleSummary,
  getCatalogMaxGuestCapacity,
  type StaysWhereSuggestion,
} from '@/lib/stays-search';
import { StaysSearchCalendar } from '@/components/stays/stays-search-calendar';
import {
  Home,
  Compass,
  Bed,
  ShoppingBag,
  Clapperboard,
  Users,
  Search,
  Heart,
  Briefcase,
  ShoppingCart,
  PlayCircle,
  Handshake,
  X,
  Trash2,
  MapPin,
  Plus,
  Minus,
  Sparkles,
  Wifi,
  Mountain,
  Utensils,
  Coffee,
  Shirt,
  PawPrint,
  Check,
  AlertTriangle,
} from 'lucide-react';

type ActiveSheet = 'none' | 'pillars' | 'search' | 'favourites';

function getAmenityChipIcon(chipId: string) {
  switch (chipId) {
    case 'guest-favourite':
      return <Sparkles className="w-3.5 h-3.5 shrink-0" />;
    case 'wifi':
      return <Wifi className="w-3.5 h-3.5 shrink-0" />;
    case 'mountain-view':
      return <Mountain className="w-3.5 h-3.5 shrink-0" />;
    case 'meal-plans':
      return <Utensils className="w-3.5 h-3.5 shrink-0" />;
    case 'tea-coffee':
      return <Coffee className="w-3.5 h-3.5 shrink-0" />;
    case 'laundry':
      return <Shirt className="w-3.5 h-3.5 shrink-0" />;
    case 'pet-friendly':
      return <PawPrint className="w-3.5 h-3.5 shrink-0" />;
    default:
      return <Home className="w-3.5 h-3.5 shrink-0" />;
  }
}

function HighlightedText({
  text,
  query,
  highlightClassName = 'text-[#C55B23] font-semibold underline decoration-[#C55B23]/40 underline-offset-2',
}: {
  text: string;
  query: string;
  highlightClassName?: string;
}) {
  const segments = useMemo(() => segmentHighlightedText(text, query), [text, query]);
  return (
    <>
      {segments.map((seg, idx) =>
        seg.highlighted ? (
          <mark key={idx} className={`bg-transparent ${highlightClassName}`}>
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={idx}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
}

function renderDynamicNavIcon(iconName: DynamicNavIconName, className: string) {
  switch (iconName) {
    case 'compass':
      return <Compass strokeWidth={1.75} className={className} />;
    case 'bed':
      return <Bed strokeWidth={1.75} className={className} />;
    case 'shopping-bag':
      return <ShoppingBag strokeWidth={1.75} className={className} />;
    case 'clapperboard':
      return <Clapperboard strokeWidth={1.75} className={className} />;
    case 'users':
      return <Users strokeWidth={1.75} className={className} />;
  }
}

function renderQuickActionIcon(iconName: QuickActionIconName, className: string) {
  switch (iconName) {
    case 'briefcase':
      return <Briefcase strokeWidth={1.75} className={className} />;
    case 'shopping-cart':
      return <ShoppingCart strokeWidth={1.75} className={className} />;
    case 'play-circle':
      return <PlayCircle strokeWidth={1.75} className={className} />;
    case 'handshake':
      return <Handshake strokeWidth={1.75} className={className} />;
  }
}

function getPillarBadgeClasses(pillar: PillarCategory): string {
  switch (pillar) {
    case 'stays':
      return 'bg-[#E6F4EA] text-[#1E6F3D] border-[#C6E7CE]';
    case 'products':
      return 'bg-[#E8F1FD] text-[#1D5FBF] border-[#C7DDFB]';
    case 'productions':
      return 'bg-[#EFECE6] text-[#3D372E] border-[#DED8CC]';
    case 'community':
      return 'bg-[#EFECE6] text-[#3D372E] border-[#DED8CC]';
  }
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [activeSheet, setActiveSheet] = useState<ActiveSheet>('none');

  // Shared / Global / Products / Productions Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductCategories, setSelectedProductCategories] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Stays Guided 3-Stage Search state (WHERE -> WHEN -> WHO + Direct Amenity Chips)
  const [staysStage, setStaysStage] = useState<'where' | 'when' | 'who'>('where');
  const [staysDestinationSlug, setStaysDestinationSlug] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [infants, setInfants] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Favourites state
  const [savedItems, setSavedItems] = useState<SavedEcosystemItem[]>([]);
  const [selectedFavTab, setSelectedFavTab] = useState<'all' | SavedItemCategory>('all');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const maxCatalogCapacity = useMemo(
    () => getCatalogMaxGuestCapacity(EXISTING_PROPERTIES),
    []
  );

  const dynamicPillarItem = useMemo(
    () => resolveActivePillarFromPathname(pathname),
    [pathname]
  );
  const searchContext = useMemo(
    () => resolveMobileSearchContext(pathname),
    [pathname]
  );
  // 5th item added after Favourites when a pillar is active (Stays -> My Trips, Products -> My Cart, Productions -> Continue Watching, Community -> Join Us)
  const bottomQuickAction = useMemo(
    () => getContextualQuickAction(dynamicPillarItem.id),
    [dynamicPillarItem.id]
  );

  // Sync Stays search criteria from current URL params when on /stays
  const syncStaysStateFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlDest = params.get('destination') || '';
    const urlQuery = params.get('q') || params.get('location') || '';
    const urlCheckIn = params.get('checkIn') || '';
    const urlCheckOut = params.get('checkOut') || '';
    const urlAdults = params.get('adults');
    const urlGuests = params.get('guests');
    const urlChildren = params.get('children');
    const urlChildAges = params.get('childAges');
    const urlInfants = params.get('infants');
    const urlAmenities = params.get('amenities');

    if (urlDest) {
      setStaysDestinationSlug(urlDest);
      const matchedD = CURATED_DESTINATIONS.find((d) => d.slug === urlDest);
      const matchedP = EXISTING_PROPERTIES.find((p) => p.slug === urlDest);
      setSearchQuery(matchedD?.name || matchedP?.name || urlQuery);
    } else if (urlQuery) {
      setStaysDestinationSlug('');
      setSearchQuery(urlQuery);
    }

    if (urlCheckIn) setCheckIn(urlCheckIn);
    if (urlCheckOut) setCheckOut(urlCheckOut);

    const parsedChildren = urlChildren ? Math.max(0, Number(urlChildren) || 0) : 0;
    const parsedAdults = urlAdults
      ? Math.max(1, Number(urlAdults) || 2)
      : urlGuests
      ? Math.max(1, (Number(urlGuests) || 2) - parsedChildren)
      : null;

    if (parsedAdults !== null) setAdults(parsedAdults);
    if (urlChildren !== null) setChildrenCount(parsedChildren);
    if (urlChildAges) {
      setChildAges(
        urlChildAges
          .split(',')
          .map((n) => Number(n.trim()))
          .filter((n) => Number.isFinite(n) && n >= 2 && n <= 17)
      );
    }
    if (urlInfants !== null) {
      setInfants(Math.max(0, Number(urlInfants) || 0));
    }
    if (urlAmenities !== null) {
      setSelectedAmenities(
        urlAmenities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean)
      );
    }
  }, []);

  // Load & sync saved items
  useEffect(() => {
    const syncFavourites = () => {
      setSavedItems(loadSavedItems());
    };
    syncFavourites();
    window.addEventListener(FAVOURITES_UPDATED_EVENT, syncFavourites);
    window.addEventListener('storage', syncFavourites);
    return () => {
      window.removeEventListener(FAVOURITES_UPDATED_EVENT, syncFavourites);
      window.removeEventListener('storage', syncFavourites);
    };
  }, []);

  // Close sheets on route change
  useEffect(() => {
    setActiveSheet('none');
  }, [pathname]);

  // Focus search input when opening search sheet (when on WHERE stage or non-stays context)
  useEffect(() => {
    if (activeSheet === 'search' && (searchContext !== 'stays' || staysStage === 'where')) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [activeSheet, searchContext, staysStage]);

  // Dismiss upward panels on outside click, Escape key, or mobile back action (popstate)
  useEffect(() => {
    if (activeSheet === 'none') return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        navContainerRef.current &&
        !navContainerRef.current.contains(event.target as Node)
      ) {
        setActiveSheet('none');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveSheet('none');
      }
    };

    const handlePopState = () => {
      setActiveSheet('none');
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeSheet]);

  // Stays Guided Search Derived Values
  const selectedStaysDestinationName = useMemo(() => {
    if (staysDestinationSlug) {
      const dest = CURATED_DESTINATIONS.find((d) => d.slug === staysDestinationSlug);
      if (dest) return dest.name;
      const prop = EXISTING_PROPERTIES.find((p) => p.slug === staysDestinationSlug);
      if (prop) return prop.name;
    }
    return searchQuery.trim();
  }, [staysDestinationSlug, searchQuery]);

  const staysCapsuleSummary = useMemo(
    () =>
      formatSearchCapsuleSummary({
        destinationLabel: selectedStaysDestinationName,
        query: searchQuery,
        checkIn,
        checkOut,
        adults,
        children: childrenCount,
        infants,
      }),
    [selectedStaysDestinationName, searchQuery, checkIn, checkOut, adults, childrenCount, infants]
  );

  const staysGuestSummary = useMemo(
    () =>
      validateAndFormatGuests(
        {
          adults,
          children: childrenCount,
          childAges,
          infants,
        },
        maxCatalogCapacity
      ),
    [adults, childrenCount, childAges, infants, maxCatalogCapacity]
  );

  const staysWhereSuggestions = useMemo(() => {
    const queryForLookup =
      staysDestinationSlug && selectedStaysDestinationName === searchQuery.trim()
        ? ''
        : searchQuery;
    return getStaysWhereSuggestions(queryForLookup, CURATED_DESTINATIONS, EXISTING_PROPERTIES);
  }, [searchQuery, staysDestinationSlug, selectedStaysDestinationName]);

  const availableAmenityChips = useMemo(
    () => deriveAvailableAmenityChips(EXISTING_PROPERTIES, EXISTING_REVIEWS),
    []
  );

  // Compute live suggestions based on current searchContext
  const productCategories = useMemo(
    () => PRODUCT_CATEGORIES.filter((c) => c.id !== 'other').map((c) => ({ ...c })),
    []
  );
  const productionsList = useMemo(
    () => AUTHENTIC_PRODUCTIONS.map((p) => ({ ...p })),
    []
  );

  const globalSuggestions = useMemo(() => {
    if (searchContext !== 'global') return [];
    return globalEcosystemSearchHandler({
      query: searchQuery,
      destinations: CURATED_DESTINATIONS,
      properties: EXISTING_PROPERTIES,
      products: [],
      productCategories,
      productions: productionsList,
    });
  }, [searchContext, searchQuery, productCategories, productionsList]);

  const pillarSuggestions = useMemo(() => {
    if (searchContext === 'global' || searchContext === 'stays') return [];
    const { liveSuggestions } = unifiedClientSearchHandler({
      activeCategory: searchContext,
      query: searchQuery,
      filters: {
        propertyTypes: [],
        categories: selectedProductCategories,
        genres: selectedGenres,
      },
      recentSearches: [],
      destinations: CURATED_DESTINATIONS,
      properties: EXISTING_PROPERTIES,
      products: [],
      productCategories,
      productions: productionsList,
    });
    return liveSuggestions.slice(0, 8);
  }, [
    searchContext,
    searchQuery,
    selectedProductCategories,
    selectedGenres,
    productCategories,
    productionsList,
  ]);

  const filteredSavedItems = useMemo(() => {
    if (selectedFavTab === 'all') return savedItems;
    return savedItems.filter((item) => item.category === selectedFavTab);
  }, [savedItems, selectedFavTab]);

  // Handlers
  const handleToggleSheet = (target: Exclude<ActiveSheet, 'none'>) => {
    setActiveSheet((prev) => {
      const next = prev === target ? 'none' : target;
      if (next === 'search' && searchContext === 'stays') {
        syncStaysStateFromUrl();
        setStaysStage('where');
      }
      return next;
    });
  };

  const handleSelectPillar = (href: string, pillarId: string) => {
    if (dynamicPillarItem.id === pillarId) {
      setActiveSheet('none');
      return;
    }
    setActiveSheet('none');
    router.push(href);
  };

  const updateChildrenCount = (nextCount: number) => {
    const clamped = Math.max(0, Math.min(8, nextCount));
    setChildrenCount(clamped);
    setChildAges((prev) => {
      const next = [...prev];
      while (next.length < clamped) {
        next.push(6);
      }
      return next.slice(0, clamped);
    });
  };

  const updateChildAgeAt = (index: number, age: number) => {
    setChildAges((prev) => {
      const next = [...prev];
      next[index] = age;
      return next;
    });
  };

  const handleSelectStaysWhereSuggestion = (item: StaysWhereSuggestion) => {
    setStaysDestinationSlug(item.slug);
    setSearchQuery(item.name);
    setStaysStage('when');
  };

  const handleClearStaysSearch = () => {
    setStaysDestinationSlug('');
    setSearchQuery('');
    setCheckIn('');
    setCheckOut('');
    setAdults(2);
    setChildrenCount(0);
    setChildAges([]);
    setInfants(0);
    setSelectedAmenities([]);
    router.push('/stays', { scroll: false });
  };

  const commitStaysSearch = (amenityOverrides?: string[]) => {
    const params = new URLSearchParams();
    const q = searchQuery.trim();

    if (staysDestinationSlug) {
      params.set('destination', staysDestinationSlug);
    } else if (q) {
      params.set('q', q);
    }

    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);

    const totalSeated = adults + childrenCount;
    params.set('guests', String(totalSeated));
    params.set('adults', String(adults));
    if (childrenCount > 0) {
      params.set('children', String(childrenCount));
      if (childAges.length > 0) {
        params.set('childAges', childAges.slice(0, childrenCount).join(','));
      }
    }
    if (infants > 0) {
      params.set('infants', String(infants));
    }

    const activeAmenities =
      amenityOverrides !== undefined ? amenityOverrides : selectedAmenities;
    if (activeAmenities.length > 0) {
      params.set('amenities', activeAmenities.join(','));
    }

    setActiveSheet('none');
    const qs = params.toString();
    router.push(qs ? `/stays?${qs}` : '/stays', { scroll: false });
  };

  const handleToggleStaysAmenityChip = (chipId: string) => {
    const exists = selectedAmenities.includes(chipId);
    const next = exists
      ? selectedAmenities.filter((id) => id !== chipId)
      : [...selectedAmenities, chipId];
    setSelectedAmenities(next);
  };

  const handleExecuteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();

    if (searchContext === 'global') {
      if (globalSuggestions.length > 0 && q) {
        setActiveSheet('none');
        router.push(globalSuggestions[0].directUrl);
        return;
      }
      setActiveSheet('none');
      router.push(q ? `/stays?q=${encodeURIComponent(q)}` : '/stays');
      return;
    }

    if (searchContext === 'stays') {
      commitStaysSearch();
      return;
    }

    if (searchContext === 'products') {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (selectedProductCategories.length > 0) {
        params.set('category', selectedProductCategories[0]);
      }
      setActiveSheet('none');
      const qs = params.toString();
      router.push(qs ? `/products?${qs}` : '/products');
      return;
    }

    if (searchContext === 'productions') {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (selectedGenres.length > 0) {
        params.set('genre', selectedGenres[0]);
      }
      setActiveSheet('none');
      const qs = params.toString();
      router.push(qs ? `/production?${qs}` : '/production');
    }
  };

  const cleanPathname = (pathname || '/').split('?')[0].split('#')[0] || '/';
  const isHomeRoute = cleanPathname === '/';
  const isQuickActionRoute =
    Boolean(bottomQuickAction) && cleanPathname === bottomQuickAction?.href;
  const isHomeActive = isHomeRoute && activeSheet === 'none';
  const isPillarNavActive =
    activeSheet === 'pillars' ||
    (dynamicPillarItem.isPillarRoute && !isQuickActionRoute && activeSheet === 'none');
  const isSearchActive = activeSheet === 'search';
  const isFavouritesActive = activeSheet === 'favourites';
  const isQuickActionActive = isQuickActionRoute && activeSheet === 'none';

  const activeNavIndex = isSearchActive
    ? 2
    : isFavouritesActive
    ? 3
    : isPillarNavActive
    ? 1
    : isQuickActionActive && bottomQuickAction
    ? 4
    : isHomeActive
    ? 0
    : -1;

  const slidingPillTranslateClass =
    activeNavIndex === 0
      ? 'translate-x-0 opacity-100 scale-100'
      : activeNavIndex === 1
      ? 'translate-x-full opacity-100 scale-100'
      : activeNavIndex === 2
      ? 'translate-x-[200%] opacity-100 scale-100'
      : activeNavIndex === 3
      ? 'translate-x-[300%] opacity-100 scale-100'
      : activeNavIndex === 4
      ? 'translate-x-[400%] opacity-100 scale-100'
      : 'translate-x-0 opacity-0 scale-90';

  return (
    <div
      ref={navContainerRef}
      data-testid="mobile-bottom-nav-root"
      className="fixed bottom-0 inset-x-0 z-header md:hidden pointer-events-none"
    >
      {/* Subtle backdrop scrim when an upward panel is open */}
      {activeSheet !== 'none' && (
        <div
          aria-hidden="true"
          onClick={() => setActiveSheet('none')}
          className="fixed inset-0 bg-[#18261F]/35 backdrop-blur-[1px] transition-opacity duration-200 pointer-events-auto -z-10"
        />
      )}

      <div className="relative w-full pointer-events-auto">
        {/* =====================================================================
            1. UPWARD-EXPANDING PILLAR SELECTOR
           ===================================================================== */}
        {activeSheet === 'pillars' && (
          <div
            role="dialog"
            aria-label="Explore Uttarkunth Pillars"
            data-testid="mobile-pillar-selector"
            className="absolute bottom-full left-3 right-3 mb-2.5 rounded-2xl bg-[#FFFDF9]/95 backdrop-blur-xl border border-[#D9CCB8] shadow-[0_-12px_36px_rgba(18,28,22,0.18)] px-3 py-3.5 animate-uk-sheet-unfold"
          >
            {/* 4 Primary Pillars Row */}
            <div className="grid grid-cols-4 gap-1.5">
              {PILLAR_SELECTOR_OPTIONS.map((option) => {
                const isCurrentPillar = dynamicPillarItem.id === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    data-testid={`pillar-option-${option.id}`}
                    onClick={() => handleSelectPillar(option.href, option.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-xl transition-colors duration-150 ${
                      isCurrentPillar
                        ? 'bg-[#C55B23]/10 text-[#C55B23] font-semibold'
                        : 'text-[#29251F] hover:bg-[#263D32]/6 hover:text-[#263D32]'
                    }`}
                  >
                    {renderDynamicNavIcon(
                      option.iconName,
                      `w-5 h-5 ${isCurrentPillar ? 'text-[#C55B23]' : 'text-[#29251F]'}`
                    )}
                    <span className="font-sans text-[11px] font-medium tracking-tight leading-none">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            2. UPWARD-EXPANDING CONTEXT-AWARE SEARCH PANEL
               • When searchContext === 'stays': Guided 3-Stage System (WHERE -> WHEN -> WHO) + Direct Amenity Chips
               • When searchContext !== 'stays': Direct contextual search bar + live suggestions
           ===================================================================== */}
        {activeSheet === 'search' && (
          <div
            role="dialog"
            aria-label="Contextual Search"
            data-testid="mobile-contextual-search-sheet"
            data-search-context={searchContext}
            className={`absolute bottom-full left-2.5 right-2.5 mb-2.5 rounded-[26px] bg-[#F5F0E6]/96 backdrop-blur-xl border border-[#D9CCB8] shadow-[0_-16px_44px_rgba(18,28,22,0.24)] flex flex-col overflow-hidden animate-uk-sheet-unfold ${
              searchContext === 'stays' ? 'max-h-[82vh]' : 'p-3.5 max-h-[72vh] bg-[#FFFDF9]/96'
            }`}
          >
            {searchContext === 'stays' ? (
              <div
                data-testid="stays-specific-search-controls"
                className="flex flex-col max-h-[82vh] overflow-hidden"
              >
                {/* Sheet Header */}
                <div className="px-4 py-3 bg-[#FFFDF9] border-b border-[#D9CCB8] flex items-center justify-between">
                  <span className="font-serif text-lg font-semibold text-[#29251F]">
                    Find Your Mountain Stay
                  </span>
                  <button
                    type="button"
                    data-testid="bottom-nav-stays-close"
                    onClick={() => setActiveSheet('none')}
                    aria-label="Close search panel"
                    className="w-10 h-10 rounded-full bg-[#F5F0E6] border border-[#D9CCB8] flex items-center justify-center text-[#29251F] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Guided 3-Stage Stepper Tabs (1. WHERE -> 2. WHEN -> 3. WHO) */}
                <div className="px-3.5 pt-2.5 pb-2 bg-[#FFFDF9] border-b border-[#D9CCB8]/70 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    data-testid="bottom-nav-stays-stage-where"
                    onClick={() => setStaysStage('where')}
                    className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-left border transition-colors cursor-pointer ${
                      staysStage === 'where'
                        ? 'bg-[#263D32] border-[#263D32] text-[#FFFDF9]'
                        : 'bg-[#F5F0E6] border-[#D9CCB8] text-[#29251F]'
                    }`}
                  >
                    <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider opacity-80">
                      1. Where
                    </span>
                    <span
                      data-testid="bottom-nav-stays-where-summary"
                      className="block font-sans text-xs font-semibold truncate"
                    >
                      {staysCapsuleSummary.whereText}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="bottom-nav-stays-stage-when"
                    onClick={() => setStaysStage('when')}
                    className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-left border transition-colors cursor-pointer ${
                      staysStage === 'when'
                        ? 'bg-[#263D32] border-[#263D32] text-[#FFFDF9]'
                        : 'bg-[#F5F0E6] border-[#D9CCB8] text-[#29251F]'
                    }`}
                  >
                    <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider opacity-80">
                      2. When
                    </span>
                    <span
                      data-testid="bottom-nav-stays-when-summary"
                      className="block font-sans text-xs font-semibold truncate"
                    >
                      {staysCapsuleSummary.whenText}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="bottom-nav-stays-stage-who"
                    onClick={() => setStaysStage('who')}
                    className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-left border transition-colors cursor-pointer ${
                      staysStage === 'who'
                        ? 'bg-[#263D32] border-[#263D32] text-[#FFFDF9]'
                        : 'bg-[#F5F0E6] border-[#D9CCB8] text-[#29251F]'
                    }`}
                  >
                    <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider opacity-80">
                      3. Who
                    </span>
                    <span
                      data-testid="bottom-nav-stays-who-summary"
                      className="block font-sans text-xs font-semibold truncate"
                    >
                      {staysCapsuleSummary.whoText}
                    </span>
                  </button>
                </div>

                {/* Active Stage Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 space-y-3">
                  {/* STAGE 1: WHERE */}
                  {staysStage === 'where' && (
                    <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-[#D9CCB8] space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-lg font-semibold text-[#29251F]">
                          Where to?
                        </h3>
                        <button
                          type="button"
                          onClick={() => setStaysStage('when')}
                          className="font-sans text-xs font-semibold text-[#263D32] hover:underline cursor-pointer"
                        >
                          Next: Dates &rarr;
                        </button>
                      </div>

                      <div>
                        <label
                          htmlFor="bottom-nav-stays-where-input"
                          className="font-sans block text-xs font-semibold text-[#29251F] mb-1.5"
                        >
                          Search destinations or mountain homestays
                        </label>
                        <div className="relative flex items-center">
                          <MapPin className="w-4 h-4 text-[#C55B23] absolute left-3.5 pointer-events-none" />
                          <input
                            id="bottom-nav-stays-where-input"
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setStaysDestinationSlug('');
                            }}
                            data-testid="mobile-search-input"
                            placeholder="Search Kullu Jari, Manali, Spiti, Yash Home Stay..."
                            className="font-sans w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-xl bg-[#F5F0E6]/75 border border-[#D9CCB8] text-sm font-medium text-[#29251F] placeholder:text-[#5C5549]/70 focus:outline-none focus:border-[#263D32] focus:ring-2 focus:ring-[#263D32]/20"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              data-testid="mobile-search-clear"
                              onClick={() => {
                                setSearchQuery('');
                                setStaysDestinationSlug('');
                              }}
                              aria-label="Clear search query"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5C5549] hover:text-[#29251F] hover:bg-[#EAE2D3] absolute right-1.5 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Verified Mountain Stays */}
                      {staysWhereSuggestions.matchingProperties.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-sans block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5C5549]">
                            Verified Mountain Stays
                          </span>
                          <div className="grid grid-cols-1 gap-1.5">
                            {staysWhereSuggestions.matchingProperties.map((prop) => {
                              const isSelected = staysDestinationSlug === prop.slug;
                              return (
                                <button
                                  key={prop.id}
                                  type="button"
                                  data-testid={`bottom-nav-where-property-${prop.slug}`}
                                  onClick={() => handleSelectStaysWhereSuggestion(prop)}
                                  className={`w-full min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#263D32] text-[#FFFDF9]'
                                      : 'bg-[#F5F0E6]/65 hover:bg-[#EAE2D3]/85 text-[#29251F] border border-[#D9CCB8]/70'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {prop.imageUrl ? (
                                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#D9CCB8] shrink-0 bg-[#EAE2D3]">
                                        <img
                                          src={prop.imageUrl}
                                          alt={prop.name}
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                          isSelected
                                            ? 'bg-[#FFFDF9]/15 text-[#FFFDF9]'
                                            : 'bg-[#FFFDF9] text-[#263D32] border border-[#D9CCB8]'
                                        }`}
                                      >
                                        <Home className="w-4 h-4" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-sans text-sm font-semibold truncate">
                                        {prop.name}
                                      </p>
                                      <p
                                        className={`font-sans text-xs truncate ${
                                          isSelected ? 'text-[#FFFDF9]/80' : 'text-[#5C5549]'
                                        }`}
                                      >
                                        {prop.subtitle}
                                      </p>
                                    </div>
                                  </div>
                                  <span
                                    className={`font-sans text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                                      isSelected
                                        ? 'bg-[#FFFDF9]/20 text-[#FFFDF9]'
                                        : 'bg-[#263D32]/10 text-[#263D32]'
                                    }`}
                                  >
                                    Published Stay
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Popular / Matching Himalayan Destinations */}
                      <div className="space-y-1.5">
                        <span className="font-sans block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5C5549]">
                          {searchQuery.trim() && !staysDestinationSlug
                            ? `Matching Himalayan Destinations (${staysWhereSuggestions.matchingDestinations.length})`
                            : 'Suggested Himalayan Destinations'}
                        </span>
                        {staysWhereSuggestions.matchingDestinations.length > 0 ? (
                          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                            {(searchQuery.trim() && !staysDestinationSlug
                              ? staysWhereSuggestions.matchingDestinations
                              : staysWhereSuggestions.popularDestinations
                            ).map((dest) => {
                              const isSelected = staysDestinationSlug === dest.slug;
                              return (
                                <button
                                  key={dest.id}
                                  type="button"
                                  data-testid={`bottom-nav-where-destination-${dest.slug}`}
                                  onClick={() => handleSelectStaysWhereSuggestion(dest)}
                                  className={`min-h-[52px] px-3 py-2 rounded-2xl flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#263D32] text-[#FFFDF9]'
                                      : 'bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] border border-[#D9CCB8]/80'
                                  }`}
                                >
                                  {dest.imageUrl ? (
                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#D9CCB8] shrink-0 bg-[#EAE2D3]">
                                      <img
                                        src={dest.imageUrl}
                                        alt={dest.name}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        isSelected
                                          ? 'bg-[#FFFDF9]/15 text-[#FFFDF9]'
                                          : 'bg-[#F5F0E6] text-[#C55B23]'
                                      }`}
                                    >
                                      <MapPin className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-sans text-sm font-semibold truncate">
                                        {dest.name}
                                      </p>
                                      <span
                                        className={`font-sans text-[10px] font-medium shrink-0 ${
                                          isSelected ? 'text-[#FFFDF9]/80' : 'text-[#5C5549]'
                                        }`}
                                      >
                                        {dest.region}
                                      </span>
                                    </div>
                                    <p
                                      className={`font-sans text-xs truncate ${
                                        isSelected ? 'text-[#FFFDF9]/80' : 'text-[#5C5549]'
                                      }`}
                                    >
                                      {dest.subtitle}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="font-sans text-xs text-[#5C5549] py-2.5 px-3 rounded-xl bg-[#F5F0E6]/70 border border-[#D9CCB8]">
                            No configured mountain destinations match &ldquo;{searchQuery}&rdquo;.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STAGE 2: WHEN */}
                  {staysStage === 'when' && (
                    <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-[#D9CCB8] space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-lg font-semibold text-[#29251F]">
                          When is your stay?
                        </h3>
                        <button
                          type="button"
                          onClick={() => setStaysStage('who')}
                          className="font-sans text-xs font-semibold text-[#263D32] hover:underline cursor-pointer"
                        >
                          Next: Guests &rarr;
                        </button>
                      </div>
                      <StaysSearchCalendar
                        checkIn={checkIn}
                        checkOut={checkOut}
                        todayStr={todayStr}
                        singleMonth={true}
                        onChangeDates={(nextIn, nextOut) => {
                          setCheckIn(nextIn);
                          setCheckOut(nextOut);
                        }}
                      />
                    </div>
                  )}

                  {/* STAGE 3: WHO */}
                  {staysStage === 'who' && (
                    <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-[#D9CCB8] space-y-3.5">
                      <h3 className="font-serif text-lg font-semibold text-[#29251F]">
                        Who is coming?
                      </h3>
                      <div className="divide-y divide-[#D9CCB8]/70">
                        {/* Adults: 18 years and above */}
                        <div className="py-2.5 first:pt-0 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-sans text-sm font-semibold text-[#29251F]">Adults</p>
                            <p className="font-sans text-xs text-[#5C5549]">18 years and above</p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              data-testid="bottom-nav-adults-decrease"
                              onClick={() => setAdults((a) => Math.max(1, a - 1))}
                              disabled={adults <= 1}
                              aria-label="Decrease adults"
                              className="w-11 h-11 rounded-full border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span
                              data-testid="bottom-nav-adults-count"
                              className="font-sans text-sm font-semibold text-[#29251F] w-6 text-center tabular-nums"
                            >
                              {adults}
                            </span>
                            <button
                              type="button"
                              data-testid="bottom-nav-adults-increase"
                              onClick={() => setAdults((a) => Math.min(12, a + 1))}
                              disabled={adults >= 12}
                              aria-label="Increase adults"
                              className="w-11 h-11 rounded-full border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Children: 2–17 years */}
                        <div className="py-2.5 space-y-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-sans text-sm font-semibold text-[#29251F]">
                                Children
                              </p>
                              <p className="font-sans text-xs text-[#5C5549]">2–17 years</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                data-testid="bottom-nav-children-decrease"
                                onClick={() => updateChildrenCount(childrenCount - 1)}
                                disabled={childrenCount <= 0}
                                aria-label="Decrease children"
                                className="w-11 h-11 rounded-full border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span
                                data-testid="bottom-nav-children-count"
                                className="font-sans text-sm font-semibold text-[#29251F] w-6 text-center tabular-nums"
                              >
                                {childrenCount}
                              </span>
                              <button
                                type="button"
                                data-testid="bottom-nav-children-increase"
                                onClick={() => updateChildrenCount(childrenCount + 1)}
                                disabled={childrenCount >= 8}
                                aria-label="Increase children"
                                className="w-11 h-11 rounded-full border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {childrenCount > 0 && (
                            <div
                              data-testid="bottom-nav-child-ages-container"
                              className="p-2.5 rounded-xl bg-[#F5F0E6]/80 border border-[#D9CCB8] space-y-2"
                            >
                              <p className="font-sans text-xs font-semibold text-[#29251F]">
                                Child age at check-in
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {Array.from({ length: childrenCount }).map((_, idx) => (
                                  <div key={`bn-child-age-${idx}`}>
                                    <label
                                      htmlFor={`bn-child-age-select-${idx}`}
                                      className="font-sans block text-[11px] font-medium text-[#5C5549] mb-1"
                                    >
                                      Child {idx + 1} age
                                    </label>
                                    <select
                                      id={`bn-child-age-select-${idx}`}
                                      data-testid={`bottom-nav-child-age-select-${idx}`}
                                      value={childAges[idx] ?? 6}
                                      onChange={(e) =>
                                        updateChildAgeAt(idx, Number(e.target.value))
                                      }
                                      className="font-sans w-full min-h-[44px] px-2.5 py-1.5 rounded-lg bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-semibold text-[#29251F] focus:outline-none focus:border-[#263D32]"
                                    >
                                      {Array.from({ length: 16 }, (_, i) => i + 2).map((age) => (
                                        <option key={age} value={age}>
                                          {age} years old
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Infants: Under 2 years */}
                        <div className="py-2.5 last:pb-0 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-sans text-sm font-semibold text-[#29251F]">
                              Infants
                            </p>
                            <p className="font-sans text-xs text-[#5C5549]">
                              Under 2 years · Do not occupy a separate bed
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              data-testid="bottom-nav-infants-decrease"
                              onClick={() => setInfants((i) => Math.max(0, i - 1))}
                              disabled={infants <= 0}
                              aria-label="Decrease infants"
                              className="w-11 h-11 rounded-full border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span
                              data-testid="bottom-nav-infants-count"
                              className="font-sans text-sm font-semibold text-[#29251F] w-6 text-center tabular-nums"
                            >
                              {infants}
                            </span>
                            <button
                              type="button"
                              data-testid="bottom-nav-infants-increase"
                              onClick={() => setInfants((i) => Math.min(5, i + 1))}
                              disabled={infants >= 5}
                              aria-label="Increase infants"
                              className="w-11 h-11 rounded-full border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {staysGuestSummary.capacityWarning ? (
                        <div
                          role="status"
                          data-testid="bottom-nav-capacity-warning"
                          className="flex items-start gap-2 p-2.5 rounded-xl bg-[#FDF5EC] border border-[#E5C6A0] text-[#8A4215] text-xs font-sans"
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C55B23]" />
                          <p className="font-semibold">{staysGuestSummary.capacityWarning}</p>
                        </div>
                      ) : (
                        <p className="font-sans text-xs text-[#5C5549] bg-[#F5F0E6]/70 px-3 py-2 rounded-xl border border-[#D9CCB8]/70">
                          Verified mountain homestays accommodate up to {maxCatalogCapacity} seated
                          guests per room. Infants under 2 stay free.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Direct Amenity Chips (No "Filters" heading) */}
                  {availableAmenityChips.length > 0 && (
                    <div
                      data-testid="bottom-nav-stays-amenity-chips"
                      aria-label="Filter stays by property amenities"
                      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
                    >
                      {availableAmenityChips.map((chip) => {
                        const isSelected = selectedAmenities.includes(chip.id);
                        return (
                          <button
                            key={chip.id}
                            type="button"
                            data-testid={`bottom-nav-amenity-chip-${chip.id}`}
                            aria-pressed={isSelected}
                            onClick={() => handleToggleStaysAmenityChip(chip.id)}
                            className={`font-sans min-h-[44px] px-3.5 py-1.5 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#263D32] border-[#263D32] text-[#FFFDF9]'
                                : 'bg-[#FFFDF9] border-[#D9CCB8] text-[#29251F] hover:bg-[#F5F0E6]'
                            }`}
                          >
                            {getAmenityChipIcon(chip.id)}
                            <span>{chip.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Final Footer: Clear All on left, dominant Forest Green Search Stays CTA on right */}
                <div className="px-4 py-3 bg-[#FFFDF9] border-t border-[#D9CCB8] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    data-testid="bottom-nav-stays-clear-all"
                    onClick={handleClearStaysSearch}
                    className="font-sans min-h-[44px] px-3 py-2 text-xs font-semibold text-[#29251F] underline underline-offset-4 hover:text-[#C55B23] cursor-pointer"
                  >
                    Clear All
                  </button>

                  <button
                    type="button"
                    data-testid="bottom-nav-stays-search-submit"
                    onClick={() => commitStaysSearch()}
                    className="font-sans min-h-[48px] px-6 py-2.5 rounded-full bg-[#263D32] hover:bg-[#C55B23] text-[#FFFDF9] font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-colors duration-200 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Stays</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Non-Stays Contextual Search (Global / Products / Productions) */}
                <form onSubmit={handleExecuteSearch} className="space-y-2.5">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-[#6E6559] absolute left-3.5 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="mobile-search-input"
                      placeholder={
                        searchContext === 'global'
                          ? 'Search Stays, Products, Films, Community...'
                          : searchContext === 'products'
                            ? 'Search crafts, handloom, organic herbs, honey...'
                            : 'Search documentaries, cultural monologues, films...'
                      }
                      className="w-full min-h-[44px] pl-9 pr-9 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#D9CCB8] focus:border-[#263D32] focus:bg-white text-sm text-[#29251F] placeholder:text-[#8A8072] focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        data-testid="mobile-search-clear"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search query"
                        className="absolute right-2.5 p-1 rounded-full text-[#6E6559] hover:text-[#29251F]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {searchContext === 'products' && (
                    <div
                      data-testid="products-specific-search-controls"
                      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5"
                    >
                      {productCategories.map((cat) => {
                        const active = selectedProductCategories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() =>
                              setSelectedProductCategories((prev) =>
                                prev.includes(cat.id)
                                  ? prev.filter((c) => c !== cat.id)
                                  : [cat.id]
                              )
                            }
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                              active
                                ? 'bg-[#C55B23] text-[#FFFDF9] border-[#C55B23]'
                                : 'bg-[#F5F0E6] text-[#29251F] border-[#D9CCB8]'
                            }`}
                          >
                            {cat.name.split('&')[0].trim()}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {searchContext === 'productions' && (
                    <div
                      data-testid="productions-specific-search-controls"
                      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5"
                    >
                      {PRODUCTION_GENRES_CATALOG.map((genre) => {
                        const active = selectedGenres.includes(genre.name);
                        return (
                          <button
                            key={genre.id}
                            type="button"
                            onClick={() =>
                              setSelectedGenres((prev) =>
                                prev.includes(genre.name)
                                  ? prev.filter((g) => g !== genre.name)
                                  : [genre.name]
                              )
                            }
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                              active
                                ? 'bg-[#263D32] text-[#FFFDF9] border-[#263D32]'
                                : 'bg-[#F5F0E6] text-[#29251F] border-[#D9CCB8]'
                            }`}
                          >
                            {genre.shortName}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </form>

                {/* Live Suggestions List */}
                <div
                  data-testid="mobile-search-suggestions-list"
                  className="mt-2.5 pt-2 border-t border-[#D9CCB8]/80 overflow-y-auto overscroll-contain space-y-1 max-h-56"
                >
                  {searchContext === 'global' ? (
                    globalSuggestions.length > 0 ? (
                      globalSuggestions.map((item) => (
                        <Link
                          key={item.id}
                          href={item.directUrl}
                          data-testid="global-search-suggestion-item"
                          data-pillar={item.pillar}
                          onClick={() => setActiveSheet('none')}
                          className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl hover:bg-[#F5F0E6] transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#29251F] truncate">
                              <HighlightedText text={item.title} query={searchQuery} />
                            </p>
                            <p className="text-[11px] text-[#6E6559] truncate mt-0.5">
                              <HighlightedText text={item.subtitle} query={searchQuery} />
                            </p>
                          </div>
                          <span
                            data-testid={`suggestion-pillar-badge-${item.pillar}`}
                            className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getPillarBadgeClasses(
                              item.pillar
                            )}`}
                          >
                            {item.pillarBadge}
                          </span>
                        </Link>
                      ))
                    ) : (
                      <p className="py-5 text-center text-xs text-[#6E6559]">
                        No matching ecosystem results found for &ldquo;{searchQuery}&rdquo;.
                      </p>
                    )
                  ) : pillarSuggestions.length > 0 ? (
                    pillarSuggestions.map((item) => (
                      <Link
                        key={item.id}
                        href={item.directUrl || '#'}
                        data-testid="pillar-search-suggestion-item"
                        onClick={() => setActiveSheet('none')}
                        className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl hover:bg-[#F5F0E6] transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#29251F] truncate">
                            <HighlightedText text={item.title} query={searchQuery} />
                          </p>
                          <p className="text-[11px] text-[#6E6559] truncate mt-0.5">
                            <HighlightedText text={item.subtitle} query={searchQuery} />
                          </p>
                        </div>
                        {item.meta && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F0E6] text-[#263D32] border border-[#D9CCB8]">
                            {item.meta}
                          </span>
                        )}
                      </Link>
                    ))
                  ) : (
                    <p className="py-5 text-center text-xs text-[#6E6559]">
                      No matching {searchContext} results found for &ldquo;{searchQuery}&rdquo;.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* =====================================================================
            3. UPWARD-EXPANDING FAVOURITES PANEL
           ===================================================================== */}
        {activeSheet === 'favourites' && (
          <div
            role="dialog"
            aria-label="Saved Favourites"
            data-testid="mobile-favourites-sheet"
            className="absolute bottom-full left-3 right-3 mb-2.5 rounded-2xl bg-[#FFFDF9]/96 backdrop-blur-xl border border-[#D9CCB8] shadow-[0_-12px_38px_rgba(18,28,22,0.18)] p-3.5 max-h-[72vh] flex flex-col animate-uk-sheet-unfold"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#D9CCB8]/80">
              <div>
                <h2 className="font-serif text-base font-medium text-[#1F332A]">
                  Saved Favourites
                </h2>
                <p className="font-sans font-normal text-[11px] text-[#6E6559]">
                  Your saved stays, products, productions &amp; destinations
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet('none')}
                aria-label="Close favourites panel"
                className="p-1.5 rounded-full text-[#6E6559] hover:text-[#29251F] hover:bg-[#F5F0E6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5">
              {(
                [
                  { id: 'all', label: 'All Saved' },
                  { id: 'stays', label: 'Saved Stays' },
                  { id: 'products', label: 'Saved Products' },
                  { id: 'productions', label: 'Saved Productions' },
                  { id: 'destinations', label: 'Saved Destinations' },
                ] as const
              ).map((tab) => {
                const active = selectedFavTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedFavTab(tab.id)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                      active
                        ? 'bg-[#263D32] text-[#FFFDF9] border-[#263D32]'
                        : 'bg-[#F5F0E6] text-[#29251F] border-[#D9CCB8]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Saved Items or Clean Himalayan Editorial Empty State */}
            <div className="overflow-y-auto overscroll-contain max-h-60 space-y-2 pt-1">
              {filteredSavedItems.length > 0 ? (
                filteredSavedItems.map((item) => (
                  <div
                    key={`${item.category}-${item.id}`}
                    data-testid="saved-favourite-item"
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#FAF6EE] border border-[#D9CCB8]"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setActiveSheet('none')}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#C55B23]">
                          {SAVED_CATEGORY_LABELS[item.category]}
                        </span>
                        {item.meta && (
                          <span className="text-[10px] text-[#6E6559]">· {item.meta}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#1F332A] truncate mt-0.5">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#6E6559] truncate">{item.subtitle}</p>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleSavedEcosystemItem(item)}
                      aria-label={`Remove ${item.title} from favourites`}
                      className="p-2 rounded-lg text-[#6E6559] hover:text-status-danger hover:bg-status-danger-bg/50 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div
                  data-testid="favourites-empty-state"
                  className="py-6 px-4 text-center rounded-xl bg-[#FAF6EE]/80 border border-[#D9CCB8]/90 space-y-2"
                >
                  <div className="w-9 h-9 rounded-full bg-[#C55B23]/10 text-[#C55B23] flex items-center justify-center mx-auto">
                    <Heart strokeWidth={1.75} className="w-4 h-4" />
                  </div>
                  <p className="font-serif text-sm font-medium text-[#1F332A]">
                    No saved items yet
                  </p>
                  <p className="font-sans font-normal text-xs text-[#6E6559] max-w-xs mx-auto leading-relaxed">
                    Tap the heart icon on any homestay, mountain product, original film, or destination to keep it here for quick access.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            4. FIXED ICON-ONLY BOTTOM NAVIGATION BAR (+ 5TH CONTEXTUAL ITEM AFTER FAVOURITES ON PILLARS)
           ===================================================================== */}
        <nav
          aria-label="Primary Mobile Navigation"
          data-testid="mobile-bottom-bar"
          className="mx-2.5 mb-[calc(0.45rem+env(safe-area-inset-bottom))] rounded-full bg-[#FFFDF9]/95 backdrop-blur-xl border border-[#D9CCB8] shadow-[0_14px_34px_rgba(18,28,22,0.18)] px-2.5 py-1.5"
        >
          <div
            className={`relative grid ${
              bottomQuickAction ? 'grid-cols-5' : 'grid-cols-4'
            } max-w-md mx-auto items-center`}
          >
            {/* Sliding Brand-Coloured (#C55B23) Active Pill Indicator */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 ${
                bottomQuickAction ? 'w-1/5' : 'w-1/4'
              } flex items-center justify-center px-1 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${slidingPillTranslateClass}`}
            >
              <span
                data-testid="mobile-bottom-nav-sliding-pill"
                data-active-index={activeNavIndex}
                className="w-full h-10 rounded-full bg-[#C55B23] shadow-[0_4px_14px_rgba(197,91,35,0.34)]"
              />
            </div>

            {/* Position 1: Home (Icon only) */}
            <Link
              href="/"
              data-testid="mobile-nav-home"
              aria-label="Home"
              title="Home"
              onClick={() => setActiveSheet('none')}
              aria-current={isHomeActive ? 'page' : undefined}
              className={`relative z-10 flex items-center justify-center min-h-[44px] rounded-full transition-colors duration-200 ${
                isHomeActive
                  ? 'text-[#FFFDF9]'
                  : 'text-[#29251F] hover:text-[#C55B23]'
              }`}
            >
              <Home
                strokeWidth={1.85}
                className={`w-5 h-5 transition-colors duration-200 ${
                  isHomeActive ? 'text-[#FFFDF9]' : 'text-[#29251F]'
                }`}
              />
            </Link>

            {/* Position 2: Dynamic Explore / Current Pillar (Icon only) */}
            <button
              type="button"
              suppressHydrationWarning
              data-testid="mobile-nav-dynamic-pillar"
              data-active-pillar={dynamicPillarItem.id}
              data-pillar-label={dynamicPillarItem.label}
              aria-label={dynamicPillarItem.label}
              title={dynamicPillarItem.label}
              onClick={() => handleToggleSheet('pillars')}
              aria-expanded={activeSheet === 'pillars'}
              aria-haspopup="dialog"
              className={`relative z-10 flex items-center justify-center min-h-[44px] rounded-full transition-colors duration-200 cursor-pointer ${
                isPillarNavActive
                  ? 'text-[#FFFDF9]'
                  : 'text-[#29251F] hover:text-[#C55B23]'
              }`}
            >
              {renderDynamicNavIcon(
                dynamicPillarItem.iconName,
                `w-5 h-5 transition-colors duration-200 ${
                  isPillarNavActive ? 'text-[#FFFDF9]' : 'text-[#29251F]'
                }`
              )}
            </button>

            {/* Position 3: Search (Icon only) */}
            <button
              type="button"
              suppressHydrationWarning
              data-testid="mobile-nav-search"
              aria-label="Search"
              title="Search"
              onClick={() => handleToggleSheet('search')}
              aria-expanded={isSearchActive}
              aria-haspopup="dialog"
              className={`relative z-10 flex items-center justify-center min-h-[44px] rounded-full transition-colors duration-200 cursor-pointer ${
                isSearchActive
                  ? 'text-[#FFFDF9]'
                  : 'text-[#29251F] hover:text-[#C55B23]'
              }`}
            >
              <Search
                strokeWidth={1.85}
                className={`w-5 h-5 transition-colors duration-200 ${
                  isSearchActive ? 'text-[#FFFDF9]' : 'text-[#29251F]'
                }`}
              />
            </button>

            {/* Position 4: Favourites (Icon only) */}
            <button
              type="button"
              suppressHydrationWarning
              data-testid="mobile-nav-favourites"
              aria-label="Favourites"
              title="Favourites"
              onClick={() => handleToggleSheet('favourites')}
              aria-expanded={isFavouritesActive}
              aria-haspopup="dialog"
              className={`relative z-10 flex items-center justify-center min-h-[44px] rounded-full transition-colors duration-200 cursor-pointer ${
                isFavouritesActive
                  ? 'text-[#FFFDF9]'
                  : 'text-[#29251F] hover:text-[#C55B23]'
              }`}
            >
              <span className="relative">
                <Heart
                  strokeWidth={1.85}
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isFavouritesActive ? 'text-[#FFFDF9]' : 'text-[#29251F]'
                  }`}
                />
                {savedItems.length > 0 && (
                  <span
                    data-testid="mobile-favourites-dot"
                    className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full ring-1 ${
                      isFavouritesActive
                        ? 'bg-[#FFFDF9] ring-[#C55B23]'
                        : 'bg-[#C55B23] ring-[#FFFDF9]'
                    }`}
                  />
                )}
              </span>
            </button>

            {/* Position 5 (Dynamic after Favourites when a Pillar is open):
                Stays -> My Trips | Products -> My Cart | Productions -> Continue Watching | Community -> Join Us */}
            {bottomQuickAction && (
              <Link
                href={bottomQuickAction.href}
                data-testid="mobile-nav-contextual-action"
                data-action-id={bottomQuickAction.id}
                aria-label={bottomQuickAction.label}
                title={bottomQuickAction.label}
                onClick={() => setActiveSheet('none')}
                className={`relative z-10 flex items-center justify-center min-h-[44px] rounded-full transition-colors duration-200 ${
                  isQuickActionActive
                    ? 'text-[#FFFDF9]'
                    : 'text-[#29251F] hover:text-[#C55B23]'
                }`}
              >
                {renderQuickActionIcon(
                  bottomQuickAction.iconName,
                  `w-5 h-5 transition-colors duration-200 ${
                    isQuickActionActive ? 'text-[#FFFDF9]' : 'text-[#29251F]'
                  }`
                )}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
