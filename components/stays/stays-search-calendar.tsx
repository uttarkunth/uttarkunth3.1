'use client';

import React, { useState, useMemo } from 'react';
import {
  buildCalendarMonthGrid,
  evaluateCalendarDayState,
  handleCalendarDateClick,
  formatStayDateRangeSummary,
  formatShortStayDate,
  CalendarDayVisualState,
} from '@/lib/stays-search';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, RotateCcw } from 'lucide-react';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
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

export interface StaysSearchCalendarProps {
  checkIn: string;
  checkOut: string;
  todayStr: string;
  onChangeDates: (nextCheckIn: string, nextCheckOut: string) => void;
  singleMonth?: boolean;
}

export function StaysSearchCalendar({
  checkIn,
  checkOut,
  todayStr,
  onChangeDates,
  singleMonth = false,
}: StaysSearchCalendarProps) {
  const initialBaseDate = useMemo(() => {
    const source = checkIn || todayStr;
    const parts = source.split('-').map(Number);
    if (parts.length === 3 && !parts.some((n) => Number.isNaN(n))) {
      return { year: parts[0], month: parts[1] - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [checkIn, todayStr]);

  const [viewYear, setViewYear] = useState(initialBaseDate.year);
  const [viewMonth, setViewMonth] = useState(initialBaseDate.month);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [invalidTooltip, setInvalidTooltip] = useState<{
    dateStr: string;
    message: string;
  } | null>(null);

  const todayParts = useMemo(() => {
    const parts = todayStr.split('-').map(Number);
    return {
      year: parts[0] || new Date().getFullYear(),
      month: (parts[1] || 1) - 1,
    };
  }, [todayStr]);

  const isAtMinMonth =
    viewYear < todayParts.year ||
    (viewYear === todayParts.year && viewMonth <= todayParts.month);

  const handlePrevMonth = () => {
    if (isAtMinMonth) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const secondMonthMeta = useMemo(() => {
    if (viewMonth === 11) {
      return { year: viewYear + 1, month: 0 };
    }
    return { year: viewYear, month: viewMonth + 1 };
  }, [viewYear, viewMonth]);

  const monthsToRender = useMemo(() => {
    if (singleMonth) {
      return [{ year: viewYear, month: viewMonth }];
    }
    return [
      { year: viewYear, month: viewMonth },
      { year: secondMonthMeta.year, month: secondMonthMeta.month },
    ];
  }, [singleMonth, viewYear, viewMonth, secondMonthMeta]);

  const dateSummary = useMemo(
    () => formatStayDateRangeSummary(checkIn, checkOut),
    [checkIn, checkOut]
  );

  const onDayClick = (dateStr: string) => {
    const outcome = handleCalendarDateClick(dateStr, todayStr, checkIn, checkOut);
    if (outcome.errorMessage && outcome.invalidDateClicked) {
      setInvalidTooltip({
        dateStr: outcome.invalidDateClicked,
        message: outcome.errorMessage,
      });
      return;
    }

    setInvalidTooltip(null);
    setHoverDate(null);
    onChangeDates(outcome.checkIn, outcome.checkOut);
  };

  const handleResetDates = () => {
    setInvalidTooltip(null);
    setHoverDate(null);
    onChangeDates('', '');
  };

  const hasContinuousRange = Boolean(
    (checkIn && checkOut) ||
      (checkIn && !checkOut && hoverDate && hoverDate !== checkIn && hoverDate >= todayStr)
  );

  return (
    <div
      data-testid="stays-search-calendar"
      className="space-y-4 select-none"
      onMouseLeave={() => setHoverDate(null)}
    >
      {/* Top Check-in / Check-out & Nights Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D9CCB8]/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F0E6] border border-[#D9CCB8] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4 text-[#263D32]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[#5C5549]">
                {!checkIn
                  ? 'Select Check-in Date'
                  : !checkOut
                  ? 'Select Check-out Date'
                  : 'Selected Stay Dates'}
              </span>
              {dateSummary.occupiedNights > 0 && (
                <span
                  data-testid="stays-calendar-nights-badge"
                  className="font-sans inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#263D32] text-[#FFFDF9]"
                >
                  {dateSummary.occupiedNights}{' '}
                  {dateSummary.occupiedNights === 1 ? 'night' : 'nights'}
                </span>
              )}
            </div>
            <p
              data-testid="stays-calendar-summary-text"
              className="font-sans text-sm font-semibold text-[#29251F] mt-0.5"
            >
              {checkIn ? (
                <>
                  <span>Check-in: {formatShortStayDate(checkIn)}</span>
                  <span className="mx-2 text-[#5C5549]">→</span>
                  <span>
                    Check-out:{' '}
                    {checkOut ? formatShortStayDate(checkOut) : 'Choose a date after check-in'}
                  </span>
                </>
              ) : (
                'Choose your check-in and check-out dates'
              )}
            </p>
          </div>
        </div>

        {(checkIn || checkOut) && (
          <button
            type="button"
            data-testid="stays-calendar-reset-dates"
            onClick={handleResetDates}
            className="font-sans inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold text-[#29251F] bg-[#F5F0E6] hover:bg-[#EAE2D3] border border-[#D9CCB8] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#5C5549]" />
            <span>Reset dates</span>
          </button>
        )}
      </div>

      {/* Contextual Invalid Check-out Tooltip Banner (also anchored near clicked cell) */}
      {invalidTooltip && (
        <div
          role="alert"
          data-testid="stays-calendar-invalid-tooltip"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#FDF2F1] border border-[#E6B8B3] text-[#8F281E] text-xs font-sans font-semibold shadow-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-[#A63228]" />
          <span>{invalidTooltip.message}</span>
        </div>
      )}

      {/* Month Navigation Controls + Grids */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            data-testid="stays-calendar-prev-month"
            onClick={handlePrevMonth}
            disabled={isAtMinMonth}
            aria-label="Previous month"
            className="w-11 h-11 rounded-xl border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            className={`flex-1 grid ${
              singleMonth ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
            } gap-6 text-center`}
          >
            {monthsToRender.map((m, idx) => (
              <div
                key={`${m.year}-${m.month}`}
                className={idx === 1 ? 'hidden lg:block' : 'block'}
              >
                <span className="font-serif text-lg sm:text-xl font-semibold text-[#29251F]">
                  {MONTH_NAMES[m.month]} {m.year}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            data-testid="stays-calendar-next-month"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="w-11 h-11 rounded-xl border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Month (Mobile) or 2-Month Side-by-Side (Desktop) Grids */}
        <div
          className={`grid ${
            singleMonth ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
          } gap-6`}
        >
          {monthsToRender.map((m, monthIdx) => {
            const cells = buildCalendarMonthGrid(m.year, m.month);

            return (
              <div
                key={`grid-${m.year}-${m.month}`}
                className={monthIdx === 1 ? 'hidden lg:block space-y-2' : 'block space-y-2'}
              >
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-0 text-center pb-1">
                  {WEEKDAY_LABELS.map((day) => (
                    <span
                      key={day}
                      className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#5C5549] py-1"
                    >
                      {day}
                    </span>
                  ))}
                </div>

                {/* Days Grid — zero horizontal gap so range highlights connect seamlessly */}
                <div className="grid grid-cols-7 gap-x-0 gap-y-1.5" role="grid">
                  {cells.map((cell, cellIdx) => {
                    if (!cell) {
                      return <div key={`empty-${cellIdx}`} className="h-11" />;
                    }

                    const state: CalendarDayVisualState = evaluateCalendarDayState(
                      cell.dateStr,
                      todayStr,
                      checkIn,
                      checkOut,
                      hoverDate
                    );

                    const isPast = state === 'past-disabled';
                    const isInvalidClickedCell =
                      invalidTooltip?.dateStr === cell.dateStr;

                    // Outer track background for continuous range strip without gaps
                    let trackBgClass = '';
                    if (hasContinuousRange) {
                      if (state === 'check-in-start') {
                        const hasRightRange =
                          Boolean(checkOut && checkOut > checkIn) ||
                          Boolean(!checkOut && hoverDate && hoverDate > checkIn);
                        const hasLeftInvalidRange = Boolean(
                          !checkOut &&
                            hoverDate &&
                            hoverDate < checkIn &&
                            hoverDate >= todayStr
                        );
                        if (hasRightRange) {
                          trackBgClass =
                            'bg-gradient-to-r from-transparent from-50% to-[#E3ECE6] to-50%';
                        } else if (hasLeftInvalidRange) {
                          trackBgClass =
                            'bg-gradient-to-l from-transparent from-50% to-[#FDF2F1] to-50%';
                        }
                      } else if (state === 'check-out-end' || state === 'valid-preview-end') {
                        trackBgClass =
                          'bg-gradient-to-l from-transparent from-50% to-[#E3ECE6] to-50%';
                      } else if (
                        state === 'in-selected-range' ||
                        state === 'in-valid-preview-range'
                      ) {
                        trackBgClass = 'bg-[#E3ECE6]';
                      } else if (state === 'in-invalid-preview-range') {
                        trackBgClass = 'bg-[#FDF2F1]';
                      } else if (state === 'invalid-preview-target') {
                        trackBgClass =
                          'bg-gradient-to-r from-transparent from-50% to-[#FDF2F1] to-50%';
                      }
                    }

                    // Inner button pill styling
                    let buttonStyleClass =
                      'text-[#29251F] hover:bg-[#F5F0E6] hover:border hover:border-[#263D32]/40 rounded-full';

                    if (isPast) {
                      buttonStyleClass =
                        'text-[#5C5549]/35 opacity-45 cursor-not-allowed rounded-full';
                    } else if (state === 'check-in-start') {
                      buttonStyleClass =
                        'bg-[#263D32] text-[#FFFDF9] font-bold shadow-sm rounded-full ring-2 ring-[#263D32]/20';
                    } else if (state === 'check-out-end') {
                      buttonStyleClass =
                        'bg-[#263D32] text-[#FFFDF9] font-bold shadow-sm rounded-full ring-2 ring-[#263D32]/20';
                    } else if (state === 'valid-preview-end') {
                      buttonStyleClass =
                        'bg-[#345244] text-[#FFFDF9] font-bold shadow-sm rounded-full';
                    } else if (
                      state === 'in-selected-range' ||
                      state === 'in-valid-preview-range'
                    ) {
                      buttonStyleClass =
                        'bg-[#E3ECE6] text-[#1F332A] font-semibold rounded-none';
                    } else if (state === 'invalid-preview-target') {
                      buttonStyleClass =
                        'bg-[#F9DEDC] text-[#8F281E] border border-[#D47A72] font-semibold rounded-full';
                    } else if (state === 'in-invalid-preview-range') {
                      buttonStyleClass =
                        'bg-[#FDF2F1] text-[#A63228] font-medium rounded-none';
                    } else if (state === 'today') {
                      buttonStyleClass =
                        'text-[#263D32] font-bold border border-[#263D32] rounded-full hover:bg-[#E3ECE6]/60';
                    }

                    return (
                      <div
                        key={cell.dateStr}
                        className={`relative flex items-center justify-center h-11 ${trackBgClass}`}
                      >
                        <button
                          type="button"
                          disabled={isPast}
                          data-testid={`calendar-day-${cell.dateStr}`}
                          data-state={state}
                          aria-label={`${cell.dateStr}${
                            state === 'check-in-start'
                              ? ' (Check-in)'
                              : state === 'check-out-end'
                              ? ' (Check-out)'
                              : ''
                          }`}
                          aria-pressed={
                            state === 'check-in-start' || state === 'check-out-end'
                          }
                          onMouseEnter={() => {
                            if (!isPast) setHoverDate(cell.dateStr);
                          }}
                          onFocus={() => {
                            if (!isPast) setHoverDate(cell.dateStr);
                          }}
                          onClick={() => onDayClick(cell.dateStr)}
                          className={`relative z-10 w-11 h-11 flex items-center justify-center font-sans text-xs sm:text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263D32] ${buttonStyleClass} ${
                            !isPast ? 'cursor-pointer' : ''
                          }`}
                        >
                          <span>{cell.dayOfMonth}</span>
                        </button>

                        {/* Floating contextual tooltip directly above the clicked invalid date */}
                        {isInvalidClickedCell && invalidTooltip && (
                          <div
                            role="tooltip"
                            className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap px-3 py-1.5 rounded-lg bg-[#29251F] text-[#FFFDF9] font-sans text-[11px] font-semibold shadow-lg"
                          >
                            {invalidTooltip.message}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
