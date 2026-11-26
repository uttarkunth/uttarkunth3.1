'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  MapPin,
  Eye,
  Edit,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Shield,
  Home,
} from 'lucide-react';
import { useHostWorkspace } from '@/components/host/host-workspace-shell';
import {
  computeListingQualityChecklist,
  formatInrCurrency,
  getPropertyCoverPhoto,
  getPropertyDisplayName,
  getPropertyPhotosCount,
  getPropertyRooms,
  getPropertyStartingRate,
  isPropertyLive,
  type HostPropertyRecord,
} from '@/lib/host-dashboard';

interface PropertiesCatalogClientProps {
  initialProperties: HostPropertyRecord[];
  isAdmin: boolean;
}

export function PropertiesCatalogClient({
  initialProperties,
  isAdmin,
}: PropertiesCatalogClientProps) {
  const { selectedPropertyId, setSelectedPropertyId } = useHostWorkspace();
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'review' | 'draft'>('all');

  const filteredProperties = useMemo(() => {
    const byProp =
      selectedPropertyId === 'all'
        ? initialProperties
        : initialProperties.filter((p) => p.id === selectedPropertyId);

    return byProp.filter((p) => {
      const live = isPropertyLive(p);
      const modStatus = (p.moderation_status || p.approval_status || '').toLowerCase();
      if (statusFilter === 'published') return live;
      if (statusFilter === 'review') return modStatus === 'pending' || modStatus === 'under_review';
      if (statusFilter === 'draft') return !live;
      return true;
    });
  }, [initialProperties, selectedPropertyId, statusFilter]);

  const checklist = useMemo(
    () => computeListingQualityChecklist(initialProperties, selectedPropertyId),
    [initialProperties, selectedPropertyId]
  );

  return (
    <div className="space-y-4" data-testid="host-properties-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#665E52]">
            <span>Host Workspace</span>
            <span>/</span>
            <span>Property Workspace</span>
            <span>/</span>
            <strong className="text-[#263D32]">My Properties</strong>
            {isAdmin && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-[#C55B23]/15 text-[#A84C1C] border border-[#C55B23]/25 inline-flex items-center gap-1">
                <Shield className="w-3 h-3" /> All Listings View
              </span>
            )}
          </div>
          <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#29251F] leading-tight mt-0.5">
            My Properties
          </h1>
          <p className="text-[13px] text-[#665E52] mt-0.5">
            Manage room units, nightly prices, photos, amenities and public listing details.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedPropertyId !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedPropertyId('all')}
              className="px-3 py-2 rounded-[10px] bg-[#FFFDF9] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-xs font-bold text-[#29251F] cursor-pointer"
            >
              Show all ({initialProperties.length})
            </button>
          )}

          <select
            aria-label="Filter properties by listing status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-bold text-[#29251F] focus:outline-none focus:border-[#263D32] cursor-pointer"
          >
            <option value="all">All listing statuses</option>
            <option value="published">Published</option>
            <option value="review">Under review</option>
            <option value="draft">Draft</option>
          </select>

          <Link
            href="/stays/partner"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] bg-[#263D32] hover:bg-[#1A2B23] text-[#FFFDF9] text-xs font-bold shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#E57C44]" />
            <span>Apply for a property</span>
          </Link>
        </div>
      </div>

      {/* Direct Guest Payment Model Notice */}
      <div className="p-3.5 rounded-[14px] bg-[#E8F4EC] border border-[#1F6A3B]/20 text-[#194E2C] flex items-start gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-[#FFFDF9]/75 flex items-center justify-center text-[#1F6A3B] shrink-0 font-bold">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs leading-relaxed">
          <strong className="block text-[13px] font-extrabold text-[#194E2C]">
            Direct Guest Payment Model
          </strong>
          <span>
            Nightly rates shown on your public listing are paid directly to you by guests at the property.
          </span>
        </div>
      </div>

      {/* Property Cards Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredProperties.map((p) => {
            const title = getPropertyDisplayName(p);
            const photoUrl = getPropertyCoverPhoto(p);
            const rooms = getPropertyRooms(p);
            const photosCount = getPropertyPhotosCount(p);
            const startingRate = getPropertyStartingRate(p);
            const live = isPropertyLive(p);
            const modStatus = p.moderation_status || p.approval_status || 'approved';
            const propType = p.property_type || p.type || 'Homestay';

            return (
              <article
                key={p.id}
                className="rounded-[15px] overflow-hidden bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between"
              >
                <div className="relative h-[184px] w-full bg-[#263D32]/15">
                  <img
                    src={photoUrl}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101A15]/60 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-xs ${
                        modStatus === 'approved'
                          ? 'bg-[#E8F4EC] text-[#1F6A3B]'
                          : 'bg-[#FDF3E1] text-[#9A6216]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {modStatus} · {live ? 'Live' : 'Draft'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-[#FFFDF9]/95 text-[#29251F] shadow-xs">
                      {propType}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3.5">
                  <div className="space-y-1.5">
                    <h2 className="font-serif text-[22px] font-bold text-[#29251F] leading-snug">
                      {title}
                    </h2>
                    <p className="text-xs font-semibold text-[#665E52] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C55B23] shrink-0" />
                      <span>
                        {[p.village, p.district, p.state].filter(Boolean).join(', ') ||
                          'Uttarakhand'}
                      </span>
                    </p>
                    <p className="text-xs text-[#665E52] line-clamp-2 leading-relaxed">
                      {p.description ||
                        p.short_description ||
                        'Authentic Himalayan stay configured for direct guest booking requests.'}
                    </p>
                  </div>

                  {/* 3-Column Metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-[10px] bg-[#F5F0E6]/80 border border-[#E5DEC9]">
                      <strong className="block text-sm font-extrabold text-[#29251F] tabular-nums">
                        {rooms.length}
                      </strong>
                      <span className="text-[11px] text-[#665E52]">Room units</span>
                    </div>
                    <div className="p-2.5 rounded-[10px] bg-[#F5F0E6]/80 border border-[#E5DEC9]">
                      <strong className="block text-sm font-extrabold text-[#29251F] tabular-nums">
                        {photosCount}
                      </strong>
                      <span className="text-[11px] text-[#665E52]">Photos</span>
                    </div>
                    <div className="p-2.5 rounded-[10px] bg-[#F5F0E6]/80 border border-[#E5DEC9]">
                      <strong className="block text-sm font-extrabold text-[#263D32] tabular-nums">
                        {startingRate > 0 ? formatInrCurrency(startingRate) : '—'}
                      </strong>
                      <span className="text-[11px] text-[#665E52]">Starting / night</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2.5 border-t border-[#E5DEC9] flex items-center justify-between gap-2 flex-wrap">
                    <Link
                      href={`/stays/${p.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-xs font-bold text-[#29251F] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#263D32]" />
                      <span>Public preview</span>
                    </Link>

                    <Link
                      href={`/account/stays/host/properties/${p.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#263D32] hover:bg-[#1A2B23] text-[#FFFDF9] text-xs font-bold shadow-xs transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#E57C44]" />
                      <span>Manage property</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-10 rounded-[15px] bg-[#FFFDF9] border border-[#D9CCB8] text-center space-y-2">
          <Home className="w-7 h-7 text-[#665E52] mx-auto" />
          <h2 className="font-serif text-xl font-bold text-[#29251F]">
            No properties match this status filter
          </h2>
          <p className="text-xs text-[#665E52]">
            Switch the status filter back to &ldquo;All listing statuses&rdquo; to view all assigned properties.
          </p>
        </div>
      )}

      {/* Listing Quality Checklist */}
      <section className="p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-[#29251F]">Listing Quality Checklist</h2>
          <p className="text-xs text-[#665E52]">
            Keep your property pages clear and trustworthy for travellers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {checklist.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-[12px] bg-[#F5F0E6]/75 border border-[#E5DEC9] flex flex-col justify-between gap-2"
            >
              <div>
                <strong className="block font-extrabold text-[#29251F]">{item.title}</strong>
                <span className="text-[#665E52] block mt-0.5 leading-relaxed">
                  {item.description}
                </span>
              </div>
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    item.isComplete
                      ? 'bg-[#E8F4EC] text-[#1F6A3B]'
                      : 'bg-[#FDF3E1] text-[#9A6216]'
                  }`}
                >
                  {item.isComplete ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  <span>{item.statusLabel}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
