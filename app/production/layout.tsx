import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Uttarkunth Production — Creative & Media Services',
  description: 'Visual storytelling, film production, photography, and creative services rooted in the Himalayas.',
  alternates: {
    canonical: '/production',
  },
};

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
