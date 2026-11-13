import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Compass, 
  MapPin, 
  Mountain, 
  Calendar, 
  CheckCircle2, 
  Navigation, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Thermometer,
  Layers
} from 'lucide-react';
import { getDestinationBySlug, getAllDestinations } from '@/lib/destinations-data';
import { getPropertiesByDestinationSlug } from '@/lib/properties-data';

interface DestinationPageProps {
  params: {
    slug: string;
  };
}

// Generate Static Params for all destinations so they build statically and rank in search engines
export async function generateStaticParams() {
  const destinations = getAllDestinations();
  return destinations.map((dest) => ({
    slug: dest.slug,
  }));
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const destination = getDestinationBySlug(params.slug);

  if (!destination) {
    return {
      title: 'Destination Not Found | Uttarkunth',
      description: 'The requested Uttarakhand destination could not be found.',
    };
  }

  const title = `${destination.name} Travel Guide, Stays & Culture | Uttarkunth`;
  const description = destination.metaDescription || destination.tagline;

  return {
    title,
    description,
    keywords: [
      destination.name,
      `${destination.name} Uttarakhand`,
      `${destination.name} homestays`,
      `${destination.name} travel guide`,
      `${destination.name} weather`,
      `${destination.name} culture`,
      'Uttarkunth Himalayan travel',
    ],
    openGraph: {
      title,
      description,
      images: [
        {
          url: destination.image,
          width: 1200,
          height: 630,
          alt: destination.name,
        },
      ],
      type: 'website',
      url: `https://uttarkunth.com/stays/destinations/${destination.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [destination.image],
    },
    alternates: {
      canonical: `https://uttarkunth.com/stays/destinations/${destination.slug}`,
    },
  };
}

export default async function DestinationDetailPage({ params }: DestinationPageProps) {
  const destination = getDestinationBySlug(params.slug);

  if (!destination) {
    notFound();
  }

  // Fetch verified stays in this destination
  const stays = await getPropertiesByDestinationSlug(destination.slug);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C4A3E]">
      {/* Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="bg-[#F4EFEA] border-b border-[#EADFCB] py-3 px-4 sm:px-6 lg:px-8 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 text-[#6D7A71]">
          <Link href="/" className="hover:text-[#2C4A3E] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#B8A282]" />
          <Link href="/stays" className="hover:text-[#2C4A3E] transition-colors">Stays</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#B8A282]" />
          <span className="text-[#2C4A3E] font-medium">{destination.name}</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[55vh] min-h-[420px] max-h-[600px] w-full overflow-hidden">
        <Image
          src={destination.image}
          alt={destination.name}
          fill
          priority
          sizes="100vw"
          className="object-cover brightness-[0.78]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E332B] via-transparent to-black/30" />
        
        <div className="absolute inset-0 flex flex-col justify-end max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 text-white">
          <div className="inline-flex items-center gap-2 bg-[#FAF8F5]/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs uppercase tracking-wider mb-3 w-fit text-[#FAF8F5]">
            <Mountain className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{destination.altitude}</span>
            <span>•</span>
            <span>{destination.district} District</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#FAF8F5] tracking-tight drop-shadow-md">
            {destination.name}
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-[#FAF8F5]/90 max-w-2xl font-light drop-shadow">
            {destination.tagline}
          </p>
        </div>
      </section>

      {/* Key Quick Facts Bar */}
      <section className="bg-white border-b border-[#EADFCB] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x-0 md:divide-x divide-[#EADFCB]">
            <div className="p-2">
              <span className="text-xs uppercase text-[#6D7A71] block font-medium">Altitude</span>
              <span className="text-base sm:text-lg font-serif font-bold text-[#2C4A3E]">{destination.altitude}</span>
            </div>
            <div className="p-2">
              <span className="text-xs uppercase text-[#6D7A71] block font-medium">Best Season</span>
              <span className="text-base sm:text-lg font-serif font-bold text-[#2C4A3E]">{destination.bestTimeToVisit}</span>
            </div>
            <div className="p-2">
              <span className="text-xs uppercase text-[#6D7A71] block font-medium">District</span>
              <span className="text-base sm:text-lg font-serif font-bold text-[#2C4A3E]">{destination.district}</span>
            </div>
            <div className="p-2">
              <span className="text-xs uppercase text-[#6D7A71] block font-medium">Verified Stays</span>
              <span className="text-base sm:text-lg font-serif font-bold text-[#D4AF37]">{stays.length} Homestays</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Narrative, Culture & Travel Details */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Overview */}
            <article className="prose prose-stone max-w-none">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C4A3E] border-b border-[#EADFCB] pb-3">
                About {destination.name}
              </h2>
              <p className="text-base sm:text-lg text-[#40534C] leading-relaxed mt-4 font-light">
                {destination.description}
              </p>
            </article>

            {/* Cultural Significance & Heritage */}
            <div className="bg-[#F4EFEA] rounded-2xl p-6 sm:p-8 border border-[#EADFCB]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-[#2C4A3E] rounded-xl text-white">
                  <Compass className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2C4A3E]">
                  Cultural Significance & Traditions
                </h3>
              </div>
              <p className="text-[#40534C] leading-relaxed">
                {destination.culturalSignificance}
              </p>
            </div>

            {/* Curated Highlights */}
            <div>
              <h3 className="text-2xl font-serif font-bold text-[#2C4A3E] mb-6">
                Signature Experiences & Sights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {destination.highlights.map((highlight, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#EADFCB] shadow-sm hover:border-[#2C4A3E]/40 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#2C4A3E] flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-medium text-[#2C4A3E]">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Reach & Practical Travel */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EADFCB] shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2C4A3E]/10 rounded-xl text-[#2C4A3E]">
                  <Navigation className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#2C4A3E]">
                  How to Reach {destination.name}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37] block">By Air</span>
                  <p className="text-sm text-[#40534C]">{destination.howToReach.air}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37] block">By Rail</span>
                  <p className="text-sm text-[#40534C]">{destination.howToReach.rail}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37] block">By Road</span>
                  <p className="text-sm text-[#40534C]">{destination.howToReach.road}</p>
                </div>
              </div>
            </div>

            {/* Verified Homestays Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[#2C4A3E]">
                    Verified Homestays in {destination.name}
                  </h3>
                  <p className="text-sm text-[#6D7A71]">
                    Direct community bookings supporting local host families
                  </p>
                </div>
              </div>

              {stays.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {stays.map((stay) => (
                    <Link
                      key={stay.id}
                      href={`/properties/${stay.slug}`}
                      className="group bg-white rounded-2xl overflow-hidden border border-[#EADFCB] shadow-sm hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="relative h-48 w-full overflow-hidden bg-stone-200">
                        {stay.images && stay.images[0] ? (
                          <Image
                            src={stay.images[0].url}
                            alt={stay.images[0].alt || stay.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 380px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <Mountain className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-[#1E332B]/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-medium">
                          {stay.property_type.replace('_', ' ')}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs text-[#6D7A71] mb-1.5">
                            <span>{stay.location.village}</span>
                            <span className="text-[#D4AF37] font-semibold">★ {stay.rating}</span>
                          </div>
                          <h4 className="font-serif text-lg font-bold text-[#2C4A3E] group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                            {stay.name}
                          </h4>
                          <p className="text-xs text-[#6D7A71] mt-1 line-clamp-2">
                            {stay.short_description || stay.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#EADFCB] flex items-center justify-between">
                          <div>
                            <span className="text-xs text-[#6D7A71]">Starting from</span>
                            <p className="text-sm font-bold text-[#2C4A3E]">
                              ₹{stay.starting_price.toLocaleString('en-IN')}{' '}
                              <span className="text-xs font-normal text-[#6D7A71]">/ night</span>
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-[#2C4A3E] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                            View stay →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#EADFCB]">
                  <p className="text-[#6D7A71] text-sm">
                    We are currently onboarding authentic, certified family homestays in {destination.name}.
                  </p>
                  <Link
                    href="/stays"
                    className="mt-4 inline-block px-5 py-2.5 bg-[#2C4A3E] text-white text-sm font-medium rounded-xl hover:bg-[#1E332B] transition-colors"
                  >
                    Explore all stays in Uttarakhand
                  </Link>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Travel Sidebar, Responsible Tourism & Navigation */}
          <aside className="space-y-8">
            
            {/* Responsible Tourism Commitment Card */}
            <div className="bg-[#2C4A3E] text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-md">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="font-serif font-bold text-lg">Responsible Travel in {destination.name}</h4>
              </div>
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-light">
                Uttarkunth connects you directly with indigenous village hosts. When traveling in high-altitude zones:
              </p>
              <ul className="text-xs sm:text-sm space-y-2 text-stone-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold">•</span>
                  <span>Avoid single-use plastics; pack out all non-biodegradables.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold">•</span>
                  <span>Honor sacred shrine protocols & dress respectfully.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold">•</span>
                  <span>Support village micro-enterprises and local pahadi farmers.</span>
                </li>
              </ul>
            </div>

            {/* Other Uttarakhand Destinations Quick Links */}
            <div className="bg-white rounded-2xl p-6 border border-[#EADFCB] shadow-sm">
              <h4 className="font-serif font-bold text-lg text-[#2C4A3E] mb-4">
                Explore More Himalayan Regions
              </h4>
              <div className="space-y-3">
                {getAllDestinations()
                  .filter((d) => d.slug !== destination.slug)
                  .map((otherDest) => (
                    <Link
                      key={otherDest.slug}
                      href={`/stays/destinations/${otherDest.slug}`}
                      className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F4EFEA] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-[#B8A282] group-hover:text-[#2C4A3E]" />
                        <span className="text-sm font-medium text-[#2C4A3E] group-hover:text-[#D4AF37]">
                          {otherDest.name}
                        </span>
                      </div>
                      <span className="text-xs text-[#6D7A71]">{otherDest.district}</span>
                    </Link>
                  ))}
              </div>
            </div>

          </aside>

        </div>
      </main>
    </div>
  );
}
