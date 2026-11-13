import Link from 'next/link';
import Image from 'next/image';
import { 
  ShoppingBag, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Feather,
  ArrowRight,
  Layers
} from 'lucide-react';
import ProductsCatalogClient from '@/components/products-catalog-client';

export const metadata = {
  title: 'Himalayan Organic Harvests & Artisanal Crafts | Uttarkunth',
  description: 'Shop genuine GI-tagged Uttarakhand produce: organic red rice, Badri cow ghee, pahadi pulses, wild forest honey, and hand-carved heritage crafts.',
  keywords: 'Uttarakhand organic products, Badri cow ghee, red rice Uttarakhand, Aipan art crafts, organic pahadi dal, Himalayan superfoods, Uttarkunth products',
  openGraph: {
    title: 'Himalayan Organic Harvests & Artisanal Crafts | Uttarkunth',
    description: 'Ethically sourced directly from high-altitude women-led farmer collectives in Uttarakhand.',
    url: 'https://uttarkunth.com/products',
    siteName: 'Uttarkunth',
    images: [
      {
        url: '/assets/products-home-page.webp',
        width: 1200,
        height: 630,
        alt: 'Uttarkunth Organic Himalayan Harvests',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Himalayan Organic Harvests & Artisanal Crafts | Uttarkunth',
    description: 'Ethically sourced directly from high-altitude women-led farmer collectives in Uttarakhand.',
    images: ['/assets/products-home-page.webp'],
  },
  alternates: {
    canonical: 'https://uttarkunth.com/products',
  },
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Hero Section */}
      <section className="relative bg-[#2C4A3E] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(#FAF8F5_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wider uppercase text-[#D4AF37]">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Pure Mountain Harvests</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight">
            Pahadi Bounty, Delivered to Your Door
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-stone-200 font-light">
            Grown in glacial soil without synthetic pesticides or chemicals. Certified native harvests and traditional handcrafted artifacts directly from women-led cooperatives.
          </p>
        </div>
      </section>

      {/* Authenticity Guarantee Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#EADFCB] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#2C4A3E]/10 flex items-center justify-center text-[#2C4A3E]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2C4A3E]">Glacial Purity Guarantee</h3>
            <p className="text-sm text-[#6D7A71] leading-relaxed">
              Nourished exclusively by pristine Himalayan snowmelt and traditional composting techniques handed down through generations.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#EADFCB] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#2C4A3E]/10 flex items-center justify-center text-[#2C4A3E]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2C4A3E]">GI-Certified Origins</h3>
            <p className="text-sm text-[#6D7A71] leading-relaxed">
              Registered geographical indication authenticity for Uttarakhand Himalayan red rice, ringal craft, and Munsyari white rajma.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#EADFCB] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#2C4A3E]/10 flex items-center justify-center text-[#2C4A3E]">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2C4A3E]">Pan-India Sustainable Dispatch</h3>
            <p className="text-sm text-[#6D7A71] leading-relaxed">
              Shipped in 100% recyclable, plastic-free biodegradable packaging straight from the mountain processing nodes.
            </p>
          </div>
        </div>
      </section>

      {/* Catalog Listing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
            <Feather className="w-4 h-4" />
            <span>Seasonal Harvests & Artifacts</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C4A3E]">
            Explore the Collection
          </h2>
          <p className="text-[#6D7A71] max-w-2xl">
            Every purchase directly finances local seed preservation banks and sustains independent farming families.
          </p>
        </div>

        <ProductsCatalogClient />
      </section>
    </div>
  );
}
