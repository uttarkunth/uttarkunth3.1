'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Users,
  Eye,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface ProductModerationClientProps {
  initialSellers: any[];
  initialProducts: any[];
  initialInterests: any[];
}

export function ProductModerationClient({
  initialSellers,
  initialProducts,
  initialInterests,
}: ProductModerationClientProps) {
  const router = useRouter();
  const [sellers, setSellers] = useState<any[]>(initialSellers);
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [interests] = useState<any[]>(initialInterests);
  const [activeTab, setActiveTab] = useState<'sellers' | 'products' | 'interests'>('sellers');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSellerAction = async (sellerId: string, action: 'approve' | 'reject') => {
    setActionLoading(`seller-${sellerId}-${action}`);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'seller',
          target_id: sellerId,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update seller.');
      }

      setSellers((prev) =>
        prev.map((s) => (s.user_id === sellerId ? { ...s, status: action === 'approve' ? 'approved' : 'rejected' } : s))
      );
      setFeedback({ type: 'success', message: `Seller ${action === 'approve' ? 'approved' : 'rejected'} successfully.` });
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Action failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleProductAction = async (productId: string, action: 'approve' | 'reject' | 'set_inventory', inventoryStatus?: string) => {
    setActionLoading(`product-${productId}-${action}`);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'product',
          target_id: productId,
          action,
          inventory_status: inventoryStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update product.');
      }

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          if (action === 'approve') return { ...p, moderation_status: 'approved' };
          if (action === 'reject') return { ...p, moderation_status: 'rejected' };
          if (action === 'set_inventory' && inventoryStatus) return { ...p, inventory_status: inventoryStatus };
          return p;
        })
      );
      setFeedback({ type: 'success', message: `Product listing updated.` });
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Action failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingSellersCount = sellers.filter((s) => s.status === 'pending').length;
  const pendingProductsCount = products.filter((p) => p.moderation_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Subnav Tabs */}
      <div className="flex items-center gap-2 border-b border-forest/15 pb-2">
        <button
          onClick={() => setActiveTab('sellers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'sellers'
              ? 'bg-forest text-white shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal hover:bg-forest/5'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Artisan Applications</span>
          {pendingSellersCount > 0 && (
            <span className="px-1.5 py-0.2 bg-ukorange text-white text-[10px] font-bold rounded-full">
              {pendingSellersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'products'
              ? 'bg-forest text-white shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal hover:bg-forest/5'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Listings</span>
          {pendingProductsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-ukorange text-white text-[10px] font-bold rounded-full">
              {pendingProductsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('interests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'interests'
              ? 'bg-forest text-white shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal hover:bg-forest/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Waitlist &amp; Early Patrons ({interests.length})</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Tab 1: Artisan Applications */}
      {activeTab === 'sellers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-forest">
              Artisan &amp; Maker Applications ({sellers.length})
            </h2>
            <span className="text-xs text-charcoal-muted">
              {pendingSellersCount} Pending Verification
            </span>
          </div>

          {sellers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-xs text-charcoal-muted border border-forest/15">
              No seller applications recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {sellers.map((s) => (
                <div
                  key={s.user_id}
                  className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg font-bold text-forest">
                          {s.business_name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            s.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-muted flex items-center gap-2">
                        <span>Lead: <strong>{s.maker_name}</strong></span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-ukorange" />
                          {s.valley}, {s.state}
                        </span>
                      </p>
                      <p className="text-xs text-charcoal-muted">
                        Email: {s.contact_email} {s.contact_phone && `| Tel: ${s.contact_phone}`}
                      </p>
                    </div>

                    {s.status === 'pending' && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          disabled={!!actionLoading}
                          onClick={() => handleSellerAction(s.user_id, 'approve')}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors disabled:opacity-60"
                        >
                          {actionLoading === `seller-${s.user_id}-approve` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Approve Seller</span>
                        </button>
                        <button
                          disabled={!!actionLoading}
                          onClick={() => handleSellerAction(s.user_id, 'reject')}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors disabled:opacity-60"
                        >
                          {actionLoading === `seller-${s.user_id}-reject` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-2 text-xs">
                    <div>
                      <span className="text-charcoal-muted font-medium">Craft &amp; Materials: </span>
                      <span className="text-charcoal font-semibold">{s.craft_type} {s.materials && `(${s.materials})`}</span>
                    </div>
                    {s.bio && (
                      <div>
                        <span className="text-charcoal-muted font-medium">Heritage &amp; Workshop Story: </span>
                        <p className="text-charcoal mt-0.5 leading-relaxed">{s.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Product Listings */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-forest">
              Product Listings ({products.length})
            </h2>
            <span className="text-xs text-charcoal-muted">
              {pendingProductsCount} Pending Curation
            </span>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-xs text-charcoal-muted border border-forest/15">
              No products submitted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-forest/5 border border-forest/10 overflow-hidden flex-shrink-0">
                        {p.photos?.[0] ? (
                          <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-forest/40 m-auto mt-5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-bold text-forest">
                            {p.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              p.moderation_status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.moderation_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.moderation_status}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-muted">
                          Category: <span className="font-semibold capitalize">{p.category}</span> &bull; Maker: {p.maker_name} &bull; Valley: {p.origin_valley}
                        </p>
                        <p className="text-xs text-charcoal-muted">
                          Materials: {p.materials} {p.price_estimate && `| Fair Price: ₹${Number(p.price_estimate).toLocaleString('en-IN')}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {p.moderation_status === 'pending' && (
                        <>
                          <button
                            disabled={!!actionLoading}
                            onClick={() => handleProductAction(p.id, 'approve')}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve &amp; Publish</span>
                          </button>
                          <button
                            disabled={!!actionLoading}
                            onClick={() => handleProductAction(p.id, 'reject')}
                            className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors disabled:opacity-60"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      <select
                        value={p.inventory_status}
                        onChange={(e) => handleProductAction(p.id, 'set_inventory', e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm font-semibold text-forest focus:outline-hidden"
                      >
                        <option value="coming_soon">Coming Soon</option>
                        <option value="in_stock">In Stock</option>
                        <option value="made_to_order">Made to Order</option>
                        <option value="sold_out">Sold Out</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-xs text-charcoal-muted leading-relaxed pt-2 border-t border-forest/10">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Customer Interest & Early Patrons */}
      {activeTab === 'interests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-forest">
              Early Patron Waitlist ({interests.length})
            </h2>
            <span className="text-xs text-charcoal-muted">
              Verified guest notifications
            </span>
          </div>

          {interests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-xs text-charcoal-muted border border-forest/15">
              No customer waitlist entries yet.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-forest/15 shadow-soft overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-warm border-b border-forest/10 text-charcoal">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Guest</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Product / Category</th>
                    <th className="py-3 px-4 font-semibold">Notes</th>
                    <th className="py-3 px-4 font-semibold">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {interests.map((item) => (
                    <tr key={item.id} className="hover:bg-warm-canvas/50">
                      <td className="py-3 px-4 font-semibold text-forest">{item.guest_name}</td>
                      <td className="py-3 px-4 text-charcoal-muted">{item.guest_email}</td>
                      <td className="py-3 px-4 text-charcoal">
                        {item.products?.title || item.category || 'General Waitlist'}
                      </td>
                      <td className="py-3 px-4 text-charcoal-muted">{item.notes || '—'}</td>
                      <td className="py-3 px-4 text-charcoal-muted">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
