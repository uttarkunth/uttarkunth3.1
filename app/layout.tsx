import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { BRAND } from '@/lib/constants';
import { BrandIntroSplash } from '@/components/brand-intro-splash';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';

export const metadata: Metadata = {
  title: `${BRAND.name} — Authentic Himalayan Homestays & Retreats`,
  description: 'Experience genuine local hospitality in Jari, Kasol, Kullu, and Parvati Valley, Himachal Pradesh. Community-rooted stays with verified local hosts.',
  keywords: ['Uttarkunth Stays', 'Jari homestay', 'Kasol stays', 'Parvati Valley', 'Himachal Pradesh accommodation', 'Himalayan retreats', 'Yash Home Stay'],
  authors: [{ name: BRAND.founder }],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: `${BRAND.name} — Himalayan Hospitality`,
    description: 'Learn by Doing • Grow by Serving. Connect with authentic mountain homestays.',
    images: [{ url: '/logo.png', width: 800, height: 800, alt: 'Uttarkunth Logo' }],
    siteName: BRAND.name,
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-warm-canvas text-charcoal antialiased pb-16 md:pb-0" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-toast focus:px-4 focus:py-2 focus:rounded-full focus:bg-forest focus:text-warm-canvas focus:text-xs focus:font-semibold focus:shadow-lifted"
        >
          Skip to main content
        </a>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.querySelectorAll('[fdprocessedid]').forEach(function(el){el.removeAttribute('fdprocessedid')});var p=new URLSearchParams(window.location.search);var isHostRoute=window.location.pathname.indexOf('/account/stays/host')===0;var skip=isHostRoute||p.get('autostart')==='1'||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);var rawC=localStorage.getItem('uttarkunth_cookie_consent_v1');var funcOk=false;if(rawC){try{var pc=JSON.parse(rawC);funcOk=Boolean(pc&&pc.version==='2026.1'&&pc.categories&&pc.categories.functional===true);}catch(e){}}if(!funcOk){try{sessionStorage.removeItem('uk_splash_seen');sessionStorage.removeItem('uttarkunth_explore_spotlight_shown_v1');}catch(e){}}var seen=funcOk&&sessionStorage.getItem('uk_splash_seen')==='1';document.documentElement.setAttribute('data-uk-intro-gate',(seen||skip)?'completed':'active');}catch(e){document.documentElement.setAttribute('data-uk-intro-gate','completed');}`,
          }}
        />
        <BrandIntroSplash />
        <div data-uk-site-shell className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
          <CookieConsentBanner />
        </div>
      </body>
    </html>
  );
}


