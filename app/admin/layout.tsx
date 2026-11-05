import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveFounderOrAdminSession } from '@/lib/auth';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await resolveFounderOrAdminSession();

  if (!user) {
    redirect('/staff/login?next=/admin/dashboard');
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <Shield className="w-12 h-12 text-red-600 mx-auto" />
        <h1 className="font-serif text-3xl font-bold text-red-700">
          Internal Staff Authorization Required
        </h1>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          This portal is strictly restricted to active, Founder-approved Uttarkunth staff identities. Ordinary public member accounts ({user.email}) cannot access internal governance modules.
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link
            href="/staff/login"
            className="px-5 py-2.5 bg-forest text-white text-xs font-semibold rounded-full hover:bg-forest-light transition-all"
          >
            Staff Portal Login
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-ivory-warm border border-forest/20 text-forest text-xs font-semibold rounded-full hover:bg-forest/10 transition-all"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}