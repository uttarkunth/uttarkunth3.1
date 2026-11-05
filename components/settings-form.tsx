'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Bell, LogOut, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export function SettingsForm() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [culturalDispatches, setCulturalDispatches] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefMessage, setPrefMessage] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setUpdatingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          pref_booking_updates: bookingUpdates,
          pref_cultural_dispatches: culturalDispatches,
        },
      });
      if (error) throw error;
      setPrefMessage('Notification preferences updated.');
    } catch (err: any) {
      setPrefMessage('Could not save preferences at this moment.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-forest/10">
          <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
            <Lock className="w-5 h-5 text-forest" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-forest">Change Password</h2>
            <p className="text-xs text-charcoal-muted">Update your login password securely</p>
          </div>
        </div>

        {passwordMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2 ${
              passwordMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {passwordMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">New Password</label>
            <input suppressHydrationWarning
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">Confirm New Password</label>
            <input suppressHydrationWarning
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
            />
          </div>

          <button suppressHydrationWarning
            type="submit"
            disabled={updatingPassword}
            className="inline-flex items-center gap-2 px-4 py-2 bg-forest hover:bg-forest-hover disabled:bg-forest/50 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            {updatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{updatingPassword ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </div>

      {/* Communications & Preferences */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-forest/10">
          <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
            <Bell className="w-5 h-5 text-forest" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-forest">Communications</h2>
            <p className="text-xs text-charcoal-muted">Manage your email and dispatch preferences</p>
          </div>
        </div>

        {prefMessage && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>{prefMessage}</span>
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input suppressHydrationWarning
              type="checkbox"
              checked={bookingUpdates}
              onChange={(e) => setBookingUpdates(e.target.checked)}
              className="mt-0.5 rounded border-forest/30 text-forest focus:ring-forest"
            />
            <div>
              <span className="text-xs font-semibold text-charcoal block">Stay & Booking Confirmations</span>
              <span className="text-[11px] text-charcoal-muted">
                Receive instant emails when a homestay host confirms or responds to your booking request.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input suppressHydrationWarning
              type="checkbox"
              checked={culturalDispatches}
              onChange={(e) => setCulturalDispatches(e.target.checked)}
              className="mt-0.5 rounded border-forest/30 text-forest focus:ring-forest"
            />
            <div>
              <span className="text-xs font-semibold text-charcoal block">Uttarkunth Cultural Dispatches</span>
              <span className="text-[11px] text-charcoal-muted">
                Occasional dispatches covering Himalayan documentary releases, seasonal harvests, and village stories.
              </span>
            </div>
          </label>

          <button suppressHydrationWarning
            type="submit"
            disabled={savingPrefs}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ivory-warm hover:bg-forest/10 text-forest border border-forest/20 text-xs font-semibold rounded-xl transition-colors"
          >
            <span>{savingPrefs ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </form>
      </div>

      {/* Session / Log Out */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-forest">Account Session</h2>
          <p className="text-xs text-charcoal-muted">Sign out of your active session on this device</p>
        </div>

        <div>
          <button suppressHydrationWarning
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Uttarkunth</span>
          </button>
        </div>
      </div>
    </div>
  );
}
