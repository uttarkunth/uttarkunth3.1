import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkIsPlatformAdmin } from '@/lib/auth';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin/dashboard');
  }

  const isAdmin = await checkIsPlatformAdmin(user.id);
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <Shield className="w-12 h-12 text-red-600 mx-auto" />
        <h1 className="font-serif text-3xl font-bold text-red-700">Administrator Access Required</h1>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          This portal is strictly restricted to authorized platform administrators of Uttarkunth. Your account ({user.email}) does not have administrative privileges.
        </p>
        <Link href="/" className="inline-block mt-4 px-5 py-2.5 bg-forest text-white text-xs font-semibold rounded-full hover:bg-forest-light transition-all">
          Return to Homepage
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
