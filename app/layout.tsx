import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  metadataBase: new URL('https://uttarkunth.com'),
  title: `${BRAND.name} — Authentic Himalayan Homestays & Retreats`,
  description: 'Experience genuine local hospitality in Jari, Kasol, Kullu, and Parvati Valley, Himachal Pradesh. Community-rooted stays with verified local hosts.',
  keywords: ['Uttarkunth Stays', 'Jari homestay', 'Kasol stays', 'Parvati Valley', 'Himachal Pradesh accommodation', 'Himalayan retreats', 'Yash Home Stay', 'Wonderway Retreat'],
  authors: [{ name: BRAND.founder }],
  alternates: {
    canonical: './',
  },
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: `${BRAND.name} — Himalayan Hospitality`,
    description: 'Learn by Doing • Grow by Serving. Connect with authentic mountain homestays.',
    url: 'https://uttarkunth.com',
    siteName: BRAND.name,
    images: [{ url: '/logo.png', width: 800, height: 800, alt: 'Uttarkunth Logo' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — Himalayan Hospitality`,
    description: 'Learn by Doing • Grow by Serving. Connect with authentic mountain homestays.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-ivory text-charcoal">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
