'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/logo';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('returnUrl') || searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        router.push(next);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-6">
      <div className="text-center space-y-2">
        <Logo className="justify-center" />
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest mt-4">Welcome Back</h1>
        <p className="text-xs text-charcoal-muted">Sign in to your Uttarkunth account</p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal-muted mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-forest/40 absolute left-3 top-3.5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-charcoal-muted">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-ukorange hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-forest/40 absolute left-3 top-3.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-forest hover:bg-forest-hover text-ivory rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
        >
          <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="pt-4 border-t border-forest/10 text-center">
        <p className="text-xs text-charcoal-muted">
          Don&apos;t have an account yet?{' '}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-forest hover:text-ukorange transition-colors">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-forest/15 shadow-soft text-center py-16">
          <p className="text-sm text-charcoal-muted">Loading login form...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
