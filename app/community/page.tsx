import Link from 'next/link';
import { BRAND, COMMUNITY_INITIATIVES } from '@/lib/constants';
import { ArrowRight, Compass, HandHeart, Mountain, Sprout } from 'lucide-react';

export const metadata = {
  title: `Community | ${BRAND.name}`,
  description:
    'Explore Uttarkunth community initiatives, local collaboration, learning, cultural documentation, and practical work rooted in the Himalayas.',
  alternates: { canonical: 'https://uttarkunth.com/community' },
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <section className="relative overflow-hidden bg-forest-dark px-4 py-20 text-ivory sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(#F5F0E6_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative mx-auto max-w-5xl space-y-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-terracotta-light">
            <Mountain className="h-4 w-4" /> The Uttarkunth Community
          </span>
          <h1 className="font-serif text-4xl font-bold leading-tight sm:text-6xl">
            Ideas born in the mountains. Built through people.
          </h1>
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-ivory/80 sm:text-base">
            Uttarkunth is a business-led Himalayan initiative connecting local hospitality,
            products, creative work, and community participation. Our approach is grounded
            in learning by doing, respecting local knowledge, and turning useful ideas into
            practical work.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/community/join" className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-xs font-semibold text-white transition hover:bg-terracotta/90">
              Join the Community <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/about" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-xs font-semibold text-ivory transition hover:bg-white/10">
              About Uttarkunth
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-terracotta">
            <Compass className="h-4 w-4" /> Ideas and participation
          </span>
          <h2 className="font-serif text-3xl font-bold text-forest sm:text-4xl">
            Community initiatives
          </h2>
          <p className="text-sm leading-relaxed text-charcoal-muted">
            These tracks are shown with their current planning status. Proposed and
            concept-stage items are not presented as completed projects; dates and
            outcomes will be added only when they are confirmed.
          </p>
        </div>

        {COMMUNITY_INITIATIVES.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {COMMUNITY_INITIATIVES.map((initiative) => (
              <article key={initiative.id} className="flex h-full flex-col rounded-2xl border border-beige/80 bg-white p-6 shadow-soft">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-forest/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest">
                    {initiative.category}
                  </span>
                  <span className="text-[10px] font-semibold text-terracotta">
                    {initiative.status}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-forest">{initiative.title}</h3>
                <p className="mt-2 text-xs font-medium text-charcoal-muted">
                  {initiative.location} · {initiative.valley}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-charcoal-muted">
                  {initiative.description}
                </p>
                <div className="mt-5 border-t border-beige/60 pt-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-forest">
                    Focus areas
                  </p>
                  <ul className="space-y-1.5">
                    {initiative.objectives.slice(0, 3).map((objective) => (
                      <li key={objective} className="flex items-start gap-2 text-xs leading-relaxed text-charcoal-muted">
                        <Sprout className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto pt-6">
                  <Link href={`/community/initiatives/${initiative.slug}`} className="inline-flex items-center gap-2 text-xs font-semibold text-forest transition hover:text-terracotta">
                    View initiative <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-beige bg-white p-10 text-center">
            <HandHeart className="mx-auto h-10 w-10 text-terracotta" />
            <h3 className="mt-4 font-serif text-2xl font-bold text-forest">More community tracks are being prepared</h3>
            <p className="mt-2 text-sm text-charcoal-muted">Check back as confirmed initiatives are added.</p>
          </div>
        )}
      </section>

      <section className="border-t border-beige/70 bg-warm-canvas px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4 text-center">
          <HandHeart className="mx-auto h-9 w-9 text-terracotta" />
          <h2 className="font-serif text-3xl font-bold text-forest">Bring an idea. Build something useful.</h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-charcoal-muted">
            Whether you are a local maker, host, storyteller, volunteer, or potential partner,
            start a conversation with Uttarkunth about a practical collaboration.
          </p>
          <Link href="/community/participate" className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-xs font-semibold text-ivory transition hover:bg-forest-dark">
            Explore participation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
