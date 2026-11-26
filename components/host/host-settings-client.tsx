'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, User, Bell, Shield, ArrowRight } from 'lucide-react';
import { useHostWorkspace } from '@/components/host/host-workspace-shell';
import { getPropertyDisplayName } from '@/lib/host-dashboard';

export function HostSettingsClient() {
  const { properties, isAdmin, userEmail } = useHostWorkspace();
  const firstProp = properties[0];

  const [displayName, setDisplayName] = useState('Host account');
  const [contactEmail, setContactEmail] = useState(
    firstProp?.contact_email || userEmail || ''
  );
  const [contactPhone, setContactPhone] = useState(
    firstProp?.contact_phone || firstProp?.contact_whatsapp || '+91 '
  );

  // Interactive Notification Toggles matching V2 Prototype
  const [notifyNewBookings, setNotifyNewBookings] = useState(true);
  const [notifyStatusChanges, setNotifyStatusChanges] = useState(true);
  const [notifyGuestReviews, setNotifyGuestReviews] = useState(true);
  const [notifyPlatformUpdates, setNotifyPlatformUpdates] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Host contact and notification preferences updated.');
  };

  const assignedPropertyNames =
    properties.map((p) => getPropertyDisplayName(p)).join(', ') || 'None assigned';

  return (
    <div className="space-y-4" data-testid="host-settings-view">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#948B7E] mb-3">
          <span>Host workspace</span>
          <span>&rsaquo;</span>
          <span className="text-[#263D32]">Host settings</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.16em] font-extrabold text-[#C55B23] mb-1">
          Account &amp; preferences
        </div>
        <h1 className="font-serif text-[32px] sm:text-[36px] font-semibold text-[#263D32] leading-tight">
          Host settings
        </h1>
        <p className="text-xs text-[#71695E] mt-1">
          Manage how you receive host updates and keep your contact details current.
        </p>
      </div>

      {toastMessage && (
        <div
          role="status"
          className="p-3 rounded-[12px] bg-[#1A2B23] text-[#FFFDF9] text-xs font-bold flex items-center gap-2 shadow-md"
        >
          <CheckCircle2 className="w-4 h-4 text-[#77BD8F] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4-Panel 2x2 Settings Grid matching V2 Prototype */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* 1. Host Contact Information */}
        <form
          onSubmit={handleSave}
          className="p-4 sm:p-5 rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] space-y-3.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-[#263D32]">
                Host contact information
              </h2>
              <p className="text-[11px] text-[#948B7E]">
                Used for booking communication and account notices
              </p>
            </div>
            <User className="w-4 h-4 text-[#C55B23] shrink-0" />
          </div>

          <div className="space-y-3 text-xs">
            <label className="block text-[#71695E] font-bold">
              Display name
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#263D32]/15 text-xs font-bold text-[#263D32] focus:outline-none focus:border-[#263D32]"
              />
            </label>

            <label className="block text-[#71695E] font-bold">
              Email address
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#263D32]/15 text-xs font-bold text-[#263D32] focus:outline-none focus:border-[#263D32]"
              />
            </label>

            <label className="block text-[#71695E] font-bold">
              Phone number
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#263D32]/15 text-xs font-bold text-[#263D32] focus:outline-none focus:border-[#263D32]"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {firstProp ? (
              <Link
                href={`/account/stays/host/properties/${firstProp.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#C55B23] hover:text-[#263D32]"
              >
                <span>Edit property contact details</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="px-4 py-2 rounded-[11px] bg-[#263D32] hover:bg-[#1A2B23] text-[#FFFDF9] text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
            >
              Save changes
            </button>
          </div>
        </form>

        {/* 2. Notifications */}
        <section className="p-4 sm:p-5 rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] space-y-2">
          <div className="flex items-start justify-between gap-2 pb-2">
            <div>
              <h2 className="text-sm font-extrabold text-[#263D32]">Notifications</h2>
              <p className="text-[11px] text-[#948B7E]">
                Choose which updates you would like to receive
              </p>
            </div>
            <Bell className="w-4 h-4 text-[#C55B23] shrink-0" />
          </div>

          <div className="divide-y divide-[#263D32]/10 text-xs">
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-[#263D32]">New booking requests</div>
                <div className="text-[11px] text-[#948B7E]">
                  When a guest sends a new request.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifyNewBookings}
                aria-label="Toggle new booking notifications"
                onClick={() => {
                  setNotifyNewBookings((v) => !v);
                  showToast('Booking request alert preference updated.');
                }}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  notifyNewBookings ? 'bg-[#263D32]' : 'bg-[#D9D2C7]'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    notifyNewBookings ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-[#263D32]">Booking status changes</div>
                <div className="text-[11px] text-[#948B7E]">
                  When a booking is confirmed or cancelled.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifyStatusChanges}
                aria-label="Toggle booking status notifications"
                onClick={() => {
                  setNotifyStatusChanges((v) => !v);
                  showToast('Booking status alert preference updated.');
                }}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  notifyStatusChanges ? 'bg-[#263D32]' : 'bg-[#D9D2C7]'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    notifyStatusChanges ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-[#263D32]">Guest reviews</div>
                <div className="text-[11px] text-[#948B7E]">
                  When a new review is published.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifyGuestReviews}
                aria-label="Toggle review notifications"
                onClick={() => {
                  setNotifyGuestReviews((v) => !v);
                  showToast('Guest review alert preference updated.');
                }}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  notifyGuestReviews ? 'bg-[#263D32]' : 'bg-[#D9D2C7]'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    notifyGuestReviews ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-[#263D32]">Platform updates</div>
                <div className="text-[11px] text-[#948B7E]">
                  Important host policy and service updates.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifyPlatformUpdates}
                aria-label="Toggle platform update notifications"
                onClick={() => {
                  setNotifyPlatformUpdates((v) => !v);
                  showToast('Platform update alert preference saved.');
                }}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  notifyPlatformUpdates ? 'bg-[#263D32]' : 'bg-[#D9D2C7]'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    notifyPlatformUpdates ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 3. Workspace Access */}
        <section className="p-4 sm:p-5 rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] space-y-2">
          <div className="pb-1">
            <h2 className="text-sm font-extrabold text-[#263D32]">Workspace access</h2>
            <p className="text-[11px] text-[#948B7E]">
              Your current role and property access
            </p>
          </div>

          <div className="divide-y divide-[#263D32]/10 text-xs">
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-[#263D32]">Host role</div>
                <div className="text-[11px] text-[#948B7E]">
                  {isAdmin ? 'Platform supervisor' : 'Property owner'}
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EAF4ED] text-[#28734D]">
                Active
              </span>
            </div>

            <div className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-extrabold text-[#263D32]">Assigned properties</div>
                <div className="text-[11px] text-[#948B7E] truncate">
                  {assignedPropertyNames}
                </div>
              </div>
              <strong className="text-sm font-extrabold text-[#263D32] tabular-nums shrink-0">
                {String(properties.length).padStart(2, '0')}
              </strong>
            </div>

            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-[#263D32]">Security</div>
                <div className="text-[11px] text-[#948B7E]">
                  Account authentication is managed by Uttarkunth.
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EAF4ED] text-[#28734D] inline-flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Protected
              </span>
            </div>
          </div>
        </section>

        {/* 4. Host Partnership */}
        <section className="p-4 sm:p-5 rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] space-y-2">
          <div className="pb-1">
            <h2 className="text-sm font-extrabold text-[#263D32]">Host partnership</h2>
            <p className="text-[11px] text-[#948B7E]">Important operating information</p>
          </div>

          <div className="divide-y divide-[#263D32]/10 text-xs">
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-[#263D32]">Guest payment method</div>
                <div className="text-[11px] text-[#948B7E]">
                  Direct payment to host at the property
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EAF4ED] text-[#28734D]">
                Current model
              </span>
            </div>

            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-[#263D32]">Commission agreement</div>
                <div className="text-[11px] text-[#948B7E]">
                  Only applies if a separate agreement is formally active.
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F0EEE9] text-[#6E675C]">
                Check agreement
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
