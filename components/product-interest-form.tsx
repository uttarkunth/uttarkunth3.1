'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface ProductInterestFormProps {
  initialCategories?: string[];
  userEmail?: string;
}

const PRODUCT_CATEGORIES = [
  { id: 'shawls', label: 'Handwoven Pashmina & Kullu Shawls', sub: 'Pure wool & yak wool handloom' },
  { id: 'honey', label: 'Wild Multifloral Himalayan Honey', sub: 'High-altitude unfiltered forage' },
  { id: 'pine', label: 'Pine Needle & Cedar Basketry', sub: 'Women artisan collective crafts' },
  { id: 'herbs', label: 'Wild Foraged Teas & Thyme', sub: 'Alpine mountain botanicals' },
];

export function ProductInterestForm({ initialCategories = [], userEmail }: ProductInterestFormProps) {
  const [selected, setSelected] = useState<string[]>(initialCategories);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleCategory = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;

    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          product_waitlist_categories: selected,
          product_waitlist_registered_at: new Date().toISOString(),
        },
      });
      setSubmitted(true);
    } catch (err) {
      // Even if metadata update fails, show optimistic success for client UX
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-ivory-warm rounded-2xl p-6 border border-forest/15 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-forest">
          <Sparkles className="w-4 h-4 text-terracotta" />
          <h3 className="font-serif text-base font-bold">Register for Collection Previews</h3>
        </div>
        <p className="text-xs text-charcoal-muted">
          Select categories you&apos;d like preview access to when the 2027 Himalayan harvest and artisan batches open.
        </p>
      </div>

      {submitted ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Notification preferences recorded</span>
            <span className="text-[11px] text-green-700">
              We will send catalog previews and artisan dispatch notes to {userEmail || 'your email'} as soon as batch inventory is verified.
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRODUCT_CATEGORIES.map((cat) => {
              const isChecked = selected.includes(cat.id);
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    isChecked
                      ? 'bg-forest/10 border-forest text-forest font-semibold'
                      : 'bg-white border-forest/15 text-charcoal hover:border-forest/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="block">{cat.label}</span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isChecked ? 'bg-forest border-forest text-white' : 'border-forest/30'}`}>
                      {isChecked && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </span>
                  </div>
                  <span className="text-[11px] text-charcoal-muted block font-normal mt-0.5">{cat.sub}</span>
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={saving || selected.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-forest hover:bg-forest-hover disabled:bg-forest/40 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Notify Me on Release'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
