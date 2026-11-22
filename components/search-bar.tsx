'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { CURATED_DESTINATIONS, Destination } from '@/lib/destinations';
import { EXISTING_PROPERTIES } from '@/lib/constants';
import { EXISTING_REVIEWS, PublicReviewItem } from '@/lib/reviews';
import { parseVoiceSearchCommand } from '@/lib/voice-search';
import {
  getStaysWhereSuggestions,
  formatStayDateRangeSummary,
  validateAndFormatGuests,
  deriveAvailableAmenityChips,
  formatSearchCapsuleSummary,
  getCatalogMaxGuestCapacity,
  StaysSearchCriteria,
  StaysWhereSuggestion,
} from '@/lib/stays-search';
import { StaysSearchCalendar } from '@/components/stays/stays-search-calendar';
import {
  MapPin,
  Calendar,
  Users,
  Search,
  Mic,
  MicOff,
  X,
  Plus,
  Minus,
  Home,
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

export interface SearchBarProps {
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  initialAdults?: number;
  initialChildren?: number;
  initialChildAges?: number[];
  initialInfants?: number;
  initialQuery?: string;
  initialAmenities?: string[];
  compact?: boolean;
  showAmenityChips?: boolean;
  properties?: any[];
  destinations?: Destination[];
  approvedReviews?: PublicReviewItem[];
  onCriteriaChange?: (criteria: StaysSearchCriteria) => void;
}

type SearchStage = 'where' | 'when' | 'who' | null;

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

export function SearchBar({
  initialDestination = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  initialAdults,
  initialChildren = 0,
  initialChildAges = [],
  initialInfants = 0,
  initialQuery = '',
  initialAmenities = [],
  compact = false,
  showAmenityChips = true,
  properties = EXISTING_PROPERTIES,
  destinations = CURATED_DESTINATIONS,
  approvedReviews = EXISTING_REVIEWS,
  onCriteriaChange,
}: SearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvedInitialAdults =
    typeof initialAdults === 'number' && initialAdults >= 1
      ? initialAdults
      : Math.max(1, initialGuests - initialChildren);

  const [destinationSlug, setDestinationSlug] = useState(initialDestination);
  const [whereSearchText, setWhereSearchText] = useState(() => {
    if (initialDestination) {
      const matchedD = destinations.find((d) => d.slug === initialDestination);
      if (matchedD) return matchedD.name;
      const matchedP = properties.find((p) => p.slug === initialDestination);
      if (matchedP) return matchedP.name;
    }
    return initialQuery || '';
  });
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [adults, setAdults] = useState(resolvedInitialAdults);
  const [childrenCount, setChildrenCount] = useState(initialChildren);
  const [childAges, setChildAges] = useState<number[]>(initialChildAges);
  const [infants, setInfants] = useState(initialInfants);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialAmenities);

  const initialChildAgesKey = initialChildAges.join(',');
  const initialAmenitiesKey = initialAmenities.join(',');

  useEffect(() => {
    setDestinationSlug(initialDestination);
    if (initialDestination) {
      const matchedD = destinations.find((d) => d.slug === initialDestination);
      const matchedP = properties.find((p) => p.slug === initialDestination);
      setWhereSearchText(matchedD?.name || matchedP?.name || initialQuery || '');
    } else {
      setWhereSearchText(initialQuery || '');
    }
    setCheckIn(initialCheckIn);
    setCheckOut(initialCheckOut);
    setAdults(resolvedInitialAdults);
    setChildrenCount(initialChildren);
    setChildAges(
      initialChildAgesKey
        ? initialChildAgesKey.split(',').map((n) => Number(n)).filter((n) => !Number.isNaN(n))
        : []
    );
    setInfants(initialInfants);
    setSelectedAmenities(
      initialAmenitiesKey ? initialAmenitiesKey.split(',').filter(Boolean) : []
    );
  }, [
    initialDestination,
    initialQuery,
    initialCheckIn,
    initialCheckOut,
    resolvedInitialAdults,
    initialChildren,
    initialChildAgesKey,
    initialInfants,
    initialAmenitiesKey,
    destinations,
    properties,
  ]);

  // Desktop active popover stage ('where' | 'when' | 'who' | null)
  const [desktopStage, setDesktopStage] = useState<SearchStage>(null);

  // Mobile expanded guided 3-stage sheet state
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [mobileStage, setMobileStage] = useState<'where' | 'when' | 'who'>('where');

  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const maxCatalogCapacity = useMemo(
    () => getCatalogMaxGuestCapacity(properties),
    [properties]
  );

  const guestSummary = useMemo(
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

  const dateRangeSummary = useMemo(
    () => formatStayDateRangeSummary(checkIn, checkOut),
    [checkIn, checkOut]
  );

  const selectedDestinationName = useMemo(() => {
    if (destinationSlug) {
      const dest = destinations.find((d) => d.slug === destinationSlug);
      if (dest) return dest.name;
      const prop = properties.find((p) => p.slug === destinationSlug);
      if (prop) return prop.name;
    }
    return whereSearchText.trim();
  }, [destinationSlug, whereSearchText, destinations, properties]);

  const capsuleSummary = useMemo(
    () =>
      formatSearchCapsuleSummary({
        destinationLabel: selectedDestinationName,
        query: whereSearchText,
        checkIn,
        checkOut,
        adults,
        children: childrenCount,
        infants,
      }),
    [selectedDestinationName, whereSearchText, checkIn, checkOut, adults, childrenCount, infants]
  );

  const whereSuggestions = useMemo(() => {
    // If the input matches the currently selected destination label exactly, show both popular & matching
    const queryForLookup =
      destinationSlug && selectedDestinationName === whereSearchText.trim()
        ? ''
        : whereSearchText;
    return getStaysWhereSuggestions(queryForLookup, destinations, properties);
  }, [whereSearchText, destinationSlug, selectedDestinationName, destinations, properties]);

  const availableAmenityChips = useMemo(
    () => deriveAvailableAmenityChips(properties, approvedReviews),
    [properties, approvedReviews]
  );

  const showFeedback = useCallback((msg: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setVoiceFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => {
      setVoiceFeedback(null);
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Close desktop popover on outside click or Escape key
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        desktopStage &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDesktopStage(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDesktopStage(null);
        setMobileExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [desktopStage]);

  const buildUrlSearchParams = useCallback(
    (overrides?: Partial<StaysSearchCriteria>) => {
      const nextDest =
        overrides?.destinationSlug !== undefined
          ? overrides.destinationSlug
          : destinationSlug;
      const nextQuery =
        overrides?.query !== undefined ? overrides.query : whereSearchText.trim();
      const nextCheckIn = overrides?.checkIn !== undefined ? overrides.checkIn : checkIn;
      const nextCheckOut = overrides?.checkOut !== undefined ? overrides.checkOut : checkOut;
      const nextAdults = overrides?.adults !== undefined ? overrides.adults : adults;
      const nextChildren =
        overrides?.children !== undefined ? overrides.children : childrenCount;
      const nextChildAges =
        overrides?.childAges !== undefined ? overrides.childAges : childAges;
      const nextInfants = overrides?.infants !== undefined ? overrides.infants : infants;
      const nextAmenities =
        overrides?.selectedAmenityIds !== undefined
          ? overrides.selectedAmenityIds
          : selectedAmenities;

      const params = new URLSearchParams();
      if (nextDest) {
        params.set('destination', nextDest);
      } else if (nextQuery) {
        params.set('q', nextQuery);
      }
      if (nextCheckIn) params.set('checkIn', nextCheckIn);
      if (nextCheckOut) params.set('checkOut', nextCheckOut);

      const totalSeated = nextAdults + nextChildren;
      params.set('guests', String(totalSeated));
      params.set('adults', String(nextAdults));
      if (nextChildren > 0) {
        params.set('children', String(nextChildren));
        if (nextChildAges.length > 0) {
          params.set('childAges', nextChildAges.slice(0, nextChildren).join(','));
        }
      }
      if (nextInfants > 0) {
        params.set('infants', String(nextInfants));
      }
      if (nextAmenities && nextAmenities.length > 0) {
        params.set('amenities', nextAmenities.join(','));
      }
      return params;
    },
    [
      destinationSlug,
      whereSearchText,
      checkIn,
      checkOut,
      adults,
      childrenCount,
      childAges,
      infants,
      selectedAmenities,
    ]
  );

  const commitSearch = useCallback(
    (overrides?: Partial<StaysSearchCriteria>) => {
      const nextDest =
        overrides?.destinationSlug !== undefined
          ? overrides.destinationSlug
          : destinationSlug;
      const nextQuery =
        overrides?.query !== undefined
          ? overrides.query
          : nextDest
          ? ''
          : whereSearchText.trim();
      const nextCheckIn = overrides?.checkIn !== undefined ? overrides.checkIn : checkIn;
      const nextCheckOut = overrides?.checkOut !== undefined ? overrides.checkOut : checkOut;
      const nextAdults = overrides?.adults !== undefined ? overrides.adults : adults;
      const nextChildren =
        overrides?.children !== undefined ? overrides.children : childrenCount;
      const nextChildAges =
        overrides?.childAges !== undefined
          ? overrides.childAges
          : childAges.slice(0, nextChildren);
      const nextInfants = overrides?.infants !== undefined ? overrides.infants : infants;
      const nextAmenities =
        overrides?.selectedAmenityIds !== undefined
          ? overrides.selectedAmenityIds
          : selectedAmenities;

      const criteria: StaysSearchCriteria = {
        destinationSlug: nextDest,
        query: nextQuery,
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        adults: nextAdults,
        children: nextChildren,
        childAges: nextChildAges,
        infants: nextInfants,
        selectedAmenityIds: nextAmenities,
      };

      if (onCriteriaChange) {
        onCriteriaChange(criteria);
      }

      const params = buildUrlSearchParams(criteria);
      const queryString = params.toString();
      router.push(queryString ? `/stays?${queryString}` : '/stays', { scroll: false });
      setDesktopStage(null);
      setMobileExpanded(false);
    },
    [
      destinationSlug,
      whereSearchText,
      checkIn,
      checkOut,
      adults,
      childrenCount,
      childAges,
      infants,
      selectedAmenities,
      onCriteriaChange,
      buildUrlSearchParams,
      router,
    ]
  );

  const handleSelectSuggestion = (item: StaysWhereSuggestion, isMobileFlow = false) => {
    setDestinationSlug(item.slug);
    setWhereSearchText(item.name);
    if (isMobileFlow) {
      setMobileStage('when');
    } else {
      setDesktopStage('when');
    }
  };

  const handleClearAll = () => {
    setDestinationSlug('');
    setWhereSearchText('');
    setCheckIn('');
    setCheckOut('');
    setAdults(2);
    setChildrenCount(0);
    setChildAges([]);
    setInfants(0);
    setSelectedAmenities([]);

    if (onCriteriaChange) {
      onCriteriaChange({
        destinationSlug: '',
        query: '',
        checkIn: '',
        checkOut: '',
        adults: 2,
        children: 0,
        childAges: [],
        infants: 0,
        selectedAmenityIds: [],
      });
    }
    router.push('/stays', { scroll: false });
  };

  const handleToggleAmenityChip = (chipId: string) => {
    const exists = selectedAmenities.includes(chipId);
    const nextAmenities = exists
      ? selectedAmenities.filter((id) => id !== chipId)
      : [...selectedAmenities, chipId];
    setSelectedAmenities(nextAmenities);
    commitSearch({ selectedAmenityIds: nextAmenities });
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

  const applySpokenCommand = useCallback(
    (transcript: string) => {
      const parsed = parseVoiceSearchCommand(transcript, destinations);
      if (!parsed.cleanedQuery) return;

      if (parsed.extractedGuests) {
        setAdults(Math.max(1, parsed.extractedGuests));
      }

      if (parsed.matchedDestinationSlug) {
        setDestinationSlug(parsed.matchedDestinationSlug);
        setWhereSearchText(parsed.matchedDestinationName || parsed.cleanedQuery);
        showFeedback(`Destination set to ${parsed.matchedDestinationName}`);
      } else {
        setDestinationSlug('');
        setWhereSearchText(parsed.cleanedQuery);
        showFeedback(`Voice search: "${parsed.cleanedQuery}"`);
      }
    },
    [destinations, showFeedback]
  );

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

    const win = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
      __mockSpeechTranscript?: string;
    };

    if (typeof win.__mockSpeechTranscript === 'string' && win.__mockSpeechTranscript.trim()) {
      setIsListening(true);
      const mockText = win.__mockSpeechTranscript;
      setTimeout(() => {
        applySpokenCommand(mockText);
        setIsListening(false);
      }, 120);
      return;
    }

    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      showFeedback('Voice search is not supported in this browser.');
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
          applySpokenCommand(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          showFeedback('Microphone access was denied.');
        } else if (event?.error !== 'aborted' && event?.error !== 'no-speech') {
          showFeedback('Could not capture voice input.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      showFeedback('Unable to start voice search.');
    }
  }, [isListening, applySpokenCommand, showFeedback]);

  // Shared WHERE Dropdown/Stage Panel Content
  const renderWherePanelContent = (isMobileFlow = false) => (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={isMobileFlow ? 'mobile-where-input' : 'desktop-where-input'}
          className="font-sans block text-xs font-semibold text-[#29251F] mb-1.5"
        >
          Search destinations or mountain homestays
        </label>
        <div className="relative flex items-center">
          <MapPin className="w-4 h-4 text-[#C55B23] absolute left-3.5 pointer-events-none" />
          <input
            id={isMobileFlow ? 'mobile-where-input' : 'desktop-where-input'}
            data-testid={
              isMobileFlow ? 'stays-mobile-where-input' : 'stays-desktop-where-input'
            }
            type="text"
            value={whereSearchText}
            onChange={(e) => {
              setWhereSearchText(e.target.value);
              setDestinationSlug('');
            }}
            placeholder="Search Kullu Jari, Manali, Spiti, Yash Home Stay..."
            className="font-sans w-full min-h-[44px] pl-10 pr-20 py-2.5 rounded-xl bg-[#F5F0E6]/75 border border-[#D9CCB8] text-sm font-medium text-[#29251F] placeholder:text-[#5C5549]/70 focus:outline-none focus:border-[#263D32] focus:ring-2 focus:ring-[#263D32]/20"
          />
          {whereSearchText && (
            <button
              type="button"
              onClick={() => {
                setWhereSearchText('');
                setDestinationSlug('');
              }}
              aria-label="Clear destination query"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5C5549] hover:text-[#29251F] hover:bg-[#EAE2D3] mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            data-testid={
              isMobileFlow
                ? 'stays-mobile-voice-button'
                : 'stays-search-bar-voice-button'
            }
            onClick={handleToggleVoiceSearch}
            aria-label={
              isListening
                ? 'Stop voice search'
                : 'Search stays or destinations by voice'
            }
            aria-pressed={isListening}
            className={`w-9 h-9 mr-1.5 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              isListening
                ? 'bg-[#C55B23] text-[#FFFDF9]'
                : 'bg-[#FFFDF9] hover:bg-[#EAE2D3] text-[#263D32] border border-[#D9CCB8]'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Matching Published Properties */}
      {whereSuggestions.matchingProperties.length > 0 && (
        <div className="space-y-2">
          <span className="font-sans block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5C5549]">
            Verified Mountain Stays
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {whereSuggestions.matchingProperties.map((prop) => {
              const isSelected = destinationSlug === prop.slug;
              return (
                <button
                  key={prop.id}
                  type="button"
                  data-testid={`where-suggestion-property-${prop.slug}`}
                  onClick={() => handleSelectSuggestion(prop, isMobileFlow)}
                  className={`w-full min-h-[54px] px-3 py-2 rounded-2xl flex items-center justify-between gap-3 text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#263D32] text-[#FFFDF9] shadow-sm'
                      : 'bg-[#F5F0E6]/70 hover:bg-[#EAE2D3]/90 text-[#29251F] border border-[#D9CCB8]/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {prop.imageUrl ? (
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#D9CCB8] shrink-0 bg-[#EAE2D3]">
                        <img
                          src={prop.imageUrl}
                          alt={prop.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#FFFDF9]/15 text-[#FFFDF9]'
                            : 'bg-[#FFFDF9] text-[#263D32] border border-[#D9CCB8]'
                        }`}
                      >
                        <Home className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold truncate">{prop.name}</p>
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
                    className={`font-sans text-[11px] font-semibold px-2.5 py-1 rounded-md shrink-0 ${
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

      {/* Popular or Matching Curated Destinations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-sans block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5C5549]">
            {whereSearchText.trim()
              ? `Matching Himalayan Destinations (${whereSuggestions.matchingDestinations.length})`
              : 'Suggested Himalayan Destinations'}
          </span>
          {(destinationSlug || whereSearchText) && (
            <button
              type="button"
              onClick={() => {
                setDestinationSlug('');
                setWhereSearchText('');
              }}
              className="font-sans text-xs font-semibold text-[#C55B23] hover:underline cursor-pointer"
            >
              Show all destinations
            </button>
          )}
        </div>

        {whereSuggestions.matchingDestinations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
            {(whereSearchText.trim()
              ? whereSuggestions.matchingDestinations
              : whereSuggestions.popularDestinations
            ).map((dest) => {
              const isSelected = destinationSlug === dest.slug;
              return (
                <button
                  key={dest.id}
                  type="button"
                  data-testid={`where-suggestion-destination-${dest.slug}`}
                  onClick={() => handleSelectSuggestion(dest, isMobileFlow)}
                  className={`min-h-[56px] px-3 py-2 rounded-2xl flex items-center gap-3 text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#263D32] text-[#FFFDF9] shadow-sm'
                      : 'bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] border border-[#D9CCB8]/80'
                  }`}
                >
                  {dest.imageUrl ? (
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#D9CCB8] shrink-0 bg-[#EAE2D3]">
                      <img
                        src={dest.imageUrl}
                        alt={dest.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
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
                      <p className="font-sans text-sm font-semibold truncate">{dest.name}</p>
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
          <p className="font-sans text-xs text-[#5C5549] py-3 px-3.5 rounded-xl bg-[#F5F0E6]/70 border border-[#D9CCB8]">
            No configured mountain destinations match &ldquo;{whereSearchText}&rdquo;. Try
            searching Kullu Jari, Manali, Kasol, Spiti Valley, or Yash Home Stay.
          </p>
        )}
      </div>
    </div>
  );

  // Shared WHO Guest & Occupancy Panel Content
  const renderWhoPanelContent = () => (
    <div data-testid="stays-who-panel" className="space-y-4">
      <div className="divide-y divide-[#D9CCB8]/70">
        {/* 1. Adults: 18 years and above */}
        <div className="py-3 first:pt-0 flex items-center justify-between gap-4">
          <div>
            <p className="font-sans text-sm font-semibold text-[#29251F]">Adults</p>
            <p className="font-sans text-xs text-[#5C5549]">18 years and above</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="guests-adults-decrease"
              onClick={() => setAdults((a) => Math.max(1, a - 1))}
              disabled={adults <= 1}
              aria-label="Decrease adults"
              className="w-11 h-11 rounded-full border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span
              data-testid="guests-adults-count"
              className="font-sans text-sm font-semibold text-[#29251F] w-6 text-center tabular-nums"
            >
              {adults}
            </span>
            <button
              type="button"
              data-testid="guests-adults-increase"
              onClick={() => setAdults((a) => Math.min(12, a + 1))}
              disabled={adults >= 12}
              aria-label="Increase adults"
              className="w-11 h-11 rounded-full border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Children: 2–17 years */}
        <div className="py-3 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-sans text-sm font-semibold text-[#29251F]">Children</p>
              <p className="font-sans text-xs text-[#5C5549]">2–17 years</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-testid="guests-children-decrease"
                onClick={() => updateChildrenCount(childrenCount - 1)}
                disabled={childrenCount <= 0}
                aria-label="Decrease children"
                className="w-11 h-11 rounded-full border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span
                data-testid="guests-children-count"
                className="font-sans text-sm font-semibold text-[#29251F] w-6 text-center tabular-nums"
              >
                {childrenCount}
              </span>
              <button
                type="button"
                data-testid="guests-children-increase"
                onClick={() => updateChildrenCount(childrenCount + 1)}
                disabled={childrenCount >= 8}
                aria-label="Increase children"
                className="w-11 h-11 rounded-full border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Individual Child Age Selectors when children > 0 */}
          {childrenCount > 0 && (
            <div
              data-testid="guests-child-ages-container"
              className="p-3 rounded-xl bg-[#F5F0E6]/80 border border-[#D9CCB8] space-y-2"
            >
              <p className="font-sans text-xs font-semibold text-[#29251F]">
                Child age at check-in (for room eligibility &amp; host preparation)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from({ length: childrenCount }).map((_, idx) => (
                  <div key={`child-age-${idx}`}>
                    <label
                      htmlFor={`child-age-select-${idx}`}
                      className="font-sans block text-[11px] font-medium text-[#5C5549] mb-1"
                    >
                      Child {idx + 1} age
                    </label>
                    <select
                      id={`child-age-select-${idx}`}
                      data-testid={`child-age-select-${idx}`}
                      value={childAges[idx] ?? 6}
                      onChange={(e) => updateChildAgeAt(idx, Number(e.target.value))}
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

        {/* 3. Infants: Under 2 years */}
        <div className="py-3 last:pb-0 flex items-center justify-between gap-4">
          <div>
            <p className="font-sans text-sm font-semibold text-[#29251F]">Infants</p>
            <p className="font-sans text-xs text-[#5C5549]">
              Under 2 years · Do not occupy a separate bed
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="guests-infants-decrease"
              onClick={() => setInfants((i) => Math.max(0, i - 1))}
              disabled={infants <= 0}
              aria-label="Decrease infants"
              className="w-11 h-11 rounded-full border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span
              data-testid="guests-infants-count"
              className="font-sans text-sm font-semibold text-[#29251F] w-6 text-center tabular-nums"
            >
              {infants}
            </span>
            <button
              type="button"
              data-testid="guests-infants-increase"
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

      {/* Room Occupancy Notice / Warning */}
      {guestSummary.capacityWarning ? (
        <div
          role="status"
          data-testid="guests-capacity-warning"
          className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FDF5EC] border border-[#E5C6A0] text-[#8A4215] text-xs font-sans"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C55B23]" />
          <div>
            <p className="font-semibold">{guestSummary.capacityWarning}</p>
            <p className="mt-0.5 text-[#5C5549]">
              Searching with {guestSummary.totalSeatedGuests} guests will only show properties
              that can accommodate {guestSummary.totalSeatedGuests} seated guests.
            </p>
          </div>
        </div>
      ) : (
        <p className="font-sans text-xs text-[#5C5549] bg-[#F5F0E6]/70 px-3.5 py-2.5 rounded-xl border border-[#D9CCB8]/70">
          Verified mountain homestays currently accommodate up to {maxCatalogCapacity} seated
          guests (adults &amp; children) per room. Infants under 2 stay free with parents.
        </p>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      data-testid="stays-hero-search-bar"
      className={`relative z-30 ${compact ? 'max-w-4xl' : 'max-w-5xl'} mx-auto text-left space-y-3`}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          PART 3A — MOBILE INITIAL COMPACT SEARCH CAPSULE (< md)
          • Search icon + concise summary ("Where to? · Any dates · 2 guests") + dropdown arrow
      ───────────────────────────────────────────────────────────────────── */}
      <div className="md:hidden">
        <button
          type="button"
          data-testid="stays-mobile-search-capsule"
          onClick={() => {
            setMobileExpanded(true);
            setMobileStage('where');
          }}
          aria-expanded={mobileExpanded}
          aria-label={`Search stays: ${capsuleSummary.fullText}`}
          className="group w-full min-h-[54px] pl-5 pr-2.5 py-2 rounded-full bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_14px_34px_-10px_rgba(18,28,22,0.28)] hover:border-[#263D32]/50 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer"
        >
          <div className="min-w-0 flex-1">
            <p
              data-testid="stays-mobile-capsule-summary"
              className="font-sans text-xs sm:text-[13px] font-semibold text-[#29251F] truncate"
            >
              {capsuleSummary.fullText}
            </p>
            <p className="font-sans text-[11px] text-[#5C5549] truncate">
              Tap to choose destination, dates &amp; guests
            </p>
          </div>
          <div
            data-testid="stays-mobile-capsule-search-cta"
            className="w-10 h-10 rounded-full bg-[#263D32] group-hover:bg-[#C55B23] hover:bg-[#C55B23] text-[#FFFDF9] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(38,61,50,0.25)] transition-colors duration-200"
          >
            <Search className="w-4 h-4" />
          </div>
        </button>

        {/* PART 3B — MOBILE EXPANDED 3-STAGE GUIDED SHEET (WHERE -> WHEN -> WHO) */}
        {mobileExpanded &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Search mountain stays"
              data-testid="stays-mobile-expanded-sheet"
              className="fixed inset-0 z-splash bg-[#29251F]/65 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4"
            >
              <div className="bg-[#F5F0E6]/96 backdrop-blur-xl w-full max-h-[92vh] rounded-t-[26px] sm:rounded-[26px] border-t sm:border border-[#D9CCB8] shadow-2xl flex flex-col overflow-hidden animate-uk-sheet-unfold">
                {/* Sheet Header */}
                <div className="px-4 py-3.5 bg-[#FFFDF9] border-b border-[#D9CCB8] flex items-center justify-between">
                  <span className="font-serif text-lg font-semibold text-[#29251F]">
                    Find Your Mountain Stay
                  </span>
                  <button
                    type="button"
                    data-testid="stays-mobile-sheet-close"
                    onClick={() => setMobileExpanded(false)}
                    aria-label="Close search panel"
                    className="w-11 h-11 rounded-full bg-[#F5F0E6] border border-[#D9CCB8] flex items-center justify-center text-[#29251F] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Guided 3-Stage Stepper Pills (Tap any stage to edit without losing selections) */}
                <div className="px-4 pt-3 pb-2 bg-[#FFFDF9] border-b border-[#D9CCB8]/70 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    data-testid="stays-mobile-stage-tab-where"
                    onClick={() => setMobileStage('where')}
                    className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-left border transition-colors cursor-pointer ${
                      mobileStage === 'where'
                        ? 'bg-[#263D32] border-[#263D32] text-[#FFFDF9]'
                        : 'bg-[#F5F0E6] border-[#D9CCB8] text-[#29251F]'
                    }`}
                  >
                    <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider opacity-80">
                      1. Where
                    </span>
                    <span className="block font-sans text-xs font-semibold truncate">
                      {capsuleSummary.whereText}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="stays-mobile-stage-tab-when"
                    onClick={() => setMobileStage('when')}
                    className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-left border transition-colors cursor-pointer ${
                      mobileStage === 'when'
                        ? 'bg-[#263D32] border-[#263D32] text-[#FFFDF9]'
                        : 'bg-[#F5F0E6] border-[#D9CCB8] text-[#29251F]'
                    }`}
                  >
                    <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider opacity-80">
                      2. When
                    </span>
                    <span className="block font-sans text-xs font-semibold truncate">
                      {capsuleSummary.whenText}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="stays-mobile-stage-tab-who"
                    onClick={() => setMobileStage('who')}
                    className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-left border transition-colors cursor-pointer ${
                      mobileStage === 'who'
                        ? 'bg-[#263D32] border-[#263D32] text-[#FFFDF9]'
                        : 'bg-[#F5F0E6] border-[#D9CCB8] text-[#29251F]'
                    }`}
                  >
                    <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider opacity-80">
                      3. Who
                    </span>
                    <span className="block font-sans text-xs font-semibold truncate">
                      {capsuleSummary.whoText}
                    </span>
                  </button>
                </div>

                {/* Active Stage Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {mobileStage === 'where' && (
                    <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#D9CCB8] space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-xl font-semibold text-[#29251F]">
                          Where to?
                        </h3>
                        <button
                          type="button"
                          onClick={() => setMobileStage('when')}
                          className="font-sans text-xs font-semibold text-[#263D32] hover:underline cursor-pointer"
                        >
                          Next: Dates &rarr;
                        </button>
                      </div>
                      {renderWherePanelContent(true)}
                    </div>
                  )}

                  {mobileStage === 'when' && (
                    <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#D9CCB8] space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-xl font-semibold text-[#29251F]">
                          When is your stay?
                        </h3>
                        <button
                          type="button"
                          onClick={() => setMobileStage('who')}
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

                  {mobileStage === 'who' && (
                    <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#D9CCB8] space-y-4">
                      <h3 className="font-serif text-xl font-semibold text-[#29251F]">
                        Who is coming?
                      </h3>
                      {renderWhoPanelContent()}
                    </div>
                  )}
                </div>

                {/* Final Footer: Clear All on left, prominent Forest Green Search Stays CTA on right */}
                <div className="px-4 py-3.5 bg-[#FFFDF9] border-t border-[#D9CCB8] flex items-center justify-between gap-4">
                  <button
                    type="button"
                    data-testid="stays-mobile-clear-all"
                    onClick={handleClearAll}
                    className="font-sans min-h-[44px] px-3 py-2 text-xs font-semibold text-[#29251F] underline underline-offset-4 hover:text-[#C55B23] cursor-pointer"
                  >
                    Clear All
                  </button>

                  <button
                    type="button"
                    data-testid="stays-mobile-search-submit"
                    onClick={() => commitSearch()}
                    className="font-sans min-h-[48px] px-6 py-2.5 rounded-full bg-[#263D32] hover:bg-[#C55B23] text-[#FFFDF9] font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-colors duration-200 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Stays</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          PART 3C — DESKTOP & TABLET HORIZONTAL SEARCH CAPSULE (md+)
          • Layout: WHERE | WHEN | WHO | SEARCH
          • Search CTA is the strongest visual element (Forest Green #263D32)
      ───────────────────────────────────────────────────────────────────── */}
      <div
        data-testid="stays-desktop-search-capsule"
        className="hidden md:block bg-[#FFFDF9] rounded-full shadow-[0_18px_44px_-10px_rgba(18,28,22,0.28),0_4px_14px_-2px_rgba(18,28,22,0.14)] border border-[#D9CCB8] p-2 transition-all"
      >
        <div className="grid grid-cols-[1.35fr_1.15fr_1fr_auto] items-center gap-1">
          {/* 1. WHERE SECTION */}
          <div
            role="button"
            tabIndex={0}
            data-testid="stays-desktop-where-trigger"
            onClick={() =>
              setDesktopStage((prev) => (prev === 'where' ? null : 'where'))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setDesktopStage((prev) => (prev === 'where' ? null : 'where'));
              }
            }}
            className={`min-h-[52px] px-4 py-2 rounded-full flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
              desktopStage === 'where'
                ? 'bg-[#F5F0E6] ring-2 ring-[#263D32]'
                : 'hover:bg-[#F5F0E6]/75'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full bg-[#F5F0E6] border border-[#D9CCB8] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#C55B23]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-sans block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5C5549] mb-0.5">
                  Where
                </span>
                <p
                  data-testid="stays-desktop-where-value"
                  className="font-sans text-sm font-semibold text-[#29251F] truncate"
                >
                  {selectedDestinationName || 'Search destinations or stays'}
                </p>
              </div>
            </div>
            {(destinationSlug || whereSearchText) && (
              <button
                type="button"
                aria-label="Clear selected destination"
                onClick={(e) => {
                  e.stopPropagation();
                  setDestinationSlug('');
                  setWhereSearchText('');
                }}
                className="w-7 h-7 rounded-full hover:bg-[#EAE2D3] flex items-center justify-center text-[#5C5549] hover:text-[#29251F] shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. WHEN SECTION */}
          <div className="border-l border-[#D9CCB8]/80 pl-1">
            <button
              type="button"
              data-testid="stays-desktop-when-trigger"
              onClick={() =>
                setDesktopStage((prev) => (prev === 'when' ? null : 'when'))
              }
              className={`w-full min-h-[52px] px-4 py-2 rounded-full flex items-center gap-3 text-left transition-colors cursor-pointer ${
                desktopStage === 'when'
                  ? 'bg-[#F5F0E6] ring-2 ring-[#263D32]'
                  : 'hover:bg-[#F5F0E6]/75'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[#F5F0E6] border border-[#D9CCB8] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#263D32]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-sans block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5C5549] mb-0.5">
                  When
                </span>
                <p
                  data-testid="stays-desktop-when-value"
                  className="font-sans text-sm font-semibold text-[#29251F] truncate tabular-nums"
                >
                  {dateRangeSummary.rangeLabel}
                </p>
              </div>
            </button>
          </div>

          {/* 3. WHO SECTION */}
          <div className="border-l border-[#D9CCB8]/80 pl-1">
            <button
              type="button"
              data-testid="stays-desktop-who-trigger"
              onClick={() =>
                setDesktopStage((prev) => (prev === 'who' ? null : 'who'))
              }
              className={`w-full min-h-[52px] px-4 py-2 rounded-full flex items-center gap-3 text-left transition-colors cursor-pointer ${
                desktopStage === 'who'
                  ? 'bg-[#F5F0E6] ring-2 ring-[#263D32]'
                  : 'hover:bg-[#F5F0E6]/75'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[#F5F0E6] border border-[#D9CCB8] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#263D32]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-sans block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5C5549] mb-0.5">
                  Who
                </span>
                <p
                  data-testid="stays-desktop-who-value"
                  className="font-sans text-sm font-semibold text-[#29251F] truncate tabular-nums"
                >
                  {guestSummary.summaryLabel}
                </p>
              </div>
            </button>
          </div>

          {/* 4. DOMINANT FOREST GREEN SEARCH CTA */}
          <div className="pl-2 pr-0.5 flex items-center gap-2">
            {(destinationSlug ||
              whereSearchText ||
              checkIn ||
              checkOut ||
              selectedAmenities.length > 0) && (
              <button
                type="button"
                data-testid="stays-desktop-clear-all"
                onClick={handleClearAll}
                className="font-sans min-h-[44px] px-3 text-xs font-semibold text-[#5C5549] hover:text-[#29251F] underline underline-offset-4 cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              data-testid="stays-desktop-search-submit"
              onClick={() => commitSearch()}
              className="font-sans min-h-[48px] px-6 rounded-full bg-[#263D32] hover:bg-[#C55B23] active:bg-[#AD4D1B] text-[#FFFDF9] font-semibold text-sm tracking-[0.02em] flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(38,61,50,0.28)] transition-colors duration-200 cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#FFFDF9]" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP POPOVER PANELS FOR WHERE / WHEN / WHO */}
      {desktopStage && (
        <div
          data-testid={`stays-desktop-popover-${desktopStage}`}
          className="hidden md:block absolute left-0 right-0 top-[68px] z-50 bg-[#FFFDF9]/96 backdrop-blur-xl rounded-[26px] border border-[#D9CCB8] shadow-[0_24px_60px_-15px_rgba(18,28,22,0.32)] p-6 animate-uk-sheet-unfold"
        >
          {desktopStage === 'where' && renderWherePanelContent(false)}

          {desktopStage === 'when' && (
            <StaysSearchCalendar
              checkIn={checkIn}
              checkOut={checkOut}
              todayStr={todayStr}
              singleMonth={false}
              onChangeDates={(nextIn, nextOut) => {
                setCheckIn(nextIn);
                setCheckOut(nextOut);
              }}
            />
          )}

          {desktopStage === 'who' && renderWhoPanelContent()}

          {/* Popover Bottom Action Bar */}
          <div className="mt-5 pt-4 border-t border-[#D9CCB8]/80 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleClearAll}
              className="font-sans min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5C5549] hover:text-[#29251F] hover:bg-[#F5F0E6] transition-colors cursor-pointer"
            >
              Clear All
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDesktopStage(null)}
                className="font-sans min-h-[44px] px-4 py-2 rounded-xl border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-xs font-semibold text-[#29251F] transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                data-testid="stays-popover-apply-search"
                onClick={() => commitSearch()}
                className="font-sans min-h-[44px] px-6 py-2 rounded-xl bg-[#263D32] hover:bg-[#C55B23] text-[#FFFDF9] text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors duration-200 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Apply &amp; Search</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Search Status Banner */}
      {(isListening || voiceFeedback) && (
        <div
          role="status"
          aria-live="polite"
          className="px-4 py-2 rounded-xl bg-[#FFFDF9] border border-[#D9CCB8] flex items-center justify-between text-xs text-[#29251F] font-sans font-medium shadow-xs"
        >
          <span className="inline-flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isListening ? 'bg-[#C55B23] animate-pulse' : 'bg-[#263D32]'
              }`}
            />
            <span>
              {isListening
                ? 'Listening… speak a destination (e.g., "Kullu Jari") or stay name'
                : voiceFeedback}
            </span>
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          PART 5 — DIRECT AMENITY CHIPS (NO "FILTERS" OR "ADVANCED FILTERS" HEADING)
          • Immediately below the search interface
          • Only shows options supported by actual published property data or approved reviews
          • Inactive: border-[#D9CCB8] bg-[#FFFDF9] text-[#29251F]
          • Selected: bg-[#263D32] border-[#263D32] text-[#FFFDF9]
          • Horizontally scrollable on mobile, natural wrap on desktop
      ───────────────────────────────────────────────────────────────────── */}
      {showAmenityChips && availableAmenityChips.length > 0 && (
        <div
          data-testid="stays-direct-amenity-chips"
          aria-label="Filter stays by property amenities"
          className="pt-1 flex items-center gap-2 overflow-x-auto md:flex-wrap no-scrollbar pb-1"
        >
          {availableAmenityChips.map((chip) => {
            const isSelected = selectedAmenities.includes(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                data-testid={`amenity-chip-${chip.id}`}
                aria-pressed={isSelected}
                onClick={() => handleToggleAmenityChip(chip.id)}
                className={`font-sans min-h-[44px] px-4 py-2 rounded-full border text-xs font-semibold inline-flex items-center gap-2 shrink-0 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263D32] focus-visible:ring-offset-1 ${
                  isSelected
                    ? 'bg-[#263D32] border-[#263D32] text-[#FFFDF9] shadow-[0_6px_16px_rgba(38,61,50,0.22)] animate-uk-pill-pop'
                    : 'bg-[#FFFDF9]/95 backdrop-blur-md border-[#D9CCB8] text-[#29251F] hover:border-[#263D32]/60 hover:bg-[#F5F0E6]'
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
  );
}
