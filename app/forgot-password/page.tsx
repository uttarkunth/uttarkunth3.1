'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/logo';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset link. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-6">
        <div className="text-center space-y-2">
          <Logo className="justify-center" />
          <h1 className="font-serif text-2xl font-bold text-forest mt-4">Reset Password</h1>
          <p className="text-xs text-charcoal-muted">Enter your account email to receive a recovery link</p>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-forest" />
            </div>
            <h3 className="font-serif text-xl font-bold text-forest">Reset Link Sent</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              If an account matches <strong>{email}</strong>, a password reset link has been dispatched to your inbox.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 px-4 py-2 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-forest-hover"
            >
              Back to Sign In
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

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5" />
                  <input suppressHydrationWarning
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
                  />
                </div>
              </div>

              <button suppressHydrationWarning
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-forest hover:bg-forest-hover disabled:bg-forest/50 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
              >
                {loading ? 'Sending Link...' : 'Send Recovery Link'}
              </button>
            </form>

            <div className="text-center pt-4 border-t border-forest/10 text-xs">
              <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-forest hover:text-ukorange transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
