'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/logo';
import { Mail, Lock, User, AlertCircle, CheckCircle2, Home } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'guest' | 'host'>('guest');
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
            role: accountType
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`
        }
      });

      if (error) {
        throw error;
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
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest mt-4">Join Uttarkunth</h1>
          <p className="text-xs text-charcoal-muted">Create your account to request stays or host travelers</p>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-forest" />
            </div>
            <h3 className="font-serif text-xl font-bold text-forest">Verification Email Sent</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              We've sent a confirmation link to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.
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
              {/* Account Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-1.5">I want to</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('guest')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                      accountType === 'guest'
                        ? 'bg-forest text-white border-forest'
                        : 'bg-ivory-warm border-forest/20 text-charcoal hover:bg-forest/5'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Book Stays (Guest)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('host')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                      accountType === 'host'
                        ? 'bg-forest text-white border-forest'
                        : 'bg-ivory-warm border-forest/20 text-charcoal hover:bg-forest/5'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    List Homestay (Host)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">Full Name</label>
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
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">Email Address</label>
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
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="text-center pt-4 border-t border-forest/10 text-xs text-charcoal-muted">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-forest hover:text-ukorange transition-colors">
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
