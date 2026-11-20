import React from 'react';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NewProductWizard } from '@/components/seller/new-product-wizard';
import { BRAND } from '@/lib/constants';
import { Store, Clock, ArrowRight, LogIn } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Add New Product — Seller Desk — ${BRAND.name}`,
  description:
    'Create and submit a new product listing with verified Himalayan provenance, automatic MRP discount calculation, and direct seller delivery terms.',
};

export default async function SellerNewProductPage() {
  let user: any = null;
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    user = null;
  }

  let seller: any = null;
  if (user) {
    try {
      const adminClient = createAdminClient();
      const { data: sellerData } = await adminClient
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      seller = sellerData || null;
    } catch {
      seller = null;
    }
  }

  const activeSellerOrPreview = seller || {
    business_name: 'Uttarkunth Seller Desk',
    valley: 'Parvati & Kullu Valley',
    state: 'Himachal Pradesh',
    status: 'approved',
  };

  return (
    <div className="relative overflow-hidden py-8 sm:py-12 pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(245,240,230,0)_0%,rgba(244,230,204,0.88)_25%,rgba(235,216,186,0.72)_60%,#F5F0E6_100%)]"
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
        {(!seller || seller.status !== 'approved') && (
          <div className="rounded-[24px] border border-[#D5C8B3] bg-[#FFFDF9] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                {seller ? <Clock className="h-5 w-5" /> : <Store className="h-5 w-5" />}
              </div>
              <div className="space-y-1">
                <h2 className="font-serif text-lg sm:text-xl font-medium text-[#1F332A]">
                  {seller
                    ? `Seller Account (${seller.status})`
                    : 'Seller Account Required to Publish Live Listings'}
                </h2>
                <p className="font-sans font-normal text-xs text-[#4E4A43] max-w-xl leading-relaxed">
                  {seller
                    ? `Your seller profile (${seller.business_name}) is currently ${seller.status}. Product submissions publish once your seller application is approved.`
                    : 'You can preview the 8-step product creation wizard below. Sign in with an approved seller account or register as a seller partner to submit products for moderation.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {!user && (
                <Link
                  href="/login?next=/seller/products/new"
                  className="font-sans inline-flex items-center gap-1.5 rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-4 py-2 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23] transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5 text-[#C55B23]" />
                  <span>Sign In</span>
                </Link>
              )}
              <Link
                href={seller ? '/seller/dashboard' : '/products/sell'}
                className="font-sans inline-flex items-center gap-1.5 rounded-xl bg-[#1F332A] px-4 py-2 text-xs font-semibold text-[#FFFDF9] hover:bg-[#C55B23] transition-colors"
              >
                <span>
                  {seller ? 'Return to Seller Desk' : 'Become a Seller / Partner'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        <NewProductWizard seller={activeSellerOrPreview as any} />
      </div>
    </div>
  );
}
