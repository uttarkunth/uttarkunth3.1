import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/lib/constants';
import {
  Mountain,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Layers,
  Heart,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Quote,
} from 'lucide-react';

export const metadata = {
  title: `About Uttarkunth — Himalayan Entrepreneurial Ecosystem`,
  description:
    'Ideas born in the Himalayas. Built through people. Uttarkunth is a Himalayan-born entrepreneurial ecosystem built on one conviction: people working together can become a powerful force for community development.',
  openGraph: {
    title: 'About Uttarkunth — Himalayan Entrepreneurial Ecosystem',
    description: 'Ideas born in the Himalayas. Built through people.',
    url: 'https://uttarkunth.com/about',
    siteName: 'Uttarkunth',
    images: [
      {
        url: '/assets/gaurav-negi-founder.webp',
        width: 1200,
        height: 630,
        alt: 'Uttarkunth Founder in the Himalayas',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Uttarkunth — Himalayan Entrepreneurial Ecosystem',
    description: 'Ideas born in the Himalayas. Built through people.',
    images: ['/assets/gaurav-negi-founder.webp'],
  },
  alternates: {
    canonical: 'https://uttarkunth.com/about',
  },
};

export default function AboutPage() {
  const steps = [
    { num: '01', title: 'Observe', desc: 'Identify a real need, opportunity or problem.' },
    { num: '02', title: 'Build', desc: 'Create a practical venture or project.' },
    { num: '03', title: 'Earn', desc: 'Develop revenue so the work can sustain itself.' },
    { num: '04', title: 'Learn', desc: 'Study what worked, what failed and what capability grew.' },
    { num: '05', title: 'Connect', desc: 'Bring people, skills, customers and communities together.' },
    { num: '06', title: 'Serve', desc: 'Use a defined share of capability and resources for community initiatives.' },
    { num: '07', title: 'Document', desc: 'Tell the story transparently through media.' },
    { num: '08', title: 'Improve', desc: 'Turn experiments into better systems.' },
    { num: '09', title: 'Scale', desc: 'Replicate what works, where it fits. Then begin again.' },
  ];

  const guardrails = [
    {
      title: 'Mission drift',
      risk: 'A collection of unrelated businesses.',
      guardrail: 'Judge every major venture against the parent philosophy.',
    },
    {
      title: 'Overexpansion',
      risk: 'Too many sectors before existing ones are stable.',
      guardrail: 'Expand capability before complexity.',
    },
    {
      title: 'Performative impact',
      risk: 'Social projects become marketing content.',
      guardrail: 'Measure real outcomes and credit participants.',
    },
    {
      title: 'Founder dependency',
      risk: 'It cannot run without one person.',
      guardrail: 'Document systems, delegate, develop future leaders.',
    },
    {
      title: 'Financial weakness',
      risk: 'Social spending weakens the business engine.',
      guardrail: 'A disciplined allocation, sensitive to scale.',
    },
    {
      title: 'Overclaiming',
      risk: 'Presenting discussed problems as solved.',
      guardrail: 'Separate completed work, current experiments and future ambitions.',
    },
  ];

  const faqs = [
    {
      q: 'What is Uttarkunth?',
      a: 'Uttarkunth is a Himalayan-born entrepreneurial ecosystem. We start practical businesses — currently homestays, a café and media productions — to learn, build financial strength, and reinvest a defined share of our capacity into community development.',
    },
    {
      q: 'Is Uttarkunth an NGO?',
      a: 'No. Uttarkunth is not a charity. We believe dependency on endless donations is fragile. Real empowerment comes from self-sustaining business engines that generate revenue, teach modern skills, and allocate a disciplined share of profits directly into community welfare.',
    },
    {
      q: 'What does Uttarkunth do today?',
      a: 'Today we operate verified Himalayan stays (homestays and mountain retreats), a local café experience, and Uttarkunth Productions documenting local stories and civic initiatives across the Parvati Valley and Himachal Pradesh.',
    },
    {
      q: 'Why different kinds of businesses?',
      a: 'Different ventures serve as practical labs for capability building. Stays connect visitors directly to local families; the café tests food and hospitality supply chains; productions document realities with transparent truth.',
    },
    {
      q: 'Is it only about the Himalayas?',
      a: 'The Himalayas are the birthplace and living laboratory, but the philosophy of Karmayog (5% think, 95% work) and community self-reliance is designed to be adapted by villages and mountain communities everywhere.',
    },
    {
      q: 'Does Uttarkunth give away all its profits?',
      a: 'No. A healthy business must reinvest in its people, equipment, quality, and reserve funds. We allocate a disciplined, defined portion of profits to community initiatives so social impact is sustained, not an occasional after-thought.',
    },
    {
      q: 'What makes it different?',
      a: 'Our focus is on Karmayog: moving from passive discussion to immediate, structured physical action. Rather than waiting for external institutions, we bring people together to solve problems ourselves.',
    },
  ];

  return (
    <div className="bg-ivory text-charcoal min-h-screen">
      {/* Sticky Table of Contents Header */}
      <div className="sticky top-16 z-30 bg-ivory/95 backdrop-blur-md border-b border-forest/10 py-3 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 sm:gap-4 text-xs font-semibold whitespace-nowrap">
          <span className="text-forest/40 uppercase tracking-widest text-[10px]">Navigate:</span>
          <a href="#idea" className="px-3 py-1 rounded-full bg-forest/5 hover:bg-forest hover:text-ivory text-forest transition-colors">The Idea</a>
          <a href="#name" className="px-3 py-1 rounded-full bg-forest/5 hover:bg-forest hover:text-ivory text-forest transition-colors">The Name</a>
          <a href="#why" className="px-3 py-1 rounded-full bg-forest/5 hover:bg-forest hover:text-ivory text-forest transition-colors">Why It Began</a>
          <a href="#philosophy" className="px-3 py-1 rounded-full bg-forest/5 hover:bg-forest hover:text-ivory text-forest transition-colors">Philosophy</a>
          <a href="#model" className="px-3 py-1 rounded-full bg-forest/5 hover:bg-forest hover:text-ivory text-forest transition-colors">How It Works</a>
          <a href="#ventures" className="px-3 py-1 rounded-full bg-forest/5 hover:bg-forest hover:text-ivory text-forest transition-colors">Ventures</a>
          <a href="#community" className="px-3 py-1 rounded-full bg-forest/5 hover:bg-forest hover:text-ivory text-forest transition-colors">Community</a>
          <a href="#roadmap" className="px-3 py-1 rounded-full bg-forest/5 hover:bg-forest hover:text-ivory text-forest transition-colors">Roadmap</a>
          <a href="#guardrails" className="px-3 py-1 rounded-full bg-forest/5 hover:bg-forest hover:text-ivory text-forest transition-colors">Guardrails</a>
          <a href="#faq" className="px-3 py-1 rounded-full bg-forest/5 hover:bg-forest hover:text-ivory text-forest transition-colors">FAQ</a>
          <a href="#founder" className="px-3 py-1 rounded-full bg-forest/5 hover:bg-forest hover:text-ivory text-forest transition-colors">Founder</a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-24 sm:space-y-32">
        {/* HERO SECTION */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-widest">
            <Mountain className="w-3.5 h-3.5 text-ukorange" />
            Ecosystem Manifesto
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold text-forest leading-[1.15]">
            What is Uttarkunth?
          </h1>
          <p className="font-serif italic text-2xl sm:text-3xl text-ukorange">
            Ideas born in the Himalayas. Built through people.
          </p>
          <p className="text-base sm:text-xl text-charcoal-muted max-w-3xl mx-auto leading-relaxed">
            Uttarkunth is a Himalayan-born entrepreneurial ecosystem built on one conviction: 
            <strong className="text-forest"> people working together can become a powerful force for community development.</strong>
          </p>
        </section>

        {/* SECTION 1: THE IDEA IN FIVE LINES */}
        <section id="idea" className="scroll-mt-32 space-y-8">
          <div className="border-l-4 border-ukorange pl-4 sm:pl-6 space-y-2">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Foundation</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              The Idea in Five Lines
            </h2>
            <p className="text-sm text-charcoal-muted">What we are trying to do.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { num: '1', text: 'Build sustainable enterprises.' },
              { num: '2', text: 'Build people and capabilities.' },
              { num: '3', text: 'Bring people together.' },
              { num: '4', text: 'Document what works.' },
              { num: '5', text: 'Reinvest a portion of the resulting strength into real community development.' },
            ].map((item) => (
              <div
                key={item.num}
                className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-forest text-ivory flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.num}
                </div>
                <p className="text-base font-semibold text-forest pt-1">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="bg-forest/5 rounded-2xl p-6 border border-forest/10 text-center">
            <p className="text-sm sm:text-base text-forest font-medium">
              <strong className="text-ukorange uppercase tracking-wider text-xs block mb-1">Our Niche</strong>
              Community development through entrepreneurship. Community development is the outcome. Entrepreneurship is the engine.
            </p>
          </div>
        </section>

        {/* SECTION 2: THE MEANING OF THE NAME */}
        <section id="name" className="scroll-mt-32 space-y-8">
          <div className="border-l-4 border-ukorange pl-4 sm:pl-6 space-y-2">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Etymology</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              The Meaning of the Name
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-forest-dark text-ivory rounded-3xl p-8 space-y-3 relative overflow-hidden">
              <span className="font-serif text-4xl sm:text-5xl font-bold text-ukorange block">Uttar</span>
              <p className="text-lg font-serif italic text-ivory/90">The north.</p>
              <p className="text-xs text-ivory/70 leading-relaxed">
                Representing the northern mountains, the high Himalayas, and the elevated realm of wisdom and resilience.
              </p>
            </div>

            <div className="bg-forest-dark text-ivory rounded-3xl p-8 space-y-3 relative overflow-hidden">
              <span className="font-serif text-4xl sm:text-5xl font-bold text-ukorange block">Kunth</span>
              <p className="text-lg font-serif italic text-ivory/90">A source. A place from which something begins and gathers.</p>
              <p className="text-xs text-ivory/70 leading-relaxed">
                A natural reservoir, an origin point, the font from which fresh springs of action flow outward.
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft text-sm sm:text-base text-charcoal-muted leading-relaxed">
            <strong className="text-forest">Together:</strong> ideas from the northern Himalayas, born of lived experience in village life and developed through action. The Himalayas are the starting point, not the boundary.
          </div>
        </section>

        {/* SECTION 3: WHY IT BEGAN */}
        <section id="why" className="scroll-mt-32 space-y-8">
          <div className="border-l-4 border-ukorange pl-4 sm:pl-6 space-y-2">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Genesis</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Why It Began
            </h2>
            <blockquote className="font-serif italic text-lg sm:text-xl text-forest font-medium">
              &ldquo;Is there any practical solution to these problems — and who will create it?&rdquo;
            </blockquote>
          </div>

          <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
            While preparing for government examinations, the founder kept watching the region change. 
            The question slowly moved from waiting for one authority to act toward asking what ordinary people can do together.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3">
              <h3 className="font-serif text-xl font-bold text-forest flex items-center gap-2">
                <Mountain className="w-5 h-5 text-ukorange" /> Environmental
              </h3>
              <ul className="text-xs text-charcoal-muted space-y-2 leading-relaxed">
                <li>• Deforestation and pressure on fragile alpine resources</li>
                <li>• Floods and environmental vulnerability</li>
                <li>• Waste and single-use plastic pollution in mountain streams</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3">
              <h3 className="font-serif text-xl font-bold text-forest flex items-center gap-2">
                <Heart className="w-5 h-5 text-ukorange" /> Cultural
              </h3>
              <ul className="text-xs text-charcoal-muted space-y-2 leading-relaxed">
                <li>• Pressure on local identity, architecture, and traditions</li>
                <li>• Commercialisation of sacred places and quiet shrines</li>
                <li>• Oral cultural knowledge that urgently needs documenting</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3">
              <h3 className="font-serif text-xl font-bold text-forest flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-ukorange" /> Economic
              </h3>
              <ul className="text-xs text-charcoal-muted space-y-2 leading-relaxed">
                <li>• Few local opportunities for educated young people</li>
                <li>• Short-term incentives over long-term generational thinking</li>
                <li>• Development models that rely entirely on outsiders</li>
              </ul>
            </div>
          </div>

          <div className="bg-forest-dark text-ivory rounded-3xl p-8 space-y-4 shadow-lifted">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">The Lesson of Citizen Action</span>
            <p className="text-sm sm:text-base text-ivory/90 leading-relaxed">
              These are the observations that triggered the idea, not a complete diagnosis of the Himalayas. Uttarkunth does not claim every issue has one cause or one solution. 
              <br /><br />
              <strong className="text-ivory">People are not only recipients of development. They can be participants, organisers and entrepreneurs.</strong>
              <br /><br />
              The founder describes one community that, responding to flood conditions, cleaned a lake in a single day, though the administrative estimate was months. 
              The lesson is not that administration is unnecessary. It is that organised citizens hold capabilities that become powerful when people cooperate.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="bg-ivory/10 px-3 py-1 rounded-full">Unity</span>
              <span className="bg-ivory/10 px-3 py-1 rounded-full">Action</span>
              <span className="bg-ivory/10 px-3 py-1 rounded-full">Experience</span>
              <span className="bg-ivory/10 px-3 py-1 rounded-full">Capability</span>
              <span className="bg-ivory/10 px-3 py-1 rounded-full">Development</span>
            </div>
          </div>
        </section>

        {/* SECTION 4: THE PHILOSOPHY */}
        <section id="philosophy" className="scroll-mt-32 space-y-8">
          <div className="border-l-4 border-ukorange pl-4 sm:pl-6 space-y-2">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Ethos</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              The Philosophy
            </h2>
            <p className="font-serif italic text-2xl text-ukorange">
              Learn by doing. Grow by serving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3">
              <h3 className="font-serif text-xl font-bold text-forest">Experience as Education</h3>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                Rather than waiting for perfect theoretical knowledge, Uttarkunth learns by building a café, running hospitality, producing a film, organising a local activity, facing failure, measuring results and trying again.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3">
              <h3 className="font-serif text-xl font-bold text-forest">Service is Tied to Growth</h3>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                Service is not separate from growth. Growth creates capability, and capability creates greater capacity to serve.
              </p>
            </div>
          </div>

          <div className="bg-forest/5 rounded-3xl p-8 border border-forest/15 space-y-3">
            <h3 className="font-serif text-2xl font-bold text-forest">Karmayog as an Action Principle</h3>
            <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
              Focus on doing meaningful work rather than being paralysed by attachment to results. Action should follow thought quickly — 
              <strong className="text-forest"> 5% think, 95% work</strong> — while still respecting planning, safety, legality and responsibility.
            </p>
          </div>
        </section>

        {/* SECTION 5: HOW IT WORKS — 9 STEPS */}
        <section id="model" className="scroll-mt-32 space-y-8">
          <div className="border-l-4 border-ukorange pl-4 sm:pl-6 space-y-2">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Operating Loop</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              How It Works
            </h2>
            <p className="text-sm text-charcoal-muted">A cycle, not a line. Enterprise is the engine.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-2 hover:border-ukorange transition-colors"
              >
                <span className="text-xs font-mono font-bold text-ukorange tracking-widest">
                  {step.num}
                </span>
                <h3 className="font-serif text-xl font-bold text-forest">{step.title}</h3>
                <p className="text-xs text-charcoal-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: VENTURES AND PARENT BRAND */}
        <section id="ventures" className="scroll-mt-32 space-y-8">
          <div className="border-l-4 border-ukorange pl-4 sm:pl-6 space-y-2">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Architecture</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Ventures and the Parent Brand
            </h2>
            <p className="text-sm text-charcoal-muted">Vehicles, not the destination.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-emerald-500/30 shadow-soft space-y-4">
              <h3 className="font-serif text-2xl font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Uttarkunth is
              </h3>
              <ul className="text-xs sm:text-sm text-charcoal-muted space-y-2.5">
                <li>• A parent entrepreneurial ecosystem</li>
                <li>• A community-development-oriented business platform</li>
                <li>• A place for continuous experimentation and learning</li>
                <li>• A storytelling and documentation platform</li>
                <li>• A way to turn enterprise into community capability</li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-red-500/20 shadow-soft space-y-4">
              <h3 className="font-serif text-2xl font-bold text-rose-950 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" /> Uttarkunth is not
              </h3>
              <ul className="text-xs sm:text-sm text-charcoal-muted space-y-2.5">
                <li>• Only a homestay, only a café, or only a tourism company</li>
                <li>• Only a media channel or marketing agency</li>
                <li>• A conventional charity or donation-dependent NGO</li>
                <li>• A promise that one company can solve every social problem</li>
              </ul>
            </div>
          </div>

          {/* Current Live Ventures */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3">
              <h4 className="font-serif text-xl font-bold text-forest">Stays</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                A direct connection with visitors, local life, food and place. A working lab for hospitality, operations and local employment.
              </p>
              <Link href="/stays" className="text-xs font-bold text-ukorange inline-flex items-center gap-1 hover:underline">
                Explore Stays <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3">
              <h4 className="font-serif text-xl font-bold text-forest">Café</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Food, community space and customer experience. A lab for products, service, sourcing and local participation.
              </p>
              <span className="text-xs font-bold text-forest/50">Jari, Parvati Valley</span>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3">
              <h4 className="font-serif text-xl font-bold text-forest">Productions</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Documentation, creative development and public conversation. Media that records the journey rather than a perfect image.
              </p>
              <Link href="/productions" className="text-xs font-bold text-ukorange inline-flex items-center gap-1 hover:underline">
                Watch Productions <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-forest/5 rounded-2xl p-6 border border-forest/10 space-y-2 text-xs text-charcoal-muted">
            <strong className="text-forest text-sm block">Future Horizons (Ambitions, not announcements):</strong>
            <p>
              Tourism & destination experiences • Food products & indigenous farming • Fashion & sustainable mountain clothing • 
              Film, theatre & productions • Workshops & creative learning • Regenerative agriculture • Appropriate rural technology.
            </p>
          </div>
        </section>

        {/* SECTION 7: COMMUNITY DEVELOPMENT */}
        <section id="community" className="scroll-mt-32 space-y-8">
          <div className="border-l-4 border-ukorange pl-4 sm:pl-6 space-y-2">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Participation</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Community Development
            </h2>
            <p className="text-sm text-charcoal-muted">Participation, not dependency.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-2">
              <h3 className="font-serif text-lg font-bold text-forest">Participate</h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                People are contributors and co-creators, not passive recipients.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-2">
              <h3 className="font-serif text-lg font-bold text-forest">Start Small</h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Projects small enough to carry out, observe and improve, with results people can see.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-2">
              <h3 className="font-serif text-lg font-bold text-forest">Replicate</h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Document models so another village or group can adapt them. Strengthen skills and livelihoods, not permanent donations.
              </p>
            </div>
          </div>

          {/* Living Lab Callout */}
          <div className="bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-4">
            <h3 className="font-serif text-2xl font-bold text-forest">The Village as a Living Laboratory</h3>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              The purpose is learning, not claiming perfection. The questions we test every day:
            </p>
            <ul className="text-xs sm:text-sm text-charcoal space-y-2 font-medium">
              <li>✓ Can a local cleanliness activity become a recurring habit?</li>
              <li>✓ Can young people learn entrepreneurship through real projects?</li>
              <li>✓ Can local food and hospitality build stronger livelihoods?</li>
              <li>✓ Can media make local issues visible without sensationalising them?</li>
              <li>✓ Can an activity be documented well enough for another village to adapt it?</li>
            </ul>
          </div>

          {/* Community Fund Principle */}
          <div className="bg-forest-dark text-ivory rounded-3xl p-8 space-y-6 shadow-lifted">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">The Community Fund Principle</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">A Defined Share, Not an Afterthought</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm text-ivory/80 leading-relaxed">
              <div className="space-y-2">
                <strong className="text-ivory block text-base">Why a share?</strong>
                <p>A defined allocation brings discipline, so social impact never becomes occasional or arbitrary.</p>
              </div>
              <div className="space-y-2">
                <strong className="text-ivory block text-base">Why not all profit?</strong>
                <p>Scaling depends on reinvestment: stronger businesses, fair wages, better systems, and growing capacity to serve.</p>
              </div>
            </div>

            <div className="pt-2 text-xs text-ivory/70 border-t border-ivory/10">
              <strong className="text-ivory">What it supports:</strong> Environmental regeneration, village cleanliness drives, children and youth education, oral cultural archives, and small grassroots experiments.
            </div>
          </div>
        </section>

        {/* SECTION 8: ROADMAP */}
        <section id="roadmap" className="scroll-mt-32 space-y-8">
          <div className="border-l-4 border-ukorange pl-4 sm:pl-6 space-y-2">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Timeline</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Roadmap
            </h2>
            <p className="text-sm text-charcoal-muted">A long road, started carefully.</p>
          </div>

          <div className="space-y-4">
            {[
              { phase: 'PHASE I', title: 'Validate', desc: 'Strengthen hospitality, café and media. Learn operations. Build audience and credibility.', current: true },
              { phase: 'PHASE II', title: 'Build', desc: 'Add carefully selected ventures. Develop systems, teams and financial capacity.' },
              { phase: 'PHASE III', title: 'Activate', desc: 'More and better community projects, with clearer allocation and reporting.' },
              { phase: 'PHASE IV', title: 'Replicate', desc: 'Help other communities adapt the models that work.' },
              { phase: 'PHASE V', title: 'Ecosystem', desc: 'A mature multi-sector ecosystem with strong internal capability and measurable community impact.' },
            ].map((p) => (
              <div
                key={p.phase}
                className={`p-6 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  p.current
                    ? 'bg-forest/10 border-forest shadow-sm'
                    : 'bg-white border-forest/15'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ukorange">{p.phase}</span>
                    <h3 className="font-serif text-xl font-bold text-forest">{p.title}</h3>
                    {p.current && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-ukorange text-ivory px-2 py-0.5 rounded-full">
                        We are here
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal-muted">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white rounded-2xl border border-forest/15 text-center space-y-2">
            <p className="font-serif text-lg font-bold text-forest">
              Scale means replicating principles, not opening branches.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs font-semibold text-charcoal-muted">
              <span>Village</span> → <span>Valley / Region</span> → <span>Wider India</span> → <span>Beyond</span>
            </div>
          </div>
        </section>

        {/* SECTION 9: GUARDRAILS */}
        <section id="guardrails" className="scroll-mt-32 space-y-8">
          <div className="border-l-4 border-ukorange pl-4 sm:pl-6 space-y-2">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Integrity</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Guardrails
            </h2>
            <p className="text-sm text-charcoal-muted">Evidence before exaggerated claims.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guardrails.map((g) => (
              <div
                key={g.title}
                className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-3"
              >
                <h3 className="font-serif text-lg font-bold text-forest">{g.title}</h3>
                <div className="text-xs space-y-1">
                  <p className="text-rose-700"><strong>Risk:</strong> {g.risk}</p>
                  <p className="text-forest"><strong>Guardrail:</strong> {g.guardrail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Decision Rules */}
          <div className="bg-forest/5 rounded-3xl p-8 border border-forest/15 space-y-4">
            <h3 className="font-serif text-2xl font-bold text-forest">How We Decide</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-charcoal font-medium">
              <div>• Purpose before short-term attention</div>
              <div>• Sustainability before uncontrolled expansion</div>
              <div>• Action before unnecessary perfectionism</div>
              <div>• Community participation before symbolic representation</div>
              <div>• Reinvestment before premature extraction of profit</div>
              <div>• Legal and ethical compliance as a non-negotiable baseline</div>
            </div>
          </div>
        </section>

        {/* SECTION 10: FAQ */}
        <section id="faq" className="scroll-mt-32 space-y-8">
          <div className="border-l-4 border-ukorange pl-4 sm:pl-6 space-y-2">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Clarity</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-forest/15 shadow-soft space-y-2">
                <h3 className="font-serif text-lg font-bold text-forest flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-ukorange flex-shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 11: FOUNDER'S STATEMENT */}
        <section id="founder" className="scroll-mt-36 space-y-8 -mx-4 sm:mx-0">
          <div className="px-4 sm:px-0 space-y-1.5">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Founder</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Founder’s Statement
            </h2>
          </div>

          {/* Borderless Panoramic Founder Image Div — Content on the Left Side of the Founder */}
          <div className="relative rounded-none sm:rounded-3xl overflow-hidden shadow-lifted bg-[#111D17]">
            {/* Desktop / Tablet Full-Stage Panoramic Background Image */}
            <div className="relative aspect-[2048/967] md:aspect-auto md:min-h-[560px] lg:min-h-[600px] w-full">
              <Image
                src="/assets/aistudio/uttarkunth-founder-face-lightened-natural_58cc9d8f.webp"
                alt={`${BRAND.founder} — Founder of Uttarkunth in the Himalayas`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover object-[68%_center] md:object-center"
              />

              {/* Subtle Radial Natural Lightness Boost Over Founder's Face */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_62%_58%,rgba(255,248,235,0.16)_0%,rgba(255,248,235,0.06)_15%,transparent_30%)] mix-blend-screen"
              />

              {/* Feathered Elliptical Readability Veil Behind Left-Side Text (Preserves Top Sky & Right-Side Founder 100% Clear) */}
              <div
                aria-hidden="true"
                className="hidden md:block pointer-events-none absolute -inset-6 bg-[radial-gradient(ellipse_48%_74%_at_23%_56%,rgba(8,15,11,0.82)_0%,rgba(8,15,11,0.66)_48%,rgba(8,15,11,0.28)_74%,rgba(8,15,11,0)_100%)] blur-xl"
              />

              {/* Desktop / Tablet Content Positioned on the Left Side of the Founder in the Image */}
              <div className="hidden md:flex relative z-10 h-full min-h-[560px] lg:min-h-[600px] items-center">
                <div className="w-[49%] lg:w-[48%] pl-8 lg:pl-11 pr-4 py-8 lg:py-10 space-y-4 text-[#FFFDF9]">
                  <div className="space-y-3 text-[13px] lg:text-[14.5px] text-[#FFFDF9] leading-[1.6] font-serif italic [text-shadow:0_2px_12px_rgba(6,12,9,0.92),0_1px_3px_rgba(6,12,9,0.95)]">
                    <p>
                      &ldquo;Uttarkunth began as an idea in the Himalayas. While preparing for
                      government exams, I was watching the changes around me and asking why so many
                      problems seemed to be growing while people often waited for someone else to
                      solve them.
                    </p>
                    <p>
                      I do not want Uttarkunth to become only a charity organisation. I want to build
                      something financially strong enough to stand on its own feet. That is why I am
                      starting with businesses. The homestay, the café, media and the ventures that
                      may come later are vehicles through which I am learning, building resources and
                      validating whether this larger idea can work.
                    </p>
                    <p>
                      My aim is not to claim that I already know the answer. My aim is to build,
                      experiment, learn, document and improve.
                    </p>
                    <p>
                      If a small village can become a place where people create businesses, protect
                      what they value, learn together and solve small problems collectively, perhaps
                      that experience can become a model for something larger. That is the journey of
                      Uttarkunth.&rdquo;
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-0.5 [text-shadow:0_2px_10px_rgba(6,12,9,0.92),0_1px_3px_rgba(6,12,9,0.95)]">
                    <strong className="text-[#FFFDF9] font-serif text-xl lg:text-2xl block">
                      {BRAND.founder}
                    </strong>
                    <span className="text-[11px] text-[#FDE2A8] uppercase tracking-wider font-semibold">
                      Founder, Uttarkunth &middot; Jari, Parvati Valley
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Content View (Below Uncropped Panoramic Image so Founder is Clearly Seen on Mobile Too) */}
            <div className="md:hidden p-6 space-y-4 text-[#FFFDF9] bg-[#111D17]">
              <div className="space-y-3 text-xs sm:text-sm text-[#FFFDF9]/90 leading-relaxed font-serif italic">
                <p>
                  &ldquo;Uttarkunth began as an idea in the Himalayas. While preparing for government
                  exams, I was watching the changes around me and asking why so many problems seemed
                  to be growing while people often waited for someone else to solve them.
                </p>
                <p>
                  I do not want Uttarkunth to become only a charity organisation. I want to build
                  something financially strong enough to stand on its own feet. That is why I am
                  starting with businesses. The homestay, the café, media and the ventures that may
                  come later are vehicles through which I am learning, building resources and
                  validating whether this larger idea can work.
                </p>
                <p>
                  My aim is not to claim that I already know the answer. My aim is to build,
                  experiment, learn, document and improve.
                </p>
                <p>
                  If a small village can become a place where people create businesses, protect what
                  they value, learn together and solve small problems collectively, perhaps that
                  experience can become a model for something larger. That is the journey of
                  Uttarkunth.&rdquo;
                </p>
              </div>

              <div className="pt-2">
                <strong className="text-[#FFFDF9] font-serif text-xl block">{BRAND.founder}</strong>
                <span className="text-[11px] text-[#FDE2A8] uppercase tracking-wider font-semibold">
                  Founder, Uttarkunth &middot; Jari, Parvati Valley
                </span>
              </div>
            </div>
          </div>

          {/* Core Summary Grid (Borderless) */}
          <div className="px-4 sm:px-0 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
            <div className="bg-forest/5 p-3.5 rounded-xl">
              <span className="text-ukorange font-bold block text-[10px] uppercase">Origin</span>
              <span className="text-forest font-medium">Himalayan lived experience</span>
            </div>
            <div className="bg-forest/5 p-3.5 rounded-xl">
              <span className="text-ukorange font-bold block text-[10px] uppercase">Belief</span>
              <span className="text-forest font-medium">People united create change</span>
            </div>
            <div className="bg-forest/5 p-3.5 rounded-xl">
              <span className="text-ukorange font-bold block text-[10px] uppercase">Engine</span>
              <span className="text-forest font-medium">Self-sustaining enterprise</span>
            </div>
            <div className="bg-forest/5 p-3.5 rounded-xl">
              <span className="text-ukorange font-bold block text-[10px] uppercase">Method</span>
              <span className="text-forest font-medium">Learn by doing, replicate</span>
            </div>
            <div className="bg-forest/5 p-3.5 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-ukorange font-bold block text-[10px] uppercase">Purpose</span>
              <span className="text-forest font-medium">Community development</span>
            </div>
          </div>

          {/* Chapter One Closing Banner */}
          <div className="text-center py-12 space-y-4">
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Chapter One is Being Written
            </h3>
            <p className="text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto">
              The mountains are where it began. Not where it ends. Come and be part of what comes next.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Link
                href="/stays"
                className="bg-forest text-ivory px-6 py-3 rounded-full text-xs font-semibold hover:bg-forest-dark transition-all shadow-sm"
              >
                Experience Our Stays
              </Link>
              <Link
                href="/community"
                className="bg-ivory-warm text-forest border border-forest/20 px-6 py-3 rounded-full text-xs font-semibold hover:bg-forest/10 transition-all"
              >
                Join the Community
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
