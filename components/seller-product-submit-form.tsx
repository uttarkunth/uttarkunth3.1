'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { Package, PlusCircle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

export function SellerProductSubmitForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'textiles',
    maker_name: '',
    origin_valley: '',
    origin_state: 'Himachal Pradesh',
    craft_type: '',
    materials: '',
    description: '',
    photo_url: '',
    price_estimate: '',
    inventory_status: 'coming_soon',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const photos = formData.photo_url.trim() ? [formData.photo_url.trim()] : [];
      if (photos.length === 0) {
        throw new Error('Please provide at least one photograph URL for your product.');
      }

      const res = await fetch('/api/products/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          category: formData.category,
          maker_name: formData.maker_name.trim(),
          origin_valley: formData.origin_valley.trim(),
          origin_state: formData.origin_state.trim(),
          craft_type: formData.craft_type.trim(),
          materials: formData.materials.trim(),
          description: formData.description.trim(),
          photos,
          price_estimate: formData.price_estimate ? Number(formData.price_estimate) : null,
          inventory_status: formData.inventory_status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit product.');
      }

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            setSuccess(false);
          }}
          className="inline-flex items-center gap-2 bg-forest hover:bg-forest-hover text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-ukorange" />
          <span>Submit New Product Listing</span>
        </button>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-forest/10">
            <div>
              <h3 className="font-serif text-xl font-bold text-forest">
                Submit Product for Curation Review
              </h3>
              <p className="text-xs text-charcoal-muted">
                Each product must demonstrate genuine Himalayan provenance and natural materials.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-charcoal-muted hover:text-charcoal px-3 py-1 bg-ivory-warm rounded-lg"
            >
              Cancel
            </button>
          </div>

          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-forest">Product Submitted</h4>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                Your listing has been submitted for platform curation. It will be verified for authenticity and published upon admin approval.
              </p>
              <button
                onClick={() => {
                  setOpen(false);
                  setSuccess(false);
                }}
                className="mt-2 px-5 py-2 bg-forest text-white text-xs font-semibold rounded-xl"
              >
                Back to Workspace
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Handwoven Spiti Yak Wool Shawl"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30 bg-white"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Maker / Weaver Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="maker_name"
                    value={formData.maker_name}
                    onChange={handleChange}
                    placeholder="e.g. Master Weaver Dorje"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Origin Valley *
                  </label>
                  <input
                    type="text"
                    required
                    name="origin_valley"
                    value={formData.origin_valley}
                    onChange={handleChange}
                    placeholder="e.g. Pin Valley, Spiti"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    State *
                  </label>
                  <select
                    name="origin_state"
                    value={formData.origin_state}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30 bg-white"
                  >
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="Ladakh">Ladakh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Craft Technique *
                  </label>
                  <input
                    type="text"
                    required
                    name="craft_type"
                    value={formData.craft_type}
                    onChange={handleChange}
                    placeholder="e.g. Four-shaft pit loom weaving"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Natural Materials *
                  </label>
                  <input
                    type="text"
                    required
                    name="materials"
                    value={formData.materials}
                    onChange={handleChange}
                    placeholder="e.g. 100% Indigenous yak underfleece, walnut dye"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Product Description (Min 20 characters) *
                  </label>
                  <textarea
                    required
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Detail the provenance, texture, dimensions, and craftsmanship behind this creation..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    High-Res Photo URL *
                  </label>
                  <input
                    type="url"
                    required
                    name="photo_url"
                    value={formData.photo_url}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Fair Price Estimate (₹ INR, Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="price_estimate"
                    value={formData.price_estimate}
                    onChange={handleChange}
                    placeholder="e.g. 4500"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Inventory Status *
                  </label>
                  <select
                    name="inventory_status"
                    value={formData.inventory_status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30 bg-white"
                  >
                    <option value="coming_soon">Coming Soon / Waitlist</option>
                    <option value="made_to_order">Made to Order</option>
                    <option value="in_stock">In Stock</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-forest hover:bg-forest-hover text-white px-6 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit for Curation</span>
                      <ArrowRight className="w-4 h-4 text-ukorange" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
