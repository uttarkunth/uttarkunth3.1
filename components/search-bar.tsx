'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CURATED_DESTINATIONS } from '@/lib/destinations';
import { parseVoiceSearchCommand } from '@/lib/voice-search';
import { MapPin, Calendar, Users, Search, Mic, MicOff } from 'lucide-react';

interface SearchBarProps {
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  initialQuery?: string;
  compact?: boolean;
}

export function SearchBar({
  initialDestination = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  initialQuery = '',
  compact = false,
}: SearchBarProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(initialDestination);
  const [voiceQuery, setVoiceQuery] = useState(initialQuery);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const showFeedback = useCallback((msg: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setVoiceFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => {
      setVoiceFeedback(null);
    }, 3000);
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

  const applySpokenCommand = useCallback(
    (transcript: string) => {
      const parsed = parseVoiceSearchCommand(transcript, CURATED_DESTINATIONS);
      if (!parsed.cleanedQuery) return;

      if (parsed.extractedGuests) {
        setGuests(parsed.extractedGuests);
      }

      if (parsed.matchedDestinationSlug) {
        setDestination(parsed.matchedDestinationSlug);
        setVoiceQuery('');
        showFeedback(`Destination set to ${parsed.matchedDestinationName}`);
      } else {
        setVoiceQuery(parsed.cleanedQuery);
        showFeedback(`Voice search: "${parsed.cleanedQuery}"`);
      }
    },
    [showFeedback]
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (voiceQuery.trim()) params.set('q', voiceQuery.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests.toString());

    router.push(`/stays?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`bg-warm-surface rounded-2xl shadow-editorial-lg border border-beige-dark/60 p-2 sm:p-3 transition-all duration-300 ease-editorial ${
        compact ? 'max-w-4xl' : 'max-w-5xl'
      } mx-auto`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.45fr_0.95fr_0.95fr_1.35fr] gap-2 divide-y sm:divide-y-0 sm:divide-x divide-beige/90">
        {/* Destination Picker + Voice-to-Text Trigger */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 min-w-0">
          <MapPin className="w-5 h-5 text-terracotta flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label
              htmlFor="stays-search-destination"
              className="block text-[10px] font-bold uppercase tracking-[0.14em] text-charcoal-muted mb-0.5"
            >
              Destination
            </label>
            <select
              id="stays-search-destination"
              suppressHydrationWarning
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setVoiceQuery('');
              }}
              className="w-full bg-transparent font-semibold text-charcoal text-sm focus:outline-none truncate cursor-pointer"
            >
              <option value="">
                {voiceQuery ? `Stay: ${voiceQuery}` : 'All Mountain Destinations'}
              </option>
              <optgroup label="Himachal Pradesh">
                {CURATED_DESTINATIONS.filter((d) => d.region === 'Himachal Pradesh').map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Jammu & Kashmir">
                {CURATED_DESTINATIONS.filter((d) => d.region === 'Jammu & Kashmir').map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Uttarakhand">
                {CURATED_DESTINATIONS.filter((d) => d.region === 'Uttarakhand').map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            type="button"
            data-testid="stays-search-bar-voice-button"
            suppressHydrationWarning
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
            className={`relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer ${
              isListening
                ? 'bg-terracotta text-warm-surface ring-4 ring-terracotta/25'
                : 'bg-warm-canvas hover:bg-beige/70 text-forest hover:text-terracotta border border-beige-dark/60'
            }`}
          >
            {isListening ? (
              <>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-terracotta/35 animate-ping"
                />
                <MicOff className="relative z-10 w-3.5 h-3.5" />
              </>
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Check-in Date */}
        <div className="flex items-center gap-2.5 px-3 py-2 min-w-0">
          <Calendar className="w-5 h-5 text-forest flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label
              htmlFor="stays-search-checkin"
              className="block text-[10px] font-bold uppercase tracking-[0.14em] text-charcoal-muted mb-0.5"
            >
              Check-in
            </label>
            <input
              id="stays-search-checkin"
              suppressHydrationWarning
              type="date"
              min={todayStr}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) {
                  setCheckOut('');
                }
              }}
              className="w-full bg-transparent font-semibold text-charcoal text-sm tabular-nums focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Check-out Date */}
        <div className="flex items-center gap-2.5 px-3 py-2 min-w-0">
          <Calendar className="w-5 h-5 text-forest flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label
              htmlFor="stays-search-checkout"
              className="block text-[10px] font-bold uppercase tracking-[0.14em] text-charcoal-muted mb-0.5"
            >
              Check-out
            </label>
            <input
              id="stays-search-checkout"
              suppressHydrationWarning
              type="date"
              min={checkIn || todayStr}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent font-semibold text-charcoal text-sm tabular-nums focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Guests & Submit Button */}
        <div className="flex items-center justify-between gap-2.5 px-3.5 py-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-[92px] flex-1">
            <Users className="w-5 h-5 text-forest flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label
                htmlFor="stays-search-guests"
                className="block text-[10px] font-bold uppercase tracking-[0.14em] text-charcoal-muted mb-0.5"
              >
                Guests
              </label>
              <select
                id="stays-search-guests"
                suppressHydrationWarning
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value, 10))}
                className="w-full bg-transparent font-semibold text-charcoal text-sm tabular-nums focus:outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            suppressHydrationWarning
            className="flex-shrink-0 bg-forest hover:bg-forest-dark text-warm-surface py-3 px-4 rounded-xl transition-all duration-200 ease-editorial hover:-translate-y-0.5 active:translate-y-0 shadow-editorial-sm flex items-center justify-center gap-1.5 font-semibold text-xs uppercase tracking-[0.1em]"
          >
            <Search className="w-4 h-4 text-terracotta-light" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {(isListening || voiceFeedback) && (
        <div
          role="status"
          aria-live="polite"
          className="mt-2 pt-2 border-t border-beige/70 flex items-center justify-between px-3 text-xs text-forest font-medium"
        >
          <span className="inline-flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isListening ? 'bg-terracotta animate-pulse' : 'bg-forest'
              }`}
            />
            <span>
              {isListening
                ? 'Listening… speak a destination (e.g., "Manali") or stay name'
                : voiceFeedback}
            </span>
          </span>
        </div>
      )}
    </form>
  );
}
