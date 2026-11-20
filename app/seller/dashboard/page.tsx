import React from 'react';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BRAND } from '@/lib/constants';
import {
  SellerDeskClient,
  type SellerDeskTabId,
} from '@/components/seller/seller-desk-client';
import { SellerDeskGovernancePanel } from '@/components/seller-desk-governance-panel';
import {
  Store,
  Clock,
  AlertCircle,
  ArrowRight,
  Home,
  LogIn,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Seller Desk — ${BRAND.name}`,
  description:
    'Manage your Himalayan product catalogue, MRP & automatic discounts, stock quantities, brand verification, and direct seller-fulfilled orders.',
};

interface SellerDashboardPageProps {
  searchParams?:
    | Promise<{
        tab?: string;
      }>
    | {
        tab?: string;
      };
}

export default async function SellerDashboardPage({
  searchParams,
}: SellerDashboardPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});

  let user: any = null;
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    user = null;
  }

  let isAlsoHost = false;
  let seller: any = null;
  let products: any[] = [];
  let brands: any[] = [];
  let movements: any[] = [];
  let shippingProfile: any = null;
  let orders: any[] = [];

  if (user) {
    try {
      const adminClient = createAdminClient();

      // 1. Check whether user is also an approved Host (Part 7 Scenario C)
      try {
        const { count: ownedCount } = await adminClient
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('host_id', user.id);
        if ((ownedCount || 0) > 0) {
          isAlsoHost = true;
        } else {
          const { count: assignedCount } = await (
            adminClient.from('property_hosts') as any
          )
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .in('role', ['manager', 'co_host']);
          isAlsoHost = (assignedCount || 0) > 0;
        }
      } catch {
        isAlsoHost = false;
      }

      // 2. Fetch seller profile
      const { data: sellerData } = await adminClient
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      seller = sellerData || null;

      const sellerRowId = (seller as any)?.id || user.id;

      // 3. Load products, brands, inventory movements, shipping profile, and orders
      if (seller) {
        try {
          const { data: prodData } = await adminClient
            .from('products')
            .select('*')
            .in('seller_id', [sellerRowId, user.id])
            .order('created_at', { ascending: false });
          products = prodData || [];
        } catch {
          products = [];
        }

        try {
          const { data: brandData } = await (
            adminClient.from('brands' as any) as any
          )
            .select('*')
            .eq('seller_user_id', user.id)
            .order('created_at', { ascending: false });
          brands = brandData || [];
        } catch {
          brands = [];
        }

        try {
          const { data: movData } = await (
            adminClient.from('inventory_movements' as any) as any
          )
            .select('*')
            .eq('seller_id', sellerRowId)
            .order('created_at', { ascending: false })
            .limit(30);
          movements = movData || [];
        } catch {
          movements = [];
        }

        try {
          const { data: shipData } = await (
            adminClient.from('seller_shipping_profiles' as any) as any
          )
            .select('*')
            .eq('seller_user_id', user.id)
            .maybeSingle();
          shippingProfile = shipData || null;
        } catch {
          shippingProfile = null;
        }

        try {
          const { data: orderData } = await (
            adminClient.from('marketplace_order_items' as any) as any
          )
            .select('*, marketplace_orders(*)')
            .eq('seller_id', sellerRowId)
            .order('created_at', { ascending: false });
          orders = orderData || [];
        } catch {
          orders = [];
        }
      }
    } catch {
      seller = null;
    }
  }

  const rawTab = String(resolvedSearchParams?.tab || 'overview');
  const initialTab: SellerDeskTabId = [
    'overview',
    'products',
    'add_product',
    'inventory',
    'orders',
    'brands_verification',
    'shipping_returns',
    'analytics',
    'store_profile',
    'settings',
  ].includes(rawTab)
    ? (rawTab as SellerDeskTabId)
    : 'overview';

  const activeSellerOrPreview = seller || {
    business_name: 'Uttarkunth Seller Desk',
    valley: 'Parvati & Kullu Valley',
    state: 'Himachal Pradesh',
    status: 'approved',
    contact_email: user?.email || BRAND.email,
  };

  return (
    <div className="relative overflow-hidden py-8 sm:py-12 pb-24">
      {/* Golden-hour Himalayan valley canvas matching the homepage first two divs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(245,240,230,0)_0%,rgba(244,230,204,0.88)_22%,rgba(235,216,186,0.72)_54%,rgba(242,231,212,0.82)_80%,#F5F0E6_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-[380px] w-[540px] -translate-x-1/2 rounded-full bg-[#C55B23]/[0.12] blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 right-1/4 h-[400px] w-[520px] translate-x-1/3 rounded-full bg-[#263D32]/[0.12] blur-[130px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Notice Banner when visitor is not signed in or has not registered a seller profile yet */}
        {!seller && (
          <div
            className="rounded-[24px] border border-[#D5C8B3] bg-[linear-gradient(135deg,#FFFDF9_0%,#FAF4E8_100%)] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            data-testid="seller-desk-not-registered"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1F332A] text-[#FDE2A8]">
                <Store className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C55B23]">
                  Uttarkunth Seller &amp; Brand Partner Desk
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#1F332A]">
                  {user
                    ? 'Complete Your Seller & Brand Registration'
                    : 'Explore the Seller Desk Workspace'}
                </h2>
                <p className="font-sans font-normal text-xs sm:text-sm text-[#4E4A43] leading-relaxed max-w-2xl">
                  {user
                    ? 'Apply as an individual maker, cooperative, brand owner, manufacturer, or authorized reseller to publish verified products.'
                    : 'Sign in with your approved seller account or submit a Seller & Brand Partner application to publish products and manage live orders.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {!user && (
                <Link
                  href="/login?next=/seller/dashboard"
                  className="font-sans inline-flex items-center gap-2 rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-4 py-2.5 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23] transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5 text-[#C55B23]" />
                  <span>Seller Sign In</span>
                </Link>
              )}
              <Link
                href="/products/sell"
                className="font-sans inline-flex items-center gap-2 rounded-xl bg-[#C55B23] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#AE4D1B] transition-colors"
              >
                <span>Start Seller Application</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {isAlsoHost && (
                <Link
                  href="/account/stays/host"
                  className="font-sans inline-flex items-center gap-2 rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-4 py-2.5 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23]"
                >
                  <Home className="h-3.5 w-3.5 text-[#C55B23]" />
                  <span>Open Host Dashboard</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Case 2: Seller application is in Draft / Pending / Under Review (Scenario E) */}
        {seller &&
          ['draft', 'submitted', 'pending', 'under_review', 'info_requested'].includes(
            seller.status
          ) && (
            <div
              className="space-y-6"
              data-testid="seller-desk-pending-review"
            >
              <div className="rounded-[28px] border border-amber-300 bg-[#FFFDF9] p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                        {seller.status === 'draft'
                          ? 'Application Draft Saved'
                          : 'Seller Application Status: Pending Review'}
                      </span>
                      <h1 className="font-serif text-xl sm:text-2xl font-medium text-[#1F332A]">
                        {seller.business_name} ({seller.valley}, {seller.state})
                      </h1>
                    </div>
                  </div>

                  {seller.status === 'draft' && (
                    <Link
                      href="/products/sell"
                      className="font-sans inline-flex items-center gap-2 rounded-xl bg-[#C55B23] px-5 py-2.5 text-xs font-semibold text-white"
                    >
                      <span>Complete &amp; Submit Application</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>

                <p className="font-sans font-normal text-xs sm:text-sm text-[#4E4A43] leading-relaxed max-w-3xl">
                  {seller.status === 'draft'
                    ? 'Your seller registration is currently saved as a draft. Complete your verification dossier and submit it for review to unlock product creation and inventory management.'
                    : 'Our Products & Compliance team is reviewing your workshop provenance, GSTIN/tax declaration, and category licences. Full Seller Desk product, inventory, and order controls unlock automatically once your seller profile is approved. You may upload supplemental documents below while under review.'}
                </p>
              </div>

              <SellerDeskGovernancePanel seller={seller} />
            </div>
          )}

        {/* Case 3: Seller application Rejected or Suspended */}
        {seller && ['rejected', 'suspended'].includes(seller.status) && (
          <div className="space-y-6" data-testid="seller-desk-rejected">
            <div className="rounded-[28px] border border-red-300 bg-[#FFFDF9] p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-800">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-red-800">
                    Seller Application Requires Revision
                  </span>
                  <h1 className="font-serif text-xl sm:text-2xl font-medium text-[#1F332A]">
                    {seller.business_name}
                  </h1>
                </div>
              </div>
              <p className="font-sans font-normal text-xs sm:text-sm text-[#4E4A43] leading-relaxed max-w-3xl">
                Our compliance reviewers requested additional provenance or
                statutory licence documentation before activating your Seller
                Desk. Please upload the requested replacement documents below or
                update your application details.
              </p>
            </div>

            <SellerDeskGovernancePanel seller={seller} />
          </div>
        )}

        {/* 10-Tab Professional Seller Desk Workspace */}
        {(!seller || seller.status === 'approved') && (
          <SellerDeskClient
            initialSeller={activeSellerOrPreview}
            initialProducts={products}
            initialBrands={brands}
            initialMovements={movements}
            initialShippingProfile={shippingProfile}
            initialOrders={orders}
            isAlsoHost={isAlsoHost}
            initialTab={initialTab}
          />
        )}
      </div>
    </div>
  );
}
