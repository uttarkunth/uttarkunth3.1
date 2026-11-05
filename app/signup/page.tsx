'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/logo';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            preferred_name: preferredName.trim() || fullName.trim(),
            phone: phone.trim() || undefined,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        try {
          await fetch('/api/account/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: fullName.trim(),
              preferred_name: preferredName.trim() || fullName.trim(),
              phone: phone.trim(),
            }),
          });
        } catch {
          // Profile row will be created on first account visit or via database trigger
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-6">
        <div className="text-center space-y-2">
          <Logo className="justify-center" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 text-forest text-[11px] font-semibold uppercase tracking-wider mt-3">
            <Sparkles className="w-3 h-3 text-ukorange" />
            <span>Universal Himalayan Member Identity</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest pt-1">
            Join Uttarkunth
          </h1>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Create one unified Uttarkunth Member account to book stays, apply as a homestay host, artisan seller, filmmaker, or Karmayog contributor.
          </p>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-forest" />
            </div>
            <h3 className="font-serif text-xl font-bold text-forest">Verification Email Sent</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              We&rsquo;ve sent a confirmation link to <strong>{email}</strong>. Please check your inbox and click the link to activate your Uttarkunth Member account.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 px-4 py-2 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-forest-hover"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">
                  Full Legal / Display Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Gaurav Negi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">
                  Preferred Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="How hosts and community members should address you"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">
                  Mobile / Contact Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-forest hover:bg-forest-hover disabled:bg-forest/50 text-white font-semibold text-sm rounded-xl shadow-md transition-all mt-2"
              >
                {loading ? 'Creating Member Account...' : 'Create Uttarkunth Account'}
              </button>
            </form>

            <div className="text-center pt-4 border-t border-forest/10 text-xs text-charcoal-muted">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-forest hover:text-ukorange transition-colors"
              >
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}