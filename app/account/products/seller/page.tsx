import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SellerProductSubmitForm } from '@/components/seller-product-submit-form';
import { SellerDeskGovernancePanel } from '@/components/seller-desk-governance-panel';
import {
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SellerWorkspacePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/products/seller');
  }

  const adminClient = createAdminClient();

  // 1. Fetch seller profile
  const { data: seller } = await adminClient
    .from('sellers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // 2. If approved seller, fetch their product listings
  let products: any[] = [];
  if (seller && seller.status === 'approved') {
    const { data: prodData } = await adminClient
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    products = prodData || [];
  }

  const getModerationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Approved &amp; Live
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Revision Requested
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending Curation Review
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-full">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
            Artisan Collective &amp; Brand Desk
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
            Seller Workspace
          </h1>
          <p className="text-xs text-charcoal-muted mt-1">
            Manage your Himalayan workshop profile, private business &amp; GSTIN compliance vault, and curated product catalog.
          </p>
        </div>

        <Link
          href="/products"
          className="text-xs text-forest hover:text-ukorange font-semibold flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View Public Marketplace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Case 1: Not a registered seller yet */}
      {!seller && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-soft text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-forest/10 text-forest flex items-center justify-center mx-auto">
            <Store className="w-7 h-7 text-ukorange" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="font-serif text-2xl font-bold text-forest">
              Join the Uttarkunth Artisan Collective
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              You haven&rsquo;t registered as a seller yet. We welcome master weavers, high-altitude beekeepers, herbalists, and traditional craft families across the Himalayas.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/products/sell"
              className="inline-flex items-center gap-2 bg-forest hover:bg-forest-hover text-white px-6 py-3 rounded-xl font-semibold text-xs transition-all shadow-xs"
            >
              <span>Submit Seller Application</span>
              <ArrowRight className="w-4 h-4 text-ukorange" />
            </Link>
          </div>
        </div>
      )}

      {/* Case 2: Application under review */}
      {seller && seller.status === 'pending' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-amber-300 ring-1 ring-amber-200/60 shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-forest">
                  Seller Application &amp; Compliance Dossier Under Review
                </h2>
                <span className="text-xs text-charcoal-muted">
                  Submitted for <strong>{seller.business_name}</strong> ({seller.valley}, {seller.state})
                </span>
              </div>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed max-w-2xl">
              Our Marketplace &amp; Compliance team is verifying your craft provenance, tax status, and category licences. You can still upload replacement or supplemental compliance documents below while your dossier is under review.
            </p>
          </div>

          <SellerDeskGovernancePanel seller={seller} />
        </div>
      )}

      {/* Case 3: Application rejected / revision requested */}
      {seller && seller.status === 'rejected' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-red-300 ring-1 ring-red-200 shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-800 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-forest">
                  Application Needs Revision or Supplemental Licences
                </h2>
                <span className="text-xs text-charcoal-muted">{seller.business_name}</span>
              </div>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed max-w-2xl">
              Our compliance team requested additional provenance or statutory documentation before approving your seller account. Upload replacement documents in the Compliance Vault below.
            </p>
          </div>

          <SellerDeskGovernancePanel seller={seller} />
        </div>
      )}

      {/* Case 4: Approved seller dashboard */}
      {seller && seller.status === 'approved' && (
        <div className="space-y-8">
          {/* Seller Overview Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Himalayan Maker
                </span>
                <span className="text-xs text-charcoal-muted">{seller.craft_type}</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-forest">
                {seller.business_name}
              </h2>
              <p className="text-xs text-charcoal-muted flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-ukorange" />
                <span>
                  {seller.valley}, {seller.state}
                </span>
                <span>&bull;</span>
                <span>Lead: {seller.maker_name}</span>
              </p>
            </div>

            <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 text-xs text-charcoal-muted space-y-1 max-w-xs">
              <span className="font-semibold text-forest block">Ethical Curation Standard</span>
              <span>
                All product submissions undergo inspection for pure natural materials and category licences prior to public listing.
              </span>
            </div>
          </div>

          {/* Seller Brand & Private Compliance Vault */}
          <SellerDeskGovernancePanel seller={seller} />

          {/* Product Submission Section */}
          <SellerProductSubmitForm />

          {/* Product Listings Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-forest/10">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-forest" />
                <h3 className="font-serif text-xl font-bold text-forest">
                  Your Product Catalog ({products.length})
                </h3>
              </div>
              <span className="text-xs text-charcoal-muted">
                {products.filter((p) => p.moderation_status === 'approved').length} Active in Storefront
              </span>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Package className="w-8 h-8 text-forest/40 mx-auto" />
                <h4 className="font-serif text-base font-bold text-forest">
                  No products submitted yet
                </h4>
                <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                  Use the submission form above to add your first handcrafted batch or mountain harvest.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-forest/10">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-forest/5 border border-forest/10 overflow-hidden flex-shrink-0">
                        {prod.photos?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.photos[0]}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-forest/40 m-auto mt-4" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-forest text-sm">{prod.title}</h4>
                          {getModerationBadge(prod.moderation_status)}
                        </div>
                        <p className="text-xs text-charcoal-muted">
                          Category: <span className="capitalize">{prod.category}</span> &bull;
                          Materials: {prod.materials}
                        </p>
                        <p className="text-[11px] text-charcoal-muted">
                          Status:{' '}
                          <span className="capitalize font-semibold text-charcoal">
                            {prod.inventory_status.replace('_', ' ')}
                          </span>
                          {prod.price_estimate &&
                            ` • Est: ₹${Number(prod.price_estimate).toLocaleString('en-IN')}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {prod.moderation_status === 'approved' && (
                        <Link
                          href={`/products/${prod.slug}`}
                          className="px-3.5 py-1.5 bg-ivory-warm hover:bg-forest/10 text-forest text-xs font-semibold rounded-xl border border-forest/20 transition-colors"
                        >
                          View Public Page
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}