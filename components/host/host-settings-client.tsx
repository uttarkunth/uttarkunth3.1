'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Shield, Home, ArrowRight } from 'lucide-react';
import { useHostWorkspace } from '@/components/host/host-workspace-shell';
import {
  getPropertyDisplayName,
  getPropertyRooms,
  isPropertyLive,
} from '@/lib/host-dashboard';

export function HostSettingsClient() {
  const { properties, isAdmin, userEmail } = useHostWorkspace();
  const firstProp = properties[0];

  const [contactEmail, setContactEmail] = useState(
    firstProp?.contact_email || userEmail || ''
  );
  const [contactPhone, setContactPhone] = useState(
    firstProp?.contact_phone || firstProp?.contact_whatsapp || '+91 '
  );
  const [bookingNotifications, setBookingNotifications] = useState('email-whatsapp');
  const [checkinWindow, setCheckinWindow] = useState('12:00 PM – 7:00 PM');
  const [savedNotice, setSavedNotice] = useState(false);

  const totalRooms = properties.reduce(
    (sum, p) => sum + getPropertyRooms(p).length,
    0
  );
  const publishedCount = properties.filter(isPropertyLive).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  return (
    <div className="space-y-4" data-testid="host-settings-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#665E52]">
            <span>Host Workspace</span>
            <span>/</span>
            <span>Account &amp; Support</span>
            <span>/</span>
            <strong className="text-[#263D32]">Host Settings</strong>
          </div>
          <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#29251F] leading-tight mt-0.5">
            Host Settings
          </h1>
          <p className="text-[13px] text-[#665E52] mt-0.5">
            Manage host contact preferences, booking alert settings and workspace access.
          </p>
        </div>
      </div>

      {savedNotice && (
        <div
          role="status"
          className="p-3 rounded-[12px] bg-[#E8F4EC] border border-[#1F6A3B]/25 text-[#194E2C] text-xs font-bold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#1F6A3B] shrink-0" />
          <span>Host contact and notification preferences updated.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Contact & Notification Preferences */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#29251F]">
                Contact &amp; Notification Preferences
              </h2>
              <p className="text-xs text-[#665E52]">
                Used when guests submit booking requests or need arrival guidance
              </p>
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-[10px] bg-[#263D32] hover:bg-[#1A2B23] text-[#FFFDF9] text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Save changes
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-[#665E52]">Host account email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-medium text-[#29251F] focus:outline-none focus:border-[#263D32]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-[#665E52]">
                Primary phone / WhatsApp
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-medium text-[#29251F] focus:outline-none focus:border-[#263D32]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-[#665E52]">
                Booking request notifications
              </label>
              <select
                value={bookingNotifications}
                onChange={(e) => setBookingNotifications(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-bold text-[#29251F] focus:outline-none focus:border-[#263D32]"
              >
                <option value="email-whatsapp">Email and WhatsApp prompt</option>
                <option value="email-only">Email notifications only</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-[#665E52]">
                Standard check-in guidance window
              </label>
              <input
                type="text"
                value={checkinWindow}
                onChange={(e) => setCheckinWindow(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-medium text-[#29251F] focus:outline-none focus:border-[#263D32]"
              />
            </div>
          </div>

          {firstProp && (
            <div className="pt-3 border-t border-[#E5DEC9] flex items-center justify-between gap-2 text-xs">
              <span className="text-[#665E52]">
                Need to update individual property phone numbers or house rules?
              </span>
              <Link
                href={`/account/stays/host/properties/${firstProp.id}`}
                className="inline-flex items-center gap-1 font-bold text-[#263D32] hover:text-[#C55B23] shrink-0"
              >
                <span>Edit {getPropertyDisplayName(firstProp)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </form>

        {/* Workspace Access & Role */}
        <section className="lg:col-span-5 p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-3">
          <div>
            <h2 className="text-[15px] font-extrabold text-[#29251F]">
              Workspace Access &amp; Role
            </h2>
            <p className="text-xs text-[#665E52]">
              Permissions for your assigned properties
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-[12px] bg-[#F5F0E6]/75 border border-[#E5DEC9] space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#665E52] block">
                Assigned role
              </span>
              <strong className="text-sm font-extrabold text-[#29251F] flex items-center gap-1.5">
                {isAdmin ? (
                  <>
                    <Shield className="w-4 h-4 text-[#C55B23]" />
                    <span>Platform Supervisor · Full host &amp; availability permissions</span>
                  </>
                ) : (
                  <>
                    <Home className="w-4 h-4 text-[#263D32]" />
                    <span>Property Owner / Manager · Full host permissions</span>
                  </>
                )}
              </strong>
            </div>

            <div className="p-3 rounded-[12px] bg-[#F5F0E6]/75 border border-[#E5DEC9] space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#665E52] block">
                Assigned properties
              </span>
              <strong className="text-sm font-extrabold text-[#29251F]">
                {properties.length} {properties.length === 1 ? 'property' : 'properties'} (
                {publishedCount} published) · {totalRooms} room{' '}
                {totalRooms === 1 ? 'unit' : 'units'}
              </strong>
            </div>

            <div className="p-3 rounded-[12px] bg-[#F5F0E6]/75 border border-[#E5DEC9] space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#665E52] block">
                Host partnership terms
              </span>
              <strong className="text-sm font-extrabold text-[#1F6A3B]">
                Direct payment to host at the property
              </strong>
              <p className="text-[11px] text-[#665E52] pt-0.5">
                Commission terms remain subject to formal bilateral host agreement acceptance.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
