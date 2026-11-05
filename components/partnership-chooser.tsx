'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, Store, Film, Heart, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

const PATHWAYS = [
  {
    id: 'hosts',
    title: 'Homestay Hosts',
    icon: Home,
    badge: '0% First-Year Commission',
    heading: 'List Your Mountain Homestay or Cottage',
    description:
      'Retain complete autonomy over your home. You set the room rates, review guest requests prior to confirmation, and collect 100% of guest payments directly at your property.',
    benefits: [
      '100% direct guest payments at property (no delayed payouts)',
      'Host-controlled reservation approvals (no forced overbooking)',
      'Free photographic documentation and verification support',
      'Transparent commercial agreement with direct host relationships',
    ],
    ctaText: 'Partner With Uttarkunth Stays',
    ctaLink: '/stays/partner',
  },
  {
    id: 'makers',
    title: 'Producers & Artisans',
    icon: Store,
    badge: 'Direct Maker Sourcing',
    heading: 'Distribute Authentic Himalayan Goods',
    description:
      'We partner with independent beekeepers, walnut orchardists, handloom weavers, and small-batch herbal producers who uphold ethical, pure mountain sourcing.',
    benefits: [
      'Zero exploitative distributor markups',
      'Direct storytelling highlighting your village and family provenance',
      'Access to a national community of conscious mountain enthusiasts',
      'Transparent inventory and simple fulfillment coordination',
    ],
    ctaText: 'Sell Your Products With Us',
    ctaLink: '/products/sell',
  },
  {
    id: 'creators',
    title: 'Filmmakers & Creators',
    icon: Film,
    badge: 'Creative Co-Production',
    heading: 'Collaborate on Himalayan Stories & Films',
    description:
      'Document the living heritage, alpine ecology, oral history, and human resilience of the Himalayas through documentaries, photography essays, and chronicles.',
    benefits: [
      'On-ground logistical support and local valley access',
      'Co-production funding and equipment sharing for selected pitches',
      'Archived and celebrated on the official Uttarkunth platform',
      'Festival submission backing and screening coordination',
    ],
    ctaText: 'Submit a Creative Pitch',
    ctaLink: '/production/collaborate',
  },
  {
    id: 'volunteers',
    title: 'Community Volunteers',
    icon: Heart,
    badge: 'Grassroots Impact',
    heading: 'Contribute Skills to Himalayan Village Initiatives',
    description:
      'Join hands in village-level education, digital literacy, trail cleanups, and vernacular architectural conservation rooted in our philosophy of Karmayog.',
    benefits: [
      'Hands-on immersion with valley families in Jari and beyond',
      'Teach digital skills, communication, or arts to local mountain youth',
      'Support decentralized plastic-free trail management initiatives',
      'Meaningful slow-travel volunteering with homestay accommodation',
    ],
    ctaText: 'Join the Community Mission',
    ctaLink: '/community/join',
  },
];

export function PartnershipChooser() {
  const [activeTab, setActiveTab] = useState(PATHWAYS[0].id);
  const current = PATHWAYS.find((p) => p.id === activeTab) || PATHWAYS[0];
  const Icon = current.icon;

  return (
    <div className="bg-white rounded-3xl border border-forest/15 shadow-soft overflow-hidden">
      {/* Tab Selectors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-forest/10 bg-forest/5">
        {PATHWAYS.map((pathway) => {
          const TabIcon = pathway.icon;
          const isActive = activeTab === pathway.id;
          return (
            <button
              suppressHydrationWarning
              type="button"
              key={pathway.id}
              onClick={() => setActiveTab(pathway.id)}
              className={`p-4 sm:p-5 text-left transition-all flex items-center gap-3 border-b-2 ${
                isActive
                  ? 'bg-white border-ukorange text-forest shadow-sm'
                  : 'border-transparent text-charcoal hover:bg-white/50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-ukorange text-white' : 'bg-forest/10 text-forest'
                }`}
              >
                <TabIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold block">{pathway.title}</span>
                <span className="text-[10px] text-charcoal-muted hidden sm:block">
                  {pathway.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="p-6 sm:p-10 lg:p-12 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ukorange/10 text-ukorange text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              {current.badge}
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest">
              {current.heading}
            </h3>
            <p className="text-sm text-charcoal leading-relaxed font-sans">
              {current.description}
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link
              href={current.ctaLink}
              className="inline-flex items-center gap-2 bg-forest hover:bg-forest-dark text-ivory px-6 py-3.5 rounded-full font-semibold text-sm transition-all shadow-sm hover:shadow group"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="w-4 h-4 text-ukorange group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="pt-6 border-t border-forest/10">
          <span className="text-xs font-bold text-charcoal-muted uppercase tracking-wider block mb-4">
            Key Partnership Commitments
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {current.benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-ukorange flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-charcoal">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
