import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, 
  MapPin, 
  Search, 
  Calendar, 
  Users, 
  SlidersHorizontal,
  Star,
  Mountain,
  Heart,
  Shield,
  ArrowRight
} from 'lucide-react';
import StaysFilterClient from '@/components/stays-filter-client';
import StaysDirectoryListing from '@/components/stays-directory-listing';
import { getGroupedDestinations } from '@/lib/stays-grouping';
import { getAllDestinations } from '@/lib/destinations-data';
import { getProperties } from '@/lib/properties-data';

export const metadata = {
  title: 'Himalayan Homestays & Stays | Authentic Uttarakhand | Uttarkunth',
  description: 'Book verified local homestays across Garhwal and Kumaon. Directly support local families and experience authentic Himalayan village life.',
  keywords: 'Uttarakhand homestays, Garhwal village stays, Kumaon heritage stays, high altitude retreats, authentic pahadi hospitality, Uttarkunth stays',
  openGraph: {
    title: 'Himalayan Homestays & Stays | Uttarkunth',
    description: 'Book verified local homestays across Garhwal and Kumaon. Directly support village families.',
    url: 'https://uttarkunth.com/stays',
    siteName: 'Uttarkunth',
    images: [
      {
        url: '/assets/gaurav-negi-founder.webp',
        width: 1200,
        height: 630,
        alt: 'Authentic Himalayan Stays by Uttarkunth',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Himalayan Homestays & Stays | Uttarkunth',
    description: 'Experience authentic Himalayan village life in Uttarakhand through community-run homestays.',
    images: ['/assets/gaurav-negi-founder.webp'],
  },
  alternates: {
    canonical: 'https://uttarkunth.com/stays',
  },
};

export default async function StaysPage() {
  const [groupedDestinations, allDestinations, allProperties] = await Promise.all([
    getGroupedDestinations(),
    Promise.resolve(getAllDestinations()),
    getProperties(),
  ]);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Hero Section */}
      <section className="relative bg-[#2C4A3E] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(#FAF8F5_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wider uppercase text-[#D4AF37]">
            <Mountain className="w-3.5 h-3.5" />
            <span>Community-Led Tourism</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight">
            Stay in the Heart of the Himalayas
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-stone-200 font-light">
            Every booking directly empowers rural families, preserves indigenous Himalayan architecture, and protects our fragile mountain heritage.
          </p>
        </div>
      </section>

      {/* Interactive Search & Filter Bar */}
      <section className="relative -mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-[#EADFCB]">
          <StaysFilterClient />
        </div>
      </section>

      {/* Grouped Regional Destinations Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-4 mb-10 text-center sm:text-left">
          <h2 className="text-3xl font-serif font-bold text-[#2C4A3E]">
            Explore Stays by Destination
          </h2>
          <p className="text-[#6D7A71]">
            Curated travel hubs organized by accessibility, trekking basecamps, and cultural heritage.
          </p>
        </div>

        {/* Group Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {groupedDestinations.map((group) => (
            <div 
              key={group.id} 
              className="bg-white rounded-2xl border border-[#EADFCB] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F4EFEA] text-[#2C4A3E] uppercase tracking-wider">
                  {group.title}
                </div>
                <p className="text-sm text-[#6D7A71]">
                  {group.description}
                </p>

                <div className="pt-2 space-y-2">
                  {group.destinations.map((dest) => (
                    <Link
                      key={dest.slug}
                      href={`/stays/destinations/${dest.slug}`}
                      className="group flex items-center justify-between p-2 rounded-lg hover:bg-[#FAF8F5] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#B8A282] group-hover:text-[#2C4A3E] transition-colors" />
                        <span className="text-sm font-medium text-[#2C4A3E] group-hover:text-[#D4AF37] transition-colors">
                          {dest.name}
                        </span>
                      </div>
                      <span className="text-xs text-[#6D7A71]">{dest.stayCount} Stays</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#FAF8F5] border-t border-[#EADFCB] text-center">
                <Link
                  href={`/stays/destinations/${group.destinations[0]?.slug || ''}`}
                  className="text-xs font-semibold text-[#2C4A3E] hover:text-[#D4AF37] inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Explore this region</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Directory of Verified Stays */}
      <section className="bg-[#FAF8F5] py-16 border-t border-[#EADFCB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 mb-10">
            <h2 className="text-3xl font-serif font-bold text-[#2C4A3E]">
              Featured Certified Homestays
            </h2>
            <p className="text-[#6D7A71]">
              Each home is personally inspected for safety, warmth, authentic cuisine, and sustainable practices.
            </p>
          </div>

          <StaysDirectoryListing initialProperties={allProperties} />
        </div>
      </section>

      {/* The Uttarkunth Promise Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-[#2C4A3E] text-white rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-6">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              Why We Are Different From Commercial Aggregators
            </h2>
            <p className="text-stone-300 leading-relaxed font-light">
              Unlike mass online booking agencies that charge hefty commissions and commodify local villages, Uttarkunth is born from the roots. We ensure that 100% of room charges reach the host families directly, with zero predatory middleman fees.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <span className="text-2xl font-bold font-serif text-[#D4AF37]">100%</span>
                <p className="text-xs text-stone-300">Direct village family revenue distribution</p>
              </div>
              <div className="space-y-2">
                <span className="text-2xl font-bold font-serif text-[#D4AF37]">100%</span>
                <p className="text-xs text-stone-300">Organic Himalayan produce served on table</p>
              </div>
              <div className="space-y-2">
                <span className="text-2xl font-bold font-serif text-[#D4AF37]">0%</span>
                <p className="text-xs text-stone-300">Non-biodegradable waste left behind</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
