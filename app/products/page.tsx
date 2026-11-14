import Link from 'next/link';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';
import { ProductsBrowser } from '@/components/products-browser';
import { BRAND } from '@/lib/constants';
import { ArrowRight, Clock, Store } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Himalayan Products & Artisan Goods — ${BRAND.name}`,
  description:
    'Discover products from Himalayan makers, local creators, and responsible businesses, with listings shown only after approval.',
  alternates: { canonical: 'https://uttarkunth.com/products' },
};

interface ProductsPageProps {
  searchParams?: {
    category?: string;
    q?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  let products: any[] = [];

  try {
    const supabase = createPublicServerSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    if (!error && data) products = data;
  } catch {
    // Public catalogue remains usable with its honest empty state when data is unavailable.
    products = [];
  }

  const category = searchParams?.category || 'all';
  const query = searchParams?.q || '';

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 pb-24 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-5 pt-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-terracotta/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-terracotta">
          <Clock className="h-4 w-4" /> Pillar II · Himalayan Products
        </span>
        <h1 className="font-serif text-4xl font-bold leading-tight text-forest sm:text-6xl">
          Discover Something Meaningful.
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-charcoal-muted sm:text-base">
          Explore products from independent makers and local creators. Only approved
          catalogue entries appear here; when no products are available, the page
          presents an honest coming-soon state.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/products/sell" className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-xs font-semibold text-white transition hover:bg-terracotta/90">
            <Store className="h-4 w-4" /> Sell your products <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/contact?subject=Product%20Catalogue%20Enquiry" className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-white px-6 py-3 text-xs font-semibold text-forest transition hover:bg-forest/5">
            Join early updates
          </Link>
        </div>
      </section>

      <ProductsBrowser
        products={products}
        initialCategory={category}
        initialQuery={query}
      />
    </div>
  );
}
