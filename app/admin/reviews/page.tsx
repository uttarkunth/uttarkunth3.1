import React from 'react';
import { AdminNav } from '@/components/admin-nav';
import { requireStaffPermission } from '@/lib/staff-rbac';
import { Star, ShieldCheck, CheckCircle2, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const auth = await requireStaffPermission('property.review', { requireMfaAal2: false });
  const finalAuth = !auth.authorized
    ? await requireStaffPermission('community.moderate', { requireMfaAal2: false })
    : auth;

  if (!finalAuth.authorized || !finalAuth.user) {
    return (
      <div className="pb-16 bg-ivory min-h-screen">
        <AdminNav />
        <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-forest">Access Restricted</h1>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Review and feedback moderation requires explicit &apos;property.review&apos; or &apos;community.moderate&apos; staff authority.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 bg-ivory">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Review Moderation</span>
          <h1 className="font-serif text-3xl font-bold text-forest mt-1">Guest Reviews & Ratings Policy</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Verified guest reviews. Per platform integrity rules, only guests with completed stays may submit reviews. No fabricated ratings.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="p-5 bg-ivory-warm rounded-2xl border border-forest/10 flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-forest flex-shrink-0 mt-0.5" />
            <div className="text-xs text-charcoal leading-relaxed space-y-1">
              <strong className="text-forest text-sm block">Strict Review Integrity Policy:</strong>
              <p>
                Uttarkunth Stays maintains 100% genuine feedback. Reviews can only be submitted after a confirmed booking&apos;s check-out date has passed.
              </p>
              <p className="text-charcoal-muted">
                No mock reviews or inflated ratings are displayed anywhere on the platform.
              </p>
            </div>
          </div>

          <div className="py-8 text-center text-xs text-charcoal-muted">
            No pending guest reviews awaiting moderation at this time.
          </div>
        </div>
      </div>
    </div>
  );
}
