import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/settings-form';

export const dynamic = 'force-dynamic';

export default async function AccountSettingsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/settings');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Security & Preferences</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">Account Settings</h1>
        <p className="text-xs text-charcoal-muted mt-1">
          Manage your credentials, dispatch notifications, and active session
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}
