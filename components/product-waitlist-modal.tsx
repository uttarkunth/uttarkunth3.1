'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Loader2, X, Bell } from 'lucide-react';

interface ProductWaitlistModalProps {
  productId?: string;
  productTitle: string;
  category?: string;
}

export function ProductWaitlistModal({
  productId,
  productTitle,
  category,
}: ProductWaitlistModalProps) {
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/products/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId || null,
          category: category || null,
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit interest.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button suppressHydrationWarning
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-hover text-white py-3.5 px-6 rounded-2xl font-semibold text-xs transition-all shadow-sm"
      >
        <Bell className="w-4 h-4 text-ukorange" />
        <span>Register Early Patron Interest for This Creation</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-forest/20 shadow-2xl relative">
            <button suppressHydrationWarning
              onClick={() => {
                setOpen(false);
                setSubmitted(false);
                setErrorMessage('');
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-charcoal-muted hover:text-charcoal hover:bg-forest/5"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-forest">Interest Registered</h3>
                <p className="text-xs text-charcoal-muted max-w-xs mx-auto leading-relaxed">
                  Thank you! We have added <strong>{guestEmail}</strong> to the early patron list for <em>{productTitle}</em>. You will receive an invitation when the artisan releases the next verified batch.
                </p>
                <button suppressHydrationWarning
                  onClick={() => {
                    setOpen(false);
                    setSubmitted(false);
                  }}
                  className="mt-4 px-6 py-2 bg-forest text-white text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-ukorange">
                    Artisan Batch Waitlist
                  </span>
                  <h3 className="font-serif text-xl font-bold text-forest">
                    {productTitle}
                  </h3>
                  <p className="text-xs text-charcoal-muted">
                    Sign up to receive private notifications when authentic mountain batches are released.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Full Name *
                    </label>
                    <input suppressHydrationWarning
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Meera Sharma"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Email Address *
                    </label>
                    <input suppressHydrationWarning
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="meera@example.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Notes or Sizing / Batch Questions (Optional)
                    </label>
                    <textarea suppressHydrationWarning
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Interested in custom wool measurements or specific natural dyes..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button suppressHydrationWarning
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-hover text-white py-3 rounded-xl font-semibold text-xs transition-all shadow-xs disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-ukorange" />
                        <span>Join Early Notification List</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
