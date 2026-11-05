import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${BRAND.name} — Authentic Himalayan Homestays & Retreats`,
  description: 'Experience genuine local hospitality in Jari, Kasol, Kullu, and Parvati Valley, Himachal Pradesh. Community-rooted stays with verified local hosts.',
  keywords: ['Uttarkunth Stays', 'Jari homestay', 'Kasol stays', 'Parvati Valley', 'Himachal Pradesh accommodation', 'Himalayan retreats', 'Yash Home Stay', 'Wonderway Retreat'],
  authors: [{ name: BRAND.founder }],
  icons: {
    icon: '/logo.png',
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
      <body className="min-h-screen flex flex-col bg-ivory text-charcoal" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.querySelectorAll('[fdprocessedid]').forEach(function(el){el.removeAttribute('fdprocessedid')})}catch(e){}`,
          }}
        />
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
