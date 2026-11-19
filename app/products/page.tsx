import { createPublicServerSupabaseClient } from '@/lib/supabase/server';
import { ProductsBrowser } from '@/components/products-browser';
import { BRAND } from '@/lib/constants';

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
      .select('id, slug, title, category, description, inventory_status, photos, origin_valley, origin_state, maker_name, price_estimate, craft_type')
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
        <h1 className="font-serif text-4xl font-bold leading-tight text-forest sm:text-6xl">
          Discover Something Meaningful.
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-charcoal-muted sm:text-base">
          Explore products from independent makers and local creators. Only approved
          catalogue entries appear here; when no products are available, the page
          presents an honest coming-soon state.
        </p>
      </section>

      <ProductsBrowser
        products={products}
        initialCategory={category}
        initialQuery={query}
      />
    </div>
  );
}
