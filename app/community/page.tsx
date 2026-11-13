import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/lib/constants';
import { VentureApplicationForm } from '@/components/community/venture-application-form';
import {
  Users,
  Heart,
  Trees,
  Compass,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Mountain,
  Layers,
  Coins,
  Smile,
  BadgeCheck,
  TrendingUp,
} from 'lucide-react';

export const metadata = {
  title: `Community — The 77 Houses of Jari & The Uttarkunth Movement`,
  description:
    'Uttarkunth is a community-rooted startup built with the 77 houses of Jari village. Powered by Karmayog (5% think, 95% work), the Uttarkunth Ekta Abhiyan cleanliness drives, and the Community Development Fund.',
};

export default function CommunityPage() {
  return (
    <div className="bg-ivory text-charcoal min-h-screen py-12 sm:py-20 space-y-20 sm:space-y-28">
      {/* Editorial Header */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-widest">
          <Users className="w-3.5 h-3.5 text-ukorange" />
          The Living Model of Jari
        </div>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-forest leading-tight">
          A Startup Built Around Community
        </h1>
        <p className="font-serif italic text-xl sm:text-2xl text-ukorange">
          The 77 Houses of Jari &amp; The Uttarkunth Ekta Abhiyan
        </p>
        <p className="text-sm sm:text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
          Founded by Gaurav Negi in the heart of Parvati Valley, Uttarkunth is not an ordinary commercial enterprise. 
          It is an entrepreneurial startup co-created with the village community of 77 households in Jari, proving that people working together can become an unstoppable force for self-reliant development.
        </p>
      </section>

      {/* THE 1 CORE LIVING INITIATIVE: JARI & UTTARKUNTH */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-forest/15 shadow-soft space-y-12">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-forest/10 pb-8">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-ukorange font-bold">
                The Active Flagship Initiative
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
                The Jari Community Co-Ownership Model
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-muted">
                77 Families • One Village • Shared Enterprise • Real Development
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-3 bg-forest/5 px-4 py-3 rounded-2xl border border-forest/10">
              <Mountain className="w-8 h-8 text-forest" />
              <div className="text-xs">
                <span className="font-bold text-forest block">Jari, Parvati Valley</span>
                <span className="text-charcoal-muted">Kullu, Himachal Pradesh</span>
              </div>
            </div>
          </div>

          {/* Three Key Pillars of the Initiative */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: Community Investment */}
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
                <Coins className="w-6 h-6 text-forest" />
              </div>
              <h3 className="font-serif text-xl font-bold text-forest">
                Direct Community Investment
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                The 77 households of Jari are investing directly in this startup. Some invest financially to support local infrastructure, while others invest voluntary craftsmanship, hospitality services, and land stewardship to build genuine mountain capacity.
              </p>
            </div>

            {/* Pillar 2: Uttarkunth Ekta Abhiyan */}
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
                <Heart className="w-6 h-6 text-ukorange" />
              </div>
              <h3 className="font-serif text-xl font-bold text-forest">
                Uttarkunth Ekta Abhiyan (Unity Movement)
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                Cleanliness and pride begin right at the doorstep. The children and families of Jari actively clean the areas around their homes every single week. The entire village convenes for monthly civic cleanliness drives, keeping fragile Himalayan paths and streams pure.
              </p>
            </div>

            {/* Pillar 3: Karmayog Philosophy */}
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-forest" />
              </div>
              <h3 className="font-serif text-xl font-bold text-forest">
                The Karmayog Ethos: 5% Think, 95% Work
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                We reject endless theoretical meetings and bureaucratic hesitation. With 5% devoted to clear planning and 95% to disciplined physical action, ordinary villagers achieve extraordinary civic feats without waiting for outside saviors.
              </p>
            </div>
          </div>

          {/* Deep Explanation: Community Development Fund & Why Uttarkunth is NOT an NGO */}
          <div className="bg-forest-dark text-ivory rounded-3xl p-8 sm:p-12 space-y-6 shadow-lifted">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">
              The Engine vs. The Outcome
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">
              Why We Are an Enterprise, Not a Fragile NGO
            </h3>
            <p className="text-xs sm:text-sm text-ivory/85 leading-relaxed">
              Traditional NGOs rely on donations and external grants that dry up when donor interest fades. 
              Uttarkunth takes the opposite approach: <strong className="text-ivory">we build robust, profitable businesses</strong> — stays, cafés, cultural productions, and mountain products. 
              Profits are necessary to buy better tools, create secure local employment, and expand collective capability.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-ivory/15">
              <div className="space-y-2">
                <strong className="text-ukorange text-sm block">The Community Development Fund</strong>
                <p className="text-xs text-ivory/80 leading-relaxed">
                  A disciplined, defined share of profits from the <em>entire</em> Uttarkunth ecosystem (not just homestays, but every venture) is directed into our Community Development Fund. 
                  This fund finances village street lighting, youth learning tools, emergency medical support, and environmental conservation.
                </p>
              </div>

              <div className="space-y-2">
                <strong className="text-ukorange text-sm block">Voluntary Support &amp; Replicable Template</strong>
                <p className="text-xs text-ivory/80 leading-relaxed">
                  Anyone can voluntarily contribute funds or hands-on labor. When this model flourishes in Jari, it becomes an inspiring template for other mountain villages across Himachal and Uttarakhand to adopt the power of community unity and Karmayog.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY JOIN UTTARKUNTH COMMUNITY: VALUE FOR ENTREPRENEURS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
            What You Gain by Joining the Uttarkunth Community
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            Mutual trust, direct visibility, and amplified community impact
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3">
            <BadgeCheck className="w-6 h-6 text-ukorange" />
            <h4 className="font-serif text-lg font-bold text-forest">Verified Trust &amp; Visibility</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Your venture is listed directly on Uttarkunth. Guests and patrons trust our strict verification and community-first standards, providing your business with an immediate, loyal audience.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3">
            <TrendingUp className="w-6 h-6 text-forest" />
            <h4 className="font-serif text-lg font-bold text-forest">Speed &amp; Capability Growth</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              By plugging into our digital platform and operational tools, you avoid high middleman commissions, retain fair margins, and accelerate your journey toward financial independence.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3">
            <Heart className="w-6 h-6 text-ukorange" />
            <h4 className="font-serif text-lg font-bold text-forest">Access to Community Co-Funding</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              As Uttarkunth expands, high-impact village initiatives incubated under our philosophy can receive matching funds and volunteer support from the central Community Development Fund.
            </p>
          </div>
        </div>
      </section>

      {/* ENTREPRENEUR & MOUNTAIN INNOVATOR APPLICATION FORM */}
      <section id="apply" className="max-w-4xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <VentureApplicationForm />
      </section>

      {/* CLOSING BANNER */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
          Questions or Want to Visit Jari?
        </h3>
        <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto">
          We welcome travelers, researchers, and village leaders who want to witness the Jari community initiative in person.
        </p>
        <div className="pt-2">
          <a
            href="https://wa.me/918627025502?text=Hello%20Gaurav%2C%20I%20would%20like%20to%20know%20more%20about%20the%20Uttarkunth%20Jari%20Community%20initiative."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-800 text-ivory text-xs font-bold px-6 py-3 rounded-full hover:bg-emerald-900 transition-colors shadow-sm"
          >
            <span>Message Founder Gaurav Negi on WhatsApp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
}
