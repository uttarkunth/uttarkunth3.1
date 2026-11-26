'use client';

import React from 'react';
import Link from 'next/link';
import { Inbox, Home, CalendarDays, HelpCircle, ArrowRight } from 'lucide-react';

export function HostSupportClient() {
  return (
    <div className="space-y-4" data-testid="host-support-view">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#665E52]">
          <span>Host Workspace</span>
          <span>/</span>
          <span>Account &amp; Support</span>
          <span>/</span>
          <strong className="text-[#263D32]">Help &amp; Support</strong>
        </div>
        <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#29251F] leading-tight mt-0.5">
          Help &amp; Support
        </h1>
        <p className="text-[13px] text-[#665E52] mt-0.5">
          Guidance for booking decisions, room availability and property updates.
        </p>
      </div>

      {/* 3 Support Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#FDF3E1] text-[#C55B23] flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
            <h2 className="text-[15px] font-extrabold text-[#29251F]">Booking assistance</h2>
            <p className="text-xs text-[#665E52] leading-relaxed">
              Need help coordinating guest arrival times, road conditions or special requests?
            </p>
          </div>
          <Link
            href="/account/stays/host/bookings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-xs font-bold text-[#29251F] self-start transition-colors"
          >
            <span>Go to Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F4EC] text-[#1F6A3B] flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
            <h2 className="text-[15px] font-extrabold text-[#29251F]">
              Property &amp; listing help
            </h2>
            <p className="text-xs text-[#665E52] leading-relaxed">
              Update room capacities, nightly prices, photos or apply to onboard a new homestay.
            </p>
          </div>
          <Link
            href="/account/stays/host/properties"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-xs font-bold text-[#29251F] self-start transition-colors"
          >
            <span>Manage Properties</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#EAE7E0] text-[#263D32] flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h2 className="text-[15px] font-extrabold text-[#29251F]">
              Calendar &amp; availability
            </h2>
            <p className="text-xs text-[#665E52] leading-relaxed">
              Use manual blocks for seasonal closures, maintenance or family stays.
            </p>
          </div>
          <Link
            href="/account/stays/host/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-xs font-bold text-[#29251F] self-start transition-colors"
          >
            <span>Open Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Frequently Asked Host Questions */}
      <section className="p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#C55B23]" />
          <div>
            <h2 className="text-[15px] font-extrabold text-[#29251F]">
              Frequently Asked Host Questions
            </h2>
            <p className="text-xs text-[#665E52]">
              Essential rules of the Uttarkunth Stays hosting model
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <details
            open
            className="p-3.5 rounded-[12px] bg-[#F5F0E6]/75 border border-[#E5DEC9] group"
          >
            <summary className="font-extrabold text-[13px] text-[#29251F] cursor-pointer">
              Why do pending booking requests not block dates?
            </summary>
            <p className="mt-2 text-[#665E52] leading-relaxed">
              Bookings on Uttarkunth are request-based. Pending requests remain open so your calendar is never locked by unconfirmed enquiries. Once you accept a request, the dates are locked for that room unit.
            </p>
          </details>

          <details className="p-3.5 rounded-[12px] bg-[#F5F0E6]/75 border border-[#E5DEC9] group">
            <summary className="font-extrabold text-[13px] text-[#29251F] cursor-pointer">
              How do guests pay for their stay?
            </summary>
            <p className="mt-2 text-[#665E52] leading-relaxed">
              Guests pay you directly at your property. Uttarkunth does not process online stay payments or hold a host wallet balance.
            </p>
          </details>

          <details className="p-3.5 rounded-[12px] bg-[#F5F0E6]/75 border border-[#E5DEC9] group">
            <summary className="font-extrabold text-[13px] text-[#29251F] cursor-pointer">
              When should I use a manual availability block?
            </summary>
            <p className="mt-2 text-[#665E52] leading-relaxed">
              Use a manual availability block whenever a room is unavailable due to maintenance, weather closures or personal use. Manual blocks cannot overlap confirmed reservations.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
