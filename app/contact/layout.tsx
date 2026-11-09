import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — Get in Touch | Uttarkunth',
  description: 'Reach out to the Uttarkunth team for stay bookings, host partnerships, community initiatives, and media collaborations.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
