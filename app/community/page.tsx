import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  Heart, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Feather
} from 'lucide-react';
import CommunityStoriesClient from '@/components/community-stories-client';

export const metadata = {
  title: 'Himalayan Community & Culture | Uttarkunth',
  description: 'Connect with local Uttarakhand artisans, mountain guides, organic farmers, and village cooperatives leading sustainable Himalayan living.',
  keywords: 'Himalayan community, Uttarakhand artisans, mountain storytelling, Pahadi folk traditions, sustainable village initiatives, Uttarkunth community',
  openGraph: {
    title: 'Himalayan Community & Culture | Uttarkunth',
    description: 'Empowering indigenous mountain communities, preserving folk arts, and fostering community-first Himalayan development.',
    url: 'https://uttarkunth.com/community',
    siteName: 'Uttarkunth',
    images: [
      {
        url: '/assets/community-home-page.webp',
        width: 1200,
        height: 630,
        alt: 'Uttarkunth Himalayan Community Gathering',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Himalayan Community & Culture | Uttarkunth',
    description: 'Empowering indigenous mountain communities, preserving folk arts, and fostering community-first Himalayan development.',
    images: ['/assets/community-home-page.webp'],
  },
  alternates: {
    canonical: 'https://uttarkunth.com/community',
  },
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Hero Section */}
      <section className="relative bg-[#2C4A3E] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(#FAF8F5_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wider uppercase text-[#D4AF37]">
            <Users className="w-3.5 h-3.5" />
            <span>Indigenous Village Voices</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight">
            The Living Heart of the Himalayas
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-stone-200 font-light">
            Uttarkunth is more than an enterprise — it is a grassroots ecosystem of over 200+ local families, folk artisans, women’s cooperatives, and mountain guardians.
          </p>
        </div>
      </section>

      {/* Community Impact Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#EADFCB] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#2C4A3E]/10 flex items-center justify-center text-[#2C4A3E]">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2C4A3E]">100% Direct Village Remittance</h3>
            <p className="text-sm text-[#6D7A71] leading-relaxed">
              We eliminate predatory middle-tier brokers. Every stay, workshop, and farm harvest payment goes directly to the village household.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#EADFCB] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#2C4A3E]/10 flex items-center justify-center text-[#2C4A3E]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2C4A3E]">Folk Art & Heritage Revival</h3>
            <p className="text-sm text-[#6D7A71] leading-relaxed">
              Reviving Aipan geometrical ritual painting, Kumaoni ringal basketry, and hand-carved wood craftsmanship with youth apprenticeships.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#EADFCB] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#2C4A3E]/10 flex items-center justify-center text-[#2C4A3E]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2C4A3E]">Ecological Forest Stewardship</h3>
            <p className="text-sm text-[#6D7A71] leading-relaxed">
              Supporting Van Panchayats (community forest councils) in oak forest conservation, sacred grove preservation, and zero-plastic watersheds.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Community Stories Client */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Oral Traditions & Profiles</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C4A3E]">
            Voices from Garhwal & Kumaon
          </h2>
          <p className="text-[#6D7A71] max-w-2xl">
            Meet the resilient people who safeguard our high-altitude ridges, cultivate ancient heirloom grains, and welcome you into their hearth.
          </p>
        </div>

        <CommunityStoriesClient />
      </section>

      {/* Community Call to Action */}
      <section className="bg-[#FAF8F5] border-t border-[#EADFCB] py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Feather className="w-10 h-10 text-[#D4AF37] mx-auto" />
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C4A3E]">
            Are You an Artisan, Homestay Host, or Guide?
          </h2>
          <p className="text-[#6D7A71] max-w-2xl mx-auto leading-relaxed">
            Join the Uttarkunth cooperative network. We provide technical tools, transparent direct bookings, marketing, and zero-commission community representation.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/seller/apply"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#2C4A3E] text-white font-medium rounded-xl hover:bg-[#1E332B] transition-colors shadow-sm"
            >
              Apply as a Village Partner
            </Link>
            <Link
              href="/about"
              className="w-full sm:w-auto px-6 py-3.5 bg-white border border-[#EADFCB] text-[#2C4A3E] font-medium rounded-xl hover:bg-stone-50 transition-colors"
            >
              Read Our Charter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
