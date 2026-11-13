'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CURATED_DESTINATIONS } from '@/lib/destinations';
import {
  AUTHENTIC_PRODUCTIONS,
  EXISTING_PROPERTIES,
  PRODUCT_CATEGORIES,
} from '@/lib/constants';
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
  Calendar,
  Trash2,
} from 'lucide-react';

type ActiveSheet = 'none' | 'pillars' | 'search' | 'favourites';

const STAYS_PROPERTY_TYPES = ['Homestay', 'Boutique Stay', 'Cottage', 'Villa'] as const;

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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedProductCategories, setSelectedProductCategories] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  // Favourites state
  const [savedItems, setSavedItems] = useState<SavedEcosystemItem[]>([]);
  const [selectedFavTab, setSelectedFavTab] = useState<'all' | SavedItemCategory>('all');

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

  // Focus search input when opening search sheet
  useEffect(() => {
    if (activeSheet === 'search') {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [activeSheet]);

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
    if (searchContext === 'global') return [];
    const { liveSuggestions } = unifiedClientSearchHandler({
      activeCategory: searchContext,
      query: searchQuery,
      filters: {
        propertyTypes: selectedPropertyTypes,
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
    selectedPropertyTypes,
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
    setActiveSheet((prev) => (prev === target ? 'none' : target));
  };

  const handleSelectPillar = (href: string, pillarId: string) => {
    if (dynamicPillarItem.id === pillarId) {
      setActiveSheet('none');
      return;
    }
    setActiveSheet('none');
    router.push(href);
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
      router.push(q ? `/stays?location=${encodeURIComponent(q)}` : '/stays');
      return;
    }

    if (searchContext === 'stays') {
      const params = new URLSearchParams();
      if (q) params.set('location', q);
      if (checkIn) params.set('checkIn', checkIn);
      if (checkOut) params.set('checkOut', checkOut);
      if (guests) params.set('guests', guests);
      if (selectedPropertyTypes.length > 0) {
        params.set('type', selectedPropertyTypes[0].toLowerCase());
      }
      setActiveSheet('none');
      const qs = params.toString();
      router.push(qs ? `/stays?${qs}` : '/stays');
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
          className="fixed inset-0 bg-[#18261F]/20 backdrop-blur-[1px] transition-opacity duration-200 pointer-events-auto -z-10"
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
            className="absolute bottom-full left-3 right-3 mb-2.5 rounded-2xl bg-[#FFFDF9] border border-[#E5DEC9] shadow-[0_-8px_30px_rgba(18,28,22,0.14)] px-3 py-3.5 animate-slide-up"
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
                    <span className="text-[11px] font-medium tracking-tight leading-none">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            2. UPWARD-EXPANDING CONTEXT-AWARE SEARCH PANEL (Direct Search Bar, No Header Title)
           ===================================================================== */}
        {activeSheet === 'search' && (
          <div
            role="dialog"
            aria-label="Contextual Search"
            data-testid="mobile-contextual-search-sheet"
            data-search-context={searchContext}
            className="absolute bottom-full left-3 right-3 mb-2.5 rounded-2xl bg-[#FFFDF9] border border-[#E5DEC9] shadow-[0_-10px_34px_rgba(18,28,22,0.16)] p-3.5 max-h-[72vh] flex flex-col animate-slide-up"
          >
            {/* Direct Search Input Box (No context header title) */}
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
                      : searchContext === 'stays'
                        ? 'Search Manali, Jari, Kasol, or homestays...'
                        : searchContext === 'products'
                          ? 'Search crafts, handloom, organic herbs, honey...'
                          : 'Search documentaries, cultural monologues, films...'
                  }
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E2D9C5] focus:border-[#C55B23] focus:bg-white text-sm text-[#29251F] placeholder:text-[#8A8072] focus:outline-none transition-colors"
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

              {/* Pillar-Specific Compact Controls */}
              {searchContext === 'stays' && (
                <div
                  data-testid="stays-specific-search-controls"
                  className="space-y-2 pt-0.5"
                >
                  {/* Property Type Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {STAYS_PROPERTY_TYPES.map((typeLabel) => {
                      const active = selectedPropertyTypes.includes(typeLabel);
                      return (
                        <button
                          key={typeLabel}
                          type="button"
                          onClick={() =>
                            setSelectedPropertyTypes((prev) =>
                              prev.includes(typeLabel)
                                ? prev.filter((t) => t !== typeLabel)
                                : [typeLabel]
                            )
                          }
                          className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                            active
                              ? 'bg-[#263D32] text-[#FFFDF9] border-[#263D32]'
                              : 'bg-[#F5F0E6] text-[#29251F] border-[#E2D9C5]'
                          }`}
                        >
                          {typeLabel}
                        </button>
                      );
                    })}
                  </div>

                  {/* Compact Dates & Guests Row */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <label className="flex flex-col bg-[#FAF6EE] border border-[#E2D9C5] rounded-lg px-2 py-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-[#6E6559] flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-[#C55B23]" />
                        Check-in
                      </span>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="bg-transparent text-[11px] text-[#29251F] focus:outline-none mt-0.5"
                      />
                    </label>
                    <label className="flex flex-col bg-[#FAF6EE] border border-[#E2D9C5] rounded-lg px-2 py-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-[#6E6559] flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-[#C55B23]" />
                        Check-out
                      </span>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="bg-transparent text-[11px] text-[#29251F] focus:outline-none mt-0.5"
                      />
                    </label>
                    <label className="flex flex-col bg-[#FAF6EE] border border-[#E2D9C5] rounded-lg px-2 py-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-[#6E6559]">
                        Guests
                      </span>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="bg-transparent text-[11px] font-medium text-[#29251F] focus:outline-none mt-0.5"
                      >
                        <option value="1">1 Guest</option>
                        <option value="2">2 Guests</option>
                        <option value="3">3 Guests</option>
                        <option value="4">4+ Guests</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

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
                            : 'bg-[#F5F0E6] text-[#29251F] border-[#E2D9C5]'
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
                            : 'bg-[#F5F0E6] text-[#29251F] border-[#E2D9C5]'
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
              className="mt-2.5 pt-2 border-t border-[#E5DEC9]/80 overflow-y-auto overscroll-contain space-y-1 max-h-56"
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
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F0E6] text-[#263D32] border border-[#E2D9C5]">
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
            className="absolute bottom-full left-3 right-3 mb-2.5 rounded-2xl bg-[#FFFDF9] border border-[#E5DEC9] shadow-[0_-10px_34px_rgba(18,28,22,0.16)] p-3.5 max-h-[72vh] flex flex-col animate-slide-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E5DEC9]/80">
              <div>
                <h2 className="font-serif text-base font-bold text-[#1F332A]">
                  Saved Favourites
                </h2>
                <p className="text-[11px] text-[#6E6559]">
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
                        : 'bg-[#F5F0E6] text-[#29251F] border-[#E2D9C5]'
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
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#FAF6EE] border border-[#E2D9C5]"
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
                  className="py-6 px-4 text-center rounded-xl bg-[#FAF6EE]/80 border border-[#E5DEC9]/90 space-y-2"
                >
                  <div className="w-9 h-9 rounded-full bg-[#C55B23]/10 text-[#C55B23] flex items-center justify-center mx-auto">
                    <Heart strokeWidth={1.75} className="w-4 h-4" />
                  </div>
                  <p className="font-serif text-sm font-bold text-[#1F332A]">
                    No saved items yet
                  </p>
                  <p className="text-xs text-[#6E6559] max-w-xs mx-auto leading-relaxed">
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
          className="bg-[#FFFDF9] border-t border-[#E5DEC9] shadow-[0_-4px_20px_rgba(18,28,22,0.08)] px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        >
          <div
            className={`grid ${
              bottomQuickAction ? 'grid-cols-5' : 'grid-cols-4'
            } gap-1 max-w-md mx-auto items-center`}
          >
            {/* Position 1: Home (Icon only) */}
            <Link
              href="/"
              data-testid="mobile-nav-home"
              aria-label="Home"
              title="Home"
              onClick={() => setActiveSheet('none')}
              aria-current={isHomeActive ? 'page' : undefined}
              className={`flex items-center justify-center h-10 rounded-xl transition-colors ${
                isHomeActive
                  ? 'text-[#C55B23]'
                  : 'text-[#29251F] hover:text-[#C55B23]'
              }`}
            >
              <Home
                strokeWidth={1.85}
                className={`w-5 h-5 ${isHomeActive ? 'text-[#C55B23]' : 'text-[#29251F]'}`}
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
              className={`flex items-center justify-center h-10 rounded-xl transition-colors ${
                isPillarNavActive
                  ? 'text-[#C55B23]'
                  : 'text-[#29251F] hover:text-[#C55B23]'
              }`}
            >
              {renderDynamicNavIcon(
                dynamicPillarItem.iconName,
                `w-5 h-5 ${isPillarNavActive ? 'text-[#C55B23]' : 'text-[#29251F]'}`
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
              className={`flex items-center justify-center h-10 rounded-xl transition-colors ${
                isSearchActive
                  ? 'text-[#C55B23]'
                  : 'text-[#29251F] hover:text-[#C55B23]'
              }`}
            >
              <Search
                strokeWidth={1.85}
                className={`w-5 h-5 ${isSearchActive ? 'text-[#C55B23]' : 'text-[#29251F]'}`}
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
              className={`relative flex items-center justify-center h-10 rounded-xl transition-colors ${
                isFavouritesActive
                  ? 'text-[#C55B23]'
                  : 'text-[#29251F] hover:text-[#C55B23]'
              }`}
            >
              <span className="relative">
                <Heart
                  strokeWidth={1.85}
                  className={`w-5 h-5 ${
                    isFavouritesActive ? 'text-[#C55B23]' : 'text-[#29251F]'
                  }`}
                />
                {savedItems.length > 0 && (
                  <span
                    data-testid="mobile-favourites-dot"
                    className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#C55B23] ring-1 ring-[#FFFDF9]"
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
                className={`flex items-center justify-center h-10 rounded-xl transition-colors ${
                  isQuickActionActive
                    ? 'text-[#C55B23]'
                    : 'text-[#29251F] hover:text-[#C55B23]'
                }`}
              >
                {renderQuickActionIcon(
                  bottomQuickAction.iconName,
                  `w-5 h-5 ${isQuickActionActive ? 'text-[#C55B23]' : 'text-[#29251F]'}`
                )}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
