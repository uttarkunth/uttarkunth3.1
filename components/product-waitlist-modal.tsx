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
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-dark text-warm-surface py-3.5 px-6 rounded-xl font-semibold text-xs uppercase tracking-[0.1em] transition-all duration-200 ease-editorial hover:-translate-y-0.5 shadow-editorial-sm"
      >
        <Bell className="w-4 h-4 text-terracotta-light" />
        <span>Register Early Patron Interest for This Creation</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/65 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={`Waitlist for ${productTitle}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              setSubmitted(false);
              setErrorMessage('');
            }
          }}
        >
          <div className="bg-warm-surface rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-beige-dark/60 shadow-editorial-xl relative animate-scale-in">
            <button
              suppressHydrationWarning
              type="button"
              aria-label="Close modal"
              onClick={() => {
                setOpen(false);
                setSubmitted(false);
                setErrorMessage('');
              }}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-warm-canvas transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-forest/10 text-forest flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-forest" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-forest">Interest Registered</h3>
                <p className="text-xs text-charcoal-muted max-w-xs mx-auto leading-relaxed">
                  Thank you! We have added <strong>{guestEmail}</strong> to the early patron list for <em>{productTitle}</em>. You will receive an invitation when the artisan releases the next verified batch.
                </p>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSubmitted(false);
                  }}
                  className="mt-4 px-6 py-2.5 bg-forest hover:bg-forest-dark text-warm-surface text-xs font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1 pr-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-terracotta">
                    Artisan Batch Waitlist
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-forest leading-snug">
                    {productTitle}
                  </h3>
                  <p className="text-xs text-charcoal-muted leading-relaxed">
                    Sign up to receive private notifications when authentic mountain batches are released.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 text-red-900 text-xs rounded-xl border border-red-200">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1.5">
                      Full Name <span className="text-terracotta">*</span>
                    </label>
                    <input
                      suppressHydrationWarning
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Meera Sharma"
                      className="w-full px-3.5 py-2.5 text-xs bg-warm-surface rounded-xl border border-beige-dark/80 focus:outline-none focus:ring-2 focus:ring-terracotta/25 focus:border-forest transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1.5">
                      Email Address <span className="text-terracotta">*</span>
                    </label>
                    <input
                      suppressHydrationWarning
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="meera@example.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-warm-surface rounded-xl border border-beige-dark/80 focus:outline-none focus:ring-2 focus:ring-terracotta/25 focus:border-forest transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1.5">
                      Notes or Sizing / Batch Questions (Optional)
                    </label>
                    <textarea
                      suppressHydrationWarning
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Interested in custom wool measurements or specific natural dyes..."
                      className="w-full px-3.5 py-2.5 text-xs bg-warm-surface rounded-xl border border-beige-dark/80 focus:outline-none focus:ring-2 focus:ring-terracotta/25 focus:border-forest transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    suppressHydrationWarning
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-dark text-warm-surface py-3 rounded-xl font-semibold text-xs uppercase tracking-[0.1em] transition-all shadow-xs disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-terracotta-light" />
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
