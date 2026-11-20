import { createPublicServerSupabaseClient } from '@/lib/supabase/server';
import { ProductsBrowser } from '@/components/products-browser';
import { BRAND } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Himalayan Products & Artisan Goods — ${BRAND.name}`,
  description:
    'Discover thoughtful products, regional craftsmanship and responsible brands from the Himalayan community.',
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

    if (!error && Array.isArray(data)) {
      products = data;
    }
  } catch {
    // Public catalogue remains usable with its honest Coming Soon state when data is unavailable.
    products = [];
  }

  const category = searchParams?.category || 'all';
  const query = searchParams?.q || '';

  return (
    <div className="relative overflow-hidden py-8 sm:py-12 pb-24">
      {/* Golden-hour Himalayan valley gradient & ridge silhouette matching homepage first two divs */}
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
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-12 h-64 w-full text-[#263D32]/[0.045]"
      >
        <path
          fill="currentColor"
          d="M0,224L120,192C240,160,480,96,720,112C960,128,1200,224,1320,256L1440,288L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"
        />
      </svg>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProductsBrowser
          products={products}
          initialCategory={category}
          initialQuery={query}
        />
      </div>
    </div>
  );
}
