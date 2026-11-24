import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getStaysWhereSuggestions,
  buildCalendarMonthGrid,
  evaluateCalendarDayState,
  handleCalendarDateClick,
  formatStayDateRangeSummary,
  validateAndFormatGuests,
  deriveAvailableAmenityChips,
  propertyMatchesAmenityChip,
  filterStaysProperties,
  formatSearchCapsuleSummary,
  INVALID_CHECKOUT_TOOLTIP_MESSAGE,
  formatDateWithMonthName,
  formatUnavailableDateMessage,
  findRoomOccupancyConflict,
} from '../lib/stays-search';
import { CURATED_DESTINATIONS } from '../lib/destinations';
import { EXISTING_PROPERTIES } from '../lib/constants';
import { EXISTING_REVIEWS } from '../lib/reviews';

describe('Stays Search Redesign — WHERE, WHEN, WHO & Direct Amenity Chips', () => {
  describe('WHERE — Destination & Published Property Suggestions', () => {
    it('returns popular destinations and real published properties when query is empty', () => {
      const result = getStaysWhereSuggestions('', CURATED_DESTINATIONS, EXISTING_PROPERTIES);
      assert.ok(result.popularDestinations.length > 0, 'Should return featured popular destinations');
      assert.equal(result.matchingProperties.length, 1);
      assert.equal(result.matchingProperties[0].name, 'Yash Home Stay');
      assert.equal(result.matchingProperties[0].slug, 'yash-home-stay');
    });

    it('matches configured destinations by name, region, or matchTerms', () => {
      const parvatiMatch = getStaysWhereSuggestions(
        'parvati valley',
        CURATED_DESTINATIONS,
        EXISTING_PROPERTIES
      );
      assert.ok(
        parvatiMatch.matchingDestinations.some((d) => d.slug === 'kullu-jari'),
        'Should match Kullu Jari via matchTerms "parvati valley"'
      );

      const spitiMatch = getStaysWhereSuggestions(
        'Spiti',
        CURATED_DESTINATIONS,
        EXISTING_PROPERTIES
      );
      assert.ok(
        spitiMatch.matchingDestinations.some((d) => d.slug === 'spiti-valley'),
        'Should match Spiti Valley by name'
      );
    });

    it('matches genuine published property names and villages without inventing listings', () => {
      const yashMatch = getStaysWhereSuggestions(
        'Yash Home',
        CURATED_DESTINATIONS,
        EXISTING_PROPERTIES
      );
      assert.equal(yashMatch.matchingProperties.length, 1);
      assert.equal(yashMatch.matchingProperties[0].slug, 'yash-home-stay');

      const nonexistentMatch = getStaysWhereSuggestions(
        'Atlantis Resort',
        CURATED_DESTINATIONS,
        EXISTING_PROPERTIES
      );
      assert.equal(nonexistentMatch.matchingProperties.length, 0);
      assert.equal(nonexistentMatch.matchingDestinations.length, 0);
    });
  });

  describe('WHEN — Interactive Range Calendar State & Invalid Check-out Tooltip', () => {
    const todayStr = '2026-12-10';

    it('builds an accurate month grid aligned to weekday columns', () => {
      const cells = buildCalendarMonthGrid(2026, 11); // December 2026
      const validDays = cells.filter((c) => c !== null);
      assert.equal(validDays.length, 31);
      assert.equal(validDays[0]?.dateStr, '2026-12-01');
      assert.equal(validDays[30]?.dateStr, '2026-12-31');
    });

    it('prevents selection of past dates', () => {
      const state = evaluateCalendarDayState('2026-12-05', todayStr, '', '', null);
      assert.equal(state, 'past-disabled');

      const clickResult = handleCalendarDateClick('2026-12-05', todayStr, '', '');
      assert.equal(clickResult.checkIn, '');
      assert.equal(clickResult.checkOut, '');
      assert.equal(clickResult.errorMessage, null);
    });

    it('marks first selected date as check-in-start and previews valid future dates in sage green', () => {
      const firstClick = handleCalendarDateClick('2026-12-15', todayStr, '', '');
      assert.equal(firstClick.checkIn, '2026-12-15');
      assert.equal(firstClick.checkOut, '');

      // Hovering over 2026-12-18 while checkIn is 2026-12-15
      assert.equal(
        evaluateCalendarDayState('2026-12-15', todayStr, '2026-12-15', '', '2026-12-18'),
        'check-in-start'
      );
      assert.equal(
        evaluateCalendarDayState('2026-12-16', todayStr, '2026-12-15', '', '2026-12-18'),
        'in-valid-preview-range'
      );
      assert.equal(
        evaluateCalendarDayState('2026-12-17', todayStr, '2026-12-15', '', '2026-12-18'),
        'in-valid-preview-range'
      );
      assert.equal(
        evaluateCalendarDayState('2026-12-18', todayStr, '2026-12-15', '', '2026-12-18'),
        'valid-preview-end'
      );
    });

    it('shows muted red invalid-range preview when hovering earlier than check-in date', () => {
      assert.equal(
        evaluateCalendarDayState('2026-12-12', todayStr, '2026-12-15', '', '2026-12-12'),
        'invalid-preview-target'
      );
      assert.equal(
        evaluateCalendarDayState('2026-12-13', todayStr, '2026-12-15', '', '2026-12-12'),
        'in-invalid-preview-range'
      );
    });

    it('blocks invalid checkout date click (<= checkIn), displays exact tooltip message, and preserves check-in without restarting', () => {
      const invalidEarlierClick = handleCalendarDateClick(
        '2026-12-12',
        todayStr,
        '2026-12-15',
        ''
      );
      assert.equal(invalidEarlierClick.checkIn, '2026-12-15');
      assert.equal(invalidEarlierClick.checkOut, '');
      assert.equal(invalidEarlierClick.invalidDateClicked, '2026-12-12');
      assert.equal(
        invalidEarlierClick.errorMessage,
        'Please select a check-out date after your check-in date.'
      );
      assert.equal(invalidEarlierClick.errorMessage, INVALID_CHECKOUT_TOOLTIP_MESSAGE);

      const sameDayClick = handleCalendarDateClick(
        '2026-12-15',
        todayStr,
        '2026-12-15',
        ''
      );
      assert.equal(sameDayClick.checkIn, '2026-12-15');
      assert.equal(sameDayClick.checkOut, '');
      assert.equal(
        sameDayClick.errorMessage,
        'Please select a check-out date after your check-in date.'
      );

      // Visitor can immediately pick a valid checkout date without restarting
      const validFollowupClick = handleCalendarDateClick(
        '2026-12-18',
        todayStr,
        invalidEarlierClick.checkIn,
        invalidEarlierClick.checkOut
      );
      assert.equal(validFollowupClick.checkIn, '2026-12-15');
      assert.equal(validFollowupClick.checkOut, '2026-12-18');
      assert.equal(validFollowupClick.occupiedNights, 3);
      assert.equal(validFollowupClick.errorMessage, null);
      assert.equal(validFollowupClick.completedRange, true);
    });

    it('distinguishes checkout date from occupied nights when calculating stay duration', () => {
      const summary = formatStayDateRangeSummary('2026-12-15', '2026-12-18');
      assert.equal(summary.occupiedNights, 3);
      assert.ok(summary.nightsLabel.includes('3 nights'));
    });
  });

  describe('WHO — Adults (18+), Children (2–17 with ages), and Infants (<2)', () => {
    it('keeps infants under 2 separate from adult/child bed occupancy', () => {
      const guestState = validateAndFormatGuests(
        {
          adults: 2,
          children: 0,
          childAges: [],
          infants: 1,
        },
        2
      );
      assert.equal(guestState.totalSeatedGuests, 2);
      assert.equal(guestState.exceedsMaxPropertyCapacity, false);
      assert.equal(guestState.summaryLabel, '2 guests, 1 infant');
    });

    it('maintains individual child ages (2–17 years) and flags when adults + children exceed room capacity', () => {
      const guestState = validateAndFormatGuests(
        {
          adults: 2,
          children: 1,
          childAges: [9],
          infants: 0,
        },
        2
      );
      assert.equal(guestState.totalSeatedGuests, 3);
      assert.deepEqual(guestState.childAges, [9]);
      assert.equal(guestState.exceedsMaxPropertyCapacity, true);
      assert.ok(guestState.capacityWarning?.includes('up to 2 guests'));
    });
  });

  describe('PART 5 — Direct Amenity Chips & Combined Filtering', () => {
    it('derives only chips backed by genuine published property data and approved guest reviews', () => {
      const chips = deriveAvailableAmenityChips(EXISTING_PROPERTIES, EXISTING_REVIEWS);
      const chipIds = chips.map((c) => c.id);

      // Yash Home Stay has 5 approved 5-star reviews -> Guest Favourite
      assert.ok(chipIds.includes('guest-favourite'), 'Should include Guest Favourite chip');
      // Yash Home Stay has Free Wi-Fi and Mountain-view room
      assert.ok(chipIds.includes('wifi'), 'Should include Wi-Fi chip');
      assert.ok(chipIds.includes('mountain-view'), 'Should include Mountain View chip');

      // Yash Home Stay does NOT have TV or Free Parking in its published amenities, so those must not be fabricated
      assert.ok(!chipIds.includes('tv'), 'Should not show TV chip when no published property has TV');
      assert.ok(
        !chipIds.includes('free-parking'),
        'Should not show Free Parking chip when no published property has Free Parking'
      );
    });

    it('filters properties accurately when multiple amenity chips and search criteria are combined', () => {
      const matchingBoth = filterStaysProperties(
        EXISTING_PROPERTIES,
        {
          destinationSlug: 'kullu-jari',
          adults: 2,
          children: 0,
          infants: 1,
          selectedAmenityIds: ['guest-favourite', 'wifi', 'mountain-view'],
        },
        CURATED_DESTINATIONS,
        EXISTING_REVIEWS
      );
      assert.equal(matchingBoth.length, 1);
      assert.equal(matchingBoth[0].slug, 'yash-home-stay');

      // Exceeding max room capacity (3 adults > 2 max_guests) filters out the 2-guest property
      const exceedingCapacity = filterStaysProperties(
        EXISTING_PROPERTIES,
        {
          destinationSlug: 'kullu-jari',
          adults: 3,
          children: 0,
        },
        CURATED_DESTINATIONS,
        EXISTING_REVIEWS
      );
      assert.equal(exceedingCapacity.length, 0);
    });

    it('formats the mobile compact search capsule summary accurately', () => {
      const initialCapsule = formatSearchCapsuleSummary({});
      assert.equal(initialCapsule.fullText, 'Where to? · Any dates · 2 guests');

      const activeCapsule = formatSearchCapsuleSummary({
        destinationLabel: 'Kullu Jari',
        checkIn: '2026-12-15',
        checkOut: '2026-12-18',
        adults: 2,
        children: 0,
        infants: 1,
      });
      assert.ok(activeCapsule.fullText.startsWith('Kullu Jari · '));
      assert.ok(activeCapsule.fullText.endsWith('· 2 guests, 1 infant'));
    });
  });

  describe('Live Room Availability — Booked & Host-Blocked Date Response Messages', () => {
    it('formats date with full month name (e.g. "25 November") and returns professional booked/blocked message', () => {
      assert.equal(formatDateWithMonthName('2026-11-25'), '25 November');
      assert.equal(
        formatUnavailableDateMessage('2026-11-25', 'booked'),
        'The 25 November date you selected is booked. Please try different dates.'
      );
      assert.equal(
        formatUnavailableDateMessage('2026-11-28', 'blocked'),
        'The 28 November date you selected is blocked. Please try different dates.'
      );
      assert.equal(
        formatUnavailableDateMessage('', 'booked'),
        'The date you selected is booked. Please try different dates.'
      );
      assert.equal(
        formatUnavailableDateMessage('', 'blocked'),
        'The date you selected is blocked. Please try different dates.'
      );
    });

    it('detects single-date and date-range overlaps with booked or blocked occupancy intervals', () => {
      const occupancy = [
        {
          room_unit_id: 'room-1',
          start_date: '2026-12-14',
          end_date: '2026-12-16',
          kind: 'booking' as const,
        },
        {
          room_unit_id: 'room-1',
          start_date: '2026-12-20',
          end_date: '2026-12-22',
          kind: 'block' as const,
        },
      ];

      // Direct check-in on a booked date
      const directBooked = findRoomOccupancyConflict({
        checkIn: '2026-12-14',
        checkOut: '',
        occupancy,
        roomUnitId: 'room-1',
      });
      assert.ok(directBooked);
      assert.equal(directBooked.status, 'booked');
      assert.equal(
        directBooked.message,
        'The 14 December date you selected is booked. Please try different dates.'
      );

      // Range overlapping a host-blocked date (Dec 19 -> Dec 23 overlaps Dec 20)
      const rangeBlocked = findRoomOccupancyConflict({
        checkIn: '2026-12-19',
        checkOut: '2026-12-23',
        occupancy,
        roomUnitId: 'room-1',
      });
      assert.ok(rangeBlocked);
      assert.equal(rangeBlocked.status, 'blocked');
      assert.equal(rangeBlocked.conflictDateStr, '2026-12-20');
      assert.equal(
        rangeBlocked.message,
        'The 20 December date you selected is blocked. Please try different dates.'
      );

      // Available range (Dec 16 checkout day of previous booking -> Dec 19) has no conflict
      const availableRange = findRoomOccupancyConflict({
        checkIn: '2026-12-16',
        checkOut: '2026-12-19',
        occupancy,
        roomUnitId: 'room-1',
      });
      assert.equal(availableRange, null);
    });
  });
});

