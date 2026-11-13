import Link from 'next/link';
import Image from 'next/image';
import { 
  Clapperboard, 
  Camera, 
  MapPin, 
  Mountain, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  PhoneCall
} from 'lucide-react';

export const metadata = {
  title: 'Himalayan Film & Media Production | Uttarkunth Productions',
  description: 'Full-service production facilitation across Uttarakhand: line production, high-altitude scouting, local permissions, gear logistics, and authentic casting.',
  keywords: 'Uttarakhand film shooting, Himalayan line production, Garhwal scouting, high altitude filming, documentary permissions Uttarakhand, Uttarkunth productions',
  openGraph: {
    title: 'Himalayan Film & Media Production | Uttarkunth Productions',
    description: 'Bespoke line production, scouting, and remote logistics across the breathtaking terrain of Uttarakhand.',
    url: 'https://uttarkunth.com/production',
    siteName: 'Uttarkunth',
    images: [
      {
        url: '/assets/productions-home.webp',
        width: 1200,
        height: 630,
        alt: 'Uttarkunth Himalayan Film Production',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Himalayan Film & Media Production | Uttarkunth Productions',
    description: 'Bespoke line production, scouting, and remote logistics across the breathtaking terrain of Uttarakhand.',
    images: ['/assets/productions-home.webp'],
  },
  alternates: {
    canonical: 'https://uttarkunth.com/production',
  },
};

export default function ProductionPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Hero Section */}
      <section className="relative bg-[#2C4A3E] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(#FAF8F5_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wider uppercase text-[#D4AF37]">
            <Clapperboard className="w-3.5 h-3.5" />
            <span>High-Altitude Line Production</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight">
            Cinematic Storytelling in the High Himalayas
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-stone-200 font-light">
            From remote glacier valleys to ancient slate-roof villages, we facilitate end-to-end production logistics, state clearances, and local liaison with zero ecological footprint.
          </p>
        </div>
      </section>

      {/* Production Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#EADFCB] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#2C4A3E]/10 flex items-center justify-center text-[#2C4A3E]">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2C4A3E]">Scouting & Remote Recce</h3>
            <p className="text-sm text-[#6D7A71] leading-relaxed">
              Unrivaled access to off-the-grid alpine meadows, heritage wooden temples, and pristine rivers with verified seasonal weather assessments.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#EADFCB] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#2C4A3E]/10 flex items-center justify-center text-[#2C4A3E]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2C4A3E]">Government & Forest Permissions</h3>
            <p className="text-sm text-[#6D7A71] leading-relaxed">
              Seamless liaison with the Uttarakhand Film Development Council (UFDC), Forest Department, and local district authorities for drone and location permits.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#EADFCB] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#2C4A3E]/10 flex items-center justify-center text-[#2C4A3E]">
              <Mountain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2C4A3E]">Alpine Logistics & Basecamp</h3>
            <p className="text-sm text-[#6D7A71] leading-relaxed">
              Porters, certified high-altitude guides, off-road 4x4 convoys, heated all-weather camp infrastructure, and mobile generator sets.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Uttarkunth Productions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
              <Camera className="w-4 h-4" />
              <span>Native Knowledge & Technical Precision</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C4A3E]">
              Your Mountain Filming Partner on the Ground
            </h2>
            <p className="text-[#6D7A71] leading-relaxed">
              High-altitude filmmaking requires more than standard production equipment. It demands acute weather foresight, deep respect for mountain communities, and local emergency evacuation networks.
            </p>

            <ul className="space-y-3 pt-2">
              {[
                'Specialized cold-weather battery management and drone operation protocols',
                'Ethical village talent casting and fair compensation practices',
                'Comprehensive high-altitude medical safety kits & oxygen backups',
                'Zero-waste set management adhering to Leave No Trace principles',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2C4A3E] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#40534C]">{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#2C4A3E] text-white font-medium rounded-xl hover:bg-[#1E332B] transition-colors shadow-sm"
              >
                <span>Request a Production Recce</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[420px] bg-stone-900 border border-[#EADFCB]">
            <Image
              src="/assets/productions-home.webp"
              alt="Uttarkunth Himalayan Production Crew on Location"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8 text-white">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">Location Showcase</p>
                <p className="text-lg font-serif font-bold">Nanda Devi Biosphere Ridge, 3,400m</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Production Inquiries Banner */}
      <section className="bg-[#FAF8F5] border-t border-[#EADFCB] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Sparkles className="w-8 h-8 text-[#D4AF37] mx-auto" />
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C4A3E]">
            Have an Upcoming Commercial, Documentary, or Feature Project?
          </h3>
          <p className="text-sm text-[#6D7A71] max-w-xl mx-auto">
            Contact our dedicated production desk for script breakdowns, location portfolios, and customized line production estimates.
          </p>
          <div className="pt-2">
            <Link
              href="/contact?subject=production"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#1E332B] font-semibold rounded-xl hover:bg-[#c29e2f] transition-colors shadow-sm"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Connect with Line Producer</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
