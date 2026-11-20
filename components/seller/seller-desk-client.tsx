'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  formatINR,
  normalizeProductPrices,
  resolveCanonicalCategory,
  resolveStockState,
  type InventoryAdjustmentReason,
} from '@/lib/marketplace';
import { NewProductWizard } from '@/components/seller/new-product-wizard';
import { SellerDeskGovernancePanel } from '@/components/seller-desk-governance-panel';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Boxes,
  ShoppingBag,
  ShieldCheck,
  Truck,
  BarChart3,
  Store,
  Settings,
  Search,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Home,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export type SellerDeskTabId =
  | 'overview'
  | 'products'
  | 'add_product'
  | 'inventory'
  | 'orders'
  | 'brands_verification'
  | 'shipping_returns'
  | 'analytics'
  | 'store_profile'
  | 'settings';

interface SellerDeskClientProps {
  initialSeller: any;
  initialProducts: any[];
  initialBrands?: any[];
  initialMovements?: any[];
  initialShippingProfile?: any;
  initialOrders?: any[];
  isAlsoHost?: boolean;
  initialTab?: SellerDeskTabId;
}

const DESK_TABS: ReadonlyArray<{
  id: SellerDeskTabId;
  label: string;
  icon: any;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'add_product', label: 'Add New Product', icon: PlusCircle },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  {
    id: 'brands_verification',
    label: 'Brands & Verification',
    icon: ShieldCheck,
  },
  { id: 'shipping_returns', label: 'Shipping & Returns', icon: Truck },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'store_profile', label: 'Store Profile', icon: Store },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export function SellerDeskClient({
  initialSeller,
  initialProducts = [],
  initialBrands = [],
  initialMovements = [],
  initialShippingProfile = null,
  initialOrders = [],
  isAlsoHost = false,
  initialTab = 'overview',
}: SellerDeskClientProps) {
  const [activeTab, setActiveTab] = useState<SellerDeskTabId>(initialTab);
  const [seller, setSeller] = useState<any>(initialSeller);
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [brands, setBrands] = useState<any[]>(initialBrands);
  const [movements, setMovements] = useState<any[]>(initialMovements);
  const [orders, setOrders] = useState<any[]>(initialOrders);

  // Products Table Filter State
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productSort, setProductSort] = useState<
    'newest' | 'price_asc' | 'price_desc' | 'stock_asc'
  >('newest');

  // Inventory Adjustment Modal State
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<string>('5');
  const [adjustReason, setAdjustReason] =
    useState<InventoryAdjustmentReason>('new_stock_added');
  const [adjustThreshold, setAdjustThreshold] = useState<string>('5');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Brand registration state
  const [newBrandForm, setNewBrandForm] = useState({
    name: '',
    brand_relationship: 'brand_owner',
    country_of_origin: 'India',
    origin_location: `${initialSeller?.valley || ''}, ${
      initialSeller?.state || 'Himachal Pradesh'
    }`,
    story: '',
  });

  // Shipping & Returns profile state
  const [shippingForm, setShippingForm] = useState({
    dispatch_address:
      initialShippingProfile?.dispatch_address ||
      initialSeller?.dispatch_address ||
      `${initialSeller?.valley || ''}, ${initialSeller?.state || 'Himachal Pradesh'}`,
    dispatch_city_valley:
      initialShippingProfile?.dispatch_city_valley || initialSeller?.valley || '',
    dispatch_state:
      initialShippingProfile?.dispatch_state ||
      initialSeller?.state ||
      'Himachal Pradesh',
    dispatch_pincode: initialShippingProfile?.dispatch_pincode || '',
    preferred_courier_partners:
      initialShippingProfile?.preferred_courier_partners ||
      'India Post Speed Post, Delhivery, BlueDart',
    standard_shipping_charge: String(
      initialShippingProfile?.standard_shipping_charge ?? 0
    ),
    free_shipping_threshold: String(
      initialShippingProfile?.free_shipping_threshold ?? 1500
    ),
    estimated_dispatch_timeline:
      initialShippingProfile?.estimated_dispatch_timeline || '2–4 business days',
    estimated_delivery_timeline:
      initialShippingProfile?.estimated_delivery_timeline ||
      '5–8 business days across India',
    delivery_coverage:
      initialShippingProfile?.delivery_coverage ||
      'Pan-India serviceable pin codes',
    tracking_provided: initialShippingProfile?.tracking_provided ?? true,
    return_policy_type:
      initialShippingProfile?.return_policy_type || 'replacement_only',
    return_window_days: String(
      initialShippingProfile?.return_window_days ?? 7
    ),
    return_policy_details:
      initialShippingProfile?.return_policy_details ||
      '7-day replacement for verified transit damage or manufacturing defect. Managed and fulfilled directly by the seller.',
    customer_support_contact:
      initialShippingProfile?.customer_support_contact ||
      initialSeller?.contact_email ||
      '',
  });

  // Store profile form state
  const [storeProfileForm, setStoreProfileForm] = useState({
    business_name: initialSeller?.business_name || '',
    bio: initialSeller?.bio || '',
    materials: initialSeller?.materials || '',
    contact_phone: initialSeller?.contact_phone || '',
  });

  const refreshDeskData = async () => {
    try {
      const res = await fetch('/api/products/seller-desk');
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.seller) setSeller(data.seller);
        if (Array.isArray(data.products)) setProducts(data.products);
        if (Array.isArray(data.brands)) setBrands(data.brands);
        if (Array.isArray(data.inventoryMovements))
          setMovements(data.inventoryMovements);
        if (Array.isArray(data.orders)) setOrders(data.orders);
      }
    } catch {
      // Ignore transient network errors
    }
  };

  // Real Overview Metrics (Part 8.3 — zero fabricated numbers)
  const metrics = useMemo(() => {
    let live = 0;
    let draft = 0;
    let pending = 0;
    let changesRequested = 0;
    let lowStock = 0;
    let outOfStock = 0;

    for (const p of products) {
      const status = String(p.moderation_status || 'pending').toLowerCase();
      if (status === 'approved' || status === 'published') live++;
      else if (status === 'draft') draft++;
      else if (status === 'rejected' || status === 'changes_requested')
        changesRequested++;
      else pending++;

      const stockState = resolveStockState(
        p.available_stock,
        p.low_stock_threshold,
        p.inventory_status
      );
      if (stockState.status === 'low_stock') lowStock++;
      if (stockState.status === 'out_of_stock') outOfStock++;
    }

    let newOrders = 0;
    let ordersInProgress = 0;
    let completedOrders = 0;
    for (const o of orders) {
      const st = String(o.fulfilment_status || 'new_order');
      if (st === 'new_order') newOrders++;
      else if (st === 'delivered') completedOrders++;
      else if (st !== 'cancelled' && st !== 'returned') ordersInProgress++;
    }

    return {
      total: products.length,
      live,
      draft,
      pending,
      changesRequested,
      lowStock,
      outOfStock,
      newOrders,
      ordersInProgress,
      completedOrders,
    };
  }, [products, orders]);

  // Filtered & sorted products for the Products & Inventory tables
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const list = products.filter((p) => {
      if (productStatusFilter !== 'all') {
        const st = String(p.moderation_status || 'pending').toLowerCase();
        if (st !== productStatusFilter) return false;
      }
      if (q) {
        const hay = [
          p.title,
          p.sku,
          p.brand_name,
          p.maker_name,
          p.category,
          p.subcategory,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (productSort === 'price_asc') {
        return (
          normalizeProductPrices(a).sellingPrice -
          normalizeProductPrices(b).sellingPrice
        );
      }
      if (productSort === 'price_desc') {
        return (
          normalizeProductPrices(b).sellingPrice -
          normalizeProductPrices(a).sellingPrice
        );
      }
      if (productSort === 'stock_asc') {
        const sa = resolveStockState(
          a.available_stock,
          a.low_stock_threshold,
          a.inventory_status
        ).availableStock;
        const sb = resolveStockState(
          b.available_stock,
          b.low_stock_threshold,
          b.inventory_status
        ).availableStock;
        return sa - sb;
      }
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });
  }, [products, productSearch, productStatusFilter, productSort]);

  const handleInventoryAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    setActionLoading(true);
    setFeedbackBanner(null);

    try {
      const res = await fetch('/api/products/seller-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_inventory',
          product_id: adjustingProduct.id,
          quantity_delta: Number(adjustDelta),
          reason: adjustReason,
          low_stock_threshold: Number(adjustThreshold),
          notes: adjustNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to adjust stock.');
      }

      setFeedbackBanner({
        type: 'success',
        text: data.message || 'Stock updated.',
      });
      setAdjustingProduct(null);
      await refreshDeskData();
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        text: err.message || 'Failed to update stock.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProductStatusAction = async (
    productId: string,
    targetStatus: 'pending' | 'draft' | 'archived'
  ) => {
    setActionLoading(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch('/api/products/seller-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_product_status',
          product_id: productId,
          target_status: targetStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Status update failed.');
      }
      setFeedbackBanner({
        type: 'success',
        text: data.message || 'Product status updated.',
      });
      await refreshDeskData();
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        text: err.message || 'Failed to update status.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegisterBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch('/api/products/seller-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_brand',
          ...newBrandForm,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit brand.');
      }
      setFeedbackBanner({
        type: 'success',
        text: data.message,
      });
      if (data.brand) {
        setBrands((prev) => [data.brand, ...prev]);
      }
      setNewBrandForm((prev) => ({ ...prev, name: '', story: '' }));
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        text: err.message || 'Failed to submit brand.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveShippingProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch('/api/products/seller-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_shipping_profile',
          ...shippingForm,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to save shipping profile.');
      }
      setFeedbackBanner({
        type: 'success',
        text: data.message || 'Shipping & return settings saved.',
      });
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        text: err.message || 'Failed to save shipping profile.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch('/api/products/seller-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_brand_profile',
          updates: storeProfileForm,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update store profile.');
      }
      if (data.seller) setSeller(data.seller);
      setFeedbackBanner({
        type: 'success',
        text: data.message || 'Public store profile saved.',
      });
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        text: err.message || 'Failed to update store profile.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const renderModerationStatusBadge = (status: string) => {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'approved' || s === 'published') {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
          <CheckCircle2 className="h-3 w-3 text-emerald-700" />
          <span>Approved / Live</span>
        </span>
      );
    }
    if (s === 'draft') {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-stone-200 px-2.5 py-0.5 text-[11px] font-bold text-stone-800">
          <span>Draft</span>
        </span>
      );
    }
    if (s === 'rejected' || s === 'changes_requested') {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-900">
          <XCircle className="h-3 w-3 text-red-700" />
          <span>Changes Requested</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
        <Clock className="h-3 w-3 text-amber-700" />
        <span>Pending Approval</span>
      </span>
    );
  };

  return (
    <div className="space-y-8" data-testid="seller-desk-workspace">
      {/* ====================================================================
          DIV 1: SELLER DESK SANCTUARY HEADER (HOMEPAGE FIRST-TWO-DIVS UI)
      ==================================================================== */}
      <section className="relative overflow-hidden rounded-[26px] sm:rounded-[34px] border border-[#D5C8B3]/80 bg-[linear-gradient(135deg,rgba(255,253,249,0.94)_0%,rgba(244,236,220,0.94)_50%,rgba(229,236,227,0.88)_100%)] p-6 sm:p-8 lg:p-10 shadow-[0_24px_60px_-20px_rgba(31,51,42,0.16)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#263D32] via-[#C55B23] to-[#263D32] opacity-80" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F332A] px-3 py-1 text-[11px] font-semibold tracking-wider text-[#FDE2A8] uppercase">
                <ShieldCheck className="h-3.5 w-3.5 text-[#FDE2A8]" />
                <span>Verified Seller Desk</span>
              </span>
              <span className="rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3 py-1 text-xs font-medium text-[#4E4A43]">
                {seller?.valley}, {seller?.state}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F332A]">
              {seller?.business_name || 'Himalayan Seller Desk'}
            </h1>
            <p className="text-xs sm:text-sm text-[#4E4A43] max-w-2xl">
              Manage your product catalogue, MRP &amp; automatic discounts,
              stock quantities, brand verification, and direct seller-fulfilled
              orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAlsoHost && (
              <Link
                href="/account/stays/host"
                data-testid="seller-desk-switch-to-host"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-4 py-2.5 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23] transition-colors"
              >
                <Home className="h-3.5 w-3.5 text-[#C55B23]" />
                <span>Host Dashboard</span>
              </Link>
            )}
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-4 py-2.5 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23] transition-colors"
            >
              <span>Public Storefront</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/seller/products/new"
              data-testid="seller-desk-add-product-cta"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C55B23] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#AE4D1B] transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add New Product</span>
            </Link>
          </div>
        </div>

        {/* 10 Navigation Tabs (Part 8.2) */}
        <nav
          aria-label="Seller Desk Sections"
          className="mt-7 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-[#D5C8B3]/70 pt-4"
        >
          {DESK_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setFeedbackBanner(null);
                }}
                data-testid={`seller-desk-tab-${tab.id}`}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#1F332A] text-[#FFFDF9] shadow-sm'
                    : 'text-[#4E4A43] hover:bg-[#FFFDF9] hover:text-[#1F332A]'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    active ? 'text-[#FDE2A8]' : 'text-[#C55B23]'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </section>

      {feedbackBanner && (
        <div
          className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-medium ${
            feedbackBanner.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-red-300 bg-red-50 text-red-900'
          }`}
          data-testid="seller-desk-feedback-banner"
        >
          <span>{feedbackBanner.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs font-bold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ====================================================================
          TAB 1: OVERVIEW (Part 8.3)
      ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8" data-testid="seller-desk-overview">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="rounded-2xl border border-[#D5C8B3]/80 bg-[#FFFDF9] p-4 sm:p-5 shadow-sm">
              <span className="text-[11px] font-semibold text-[#5C5549] uppercase tracking-wider">
                Total Products
              </span>
              <p className="mt-1 font-serif text-3xl font-bold text-[#1F332A]">
                {metrics.total}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D5C8B3]/80 bg-[#FFFDF9] p-4 sm:p-5 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Live on Storefront
              </span>
              <p className="mt-1 font-serif text-3xl font-bold text-emerald-900">
                {metrics.live}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D5C8B3]/80 bg-[#FFFDF9] p-4 sm:p-5 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                Pending Approval
              </span>
              <p className="mt-1 font-serif text-3xl font-bold text-amber-900">
                {metrics.pending}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D5C8B3]/80 bg-[#FFFDF9] p-4 sm:p-5 shadow-sm">
              <span className="text-[11px] font-semibold text-[#5C5549] uppercase tracking-wider">
                Drafts / Changes
              </span>
              <p className="mt-1 font-serif text-3xl font-bold text-[#1F332A]">
                {metrics.draft + metrics.changesRequested}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D5C8B3]/80 bg-[#FFFDF9] p-4 sm:p-5 shadow-sm">
              <span className="text-[11px] font-semibold text-[#C55B23] uppercase tracking-wider">
                Low / Out of Stock
              </span>
              <p className="mt-1 font-serif text-3xl font-bold text-[#C55B23]">
                {metrics.lowStock} / {metrics.outOfStock}
              </p>
            </div>
          </div>

          {/* Orders Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#D5C8B3]/80 bg-[#FAF4E8] p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#5C5549]">
                  New Orders to Accept
                </span>
                <p className="font-serif text-2xl font-bold text-[#1F332A] mt-0.5">
                  {metrics.newOrders}
                </p>
              </div>
              <ShoppingBag className="h-7 w-7 text-[#C55B23]" />
            </div>
            <div className="rounded-2xl border border-[#D5C8B3]/80 bg-[#FAF4E8] p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#5C5549]">
                  Orders in Fulfilment
                </span>
                <p className="font-serif text-2xl font-bold text-[#1F332A] mt-0.5">
                  {metrics.ordersInProgress}
                </p>
              </div>
              <Truck className="h-7 w-7 text-[#1F332A]" />
            </div>
            <div className="rounded-2xl border border-[#D5C8B3]/80 bg-[#FAF4E8] p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#5C5549]">
                  Completed Deliveries
                </span>
                <p className="font-serif text-2xl font-bold text-emerald-900 mt-0.5">
                  {metrics.completedOrders}
                </p>
              </div>
              <CheckCircle2 className="h-7 w-7 text-emerald-700" />
            </div>
          </div>

          {/* Empty Catalogue Onboarding Card or Quick Catalogue Preview */}
          {products.length === 0 ? (
            <div className="rounded-[26px] border border-[#2B4438] bg-[linear-gradient(145deg,#1D3027_0%,#263E33_54%,#2D463A_100%)] p-8 sm:p-10 text-center text-[#F8F3E8] space-y-4">
              <Package className="mx-auto h-10 w-10 text-[#FDE2A8]" />
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FFFDF9]">
                Add Your First Product
              </h2>
              <p className="mx-auto max-w-lg text-xs sm:text-sm text-[#E7DFC8]/90 leading-relaxed">
                Your Seller Desk is active. Launch the 8-step product creation
                wizard to submit your first product with MRP &amp; automatic
                discount pricing, stock quantity, provenance locations, and
                direct seller delivery terms.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href="/seller/products/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C55B23] px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#AE4D1B] transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Your First Product</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveTab('shipping_returns')}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#FDE2A8]/35 bg-white/10 px-5 py-3 text-xs sm:text-sm font-semibold text-[#FFFDF9] hover:bg-white/15 transition-colors"
                >
                  <span>Configure Shipping &amp; Returns</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[26px] border border-[#D5C8B3]/80 bg-[#FFFDF9] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-[#1F332A]">
                  Recent Products ({products.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="text-xs font-semibold text-[#C55B23] hover:underline"
                >
                  Manage All Products →
                </button>
              </div>
              <div className="divide-y divide-[#E5DEC9]">
                {products.slice(0, 4).map((prod) => {
                  const prices = normalizeProductPrices(prod);
                  const stock = resolveStockState(
                    prod.available_stock,
                    prod.low_stock_threshold,
                    prod.inventory_status
                  );
                  return (
                    <div
                      key={prod.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#D5C8B3] bg-[#EFE7D8]">
                          {prod.photos?.[0] ? (
                            <img
                              src={prod.photos[0]}
                              alt={prod.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="m-auto mt-3 h-5 w-5 text-[#1F332A]/40" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-sm font-bold text-[#1F332A]">
                              {prod.title}
                            </h3>
                            {renderModerationStatusBadge(prod.moderation_status)}
                          </div>
                          <p className="text-xs text-[#5C5549] mt-0.5">
                            Selling: <strong>{formatINR(prices.sellingPrice)}</strong>
                            {prices.hasDiscount && (
                              <>
                                {' '}
                                &bull; MRP:{' '}
                                <span className="line-through">
                                  {formatINR(prices.mrp)}
                                </span>{' '}
                                ({prices.discountPercentage}% OFF)
                              </>
                            )}{' '}
                            &bull; Stock: <strong>{stock.label}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustingProduct(prod);
                            setAdjustThreshold(
                              String(prod.low_stock_threshold ?? 5)
                            );
                            setActiveTab('inventory');
                          }}
                          className="rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3 py-1.5 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23]"
                        >
                          Adjust Stock
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 2: PRODUCTS MANAGEMENT (Part 9)
      ==================================================================== */}
      {activeTab === 'products' && (
        <div
          className="rounded-[26px] border border-[#D5C8B3]/80 bg-[#FFFDF9] p-6 sm:p-8 shadow-sm space-y-6"
          data-testid="seller-desk-products-tab"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5C8B3]/60 pb-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1F332A]">
                Products Catalogue ({filteredProducts.length})
              </h2>
              <p className="text-xs text-[#5C5549]">
                View MRP, selling price, automatic discount %, stock status, and
                curation approval state.
              </p>
            </div>
            <Link
              href="/seller/products/new"
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-[#C55B23] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#AE4D1B]"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add New Product</span>
            </Link>
          </div>

          {/* Search, Status Filter & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#5C5549]" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search by product name, SKU, brand, or category..."
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] pl-9 pr-4 py-2 text-xs text-[#1F332A]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
                className="rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3 py-2 text-xs font-semibold text-[#1F332A]"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved / Live</option>
                <option value="pending">Pending Approval</option>
                <option value="draft">Draft</option>
                <option value="rejected">Changes Requested</option>
              </select>

              <select
                value={productSort}
                onChange={(e) => setProductSort(e.target.value as any)}
                className="rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3 py-2 text-xs font-semibold text-[#1F332A]"
              >
                <option value="newest">Newest Updated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="stock_asc">Stock: Low to High</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Package className="mx-auto h-9 w-9 text-[#1F332A]/40" />
              <p className="font-serif text-lg font-bold text-[#1F332A]">
                No products match your filter
              </p>
              <Link
                href="/seller/products/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1F332A] px-5 py-2.5 text-xs font-semibold text-[#FFFDF9]"
              >
                <span>Create New Product</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D5C8B3] text-[11px] font-bold uppercase tracking-wider text-[#5C5549]">
                    <th className="py-3 pr-4">Product</th>
                    <th className="py-3 px-3">SKU &amp; Category</th>
                    <th className="py-3 px-3">Brand</th>
                    <th className="py-3 px-3">MRP</th>
                    <th className="py-3 px-3">Selling Price</th>
                    <th className="py-3 px-3">Discount</th>
                    <th className="py-3 px-3">Stock</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DEC9]">
                  {filteredProducts.map((prod) => {
                    const prices = normalizeProductPrices(prod);
                    const stockState = resolveStockState(
                      prod.available_stock,
                      prod.low_stock_threshold,
                      prod.inventory_status
                    );
                    const catDef = resolveCanonicalCategory(prod.category);

                    return (
                      <tr key={prod.id} className="hover:bg-[#FAF4E8]/60">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#D5C8B3] bg-[#EFE7D8]">
                              {prod.photos?.[0] ? (
                                <img
                                  src={prod.photos[0]}
                                  alt={prod.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="m-auto mt-3 h-4 w-4 text-[#1F332A]/40" />
                              )}
                            </div>
                            <div>
                              <span className="font-serif font-bold text-sm text-[#1F332A] block">
                                {prod.title}
                              </span>
                              <span className="text-[11px] text-[#5C5549]">
                                {prod.origin_valley}, {prod.origin_state}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-[11px] font-semibold text-[#1F332A] block">
                            {prod.sku || '—'}
                          </span>
                          <span className="text-[11px] text-[#5C5549]">
                            {catDef?.shortTitle || prod.category}
                            {prod.subcategory ? ` • ${prod.subcategory}` : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-[#1F332A]">
                          {prod.brand_name || prod.maker_name}
                        </td>
                        <td className="py-3.5 px-3 text-[#5C5549]">
                          {prices.mrp > 0 ? formatINR(prices.mrp) : '—'}
                        </td>
                        <td className="py-3.5 px-3 font-serif font-bold text-sm text-[#1F332A]">
                          {prices.sellingPrice > 0
                            ? formatINR(prices.sellingPrice)
                            : '—'}
                        </td>
                        <td className="py-3.5 px-3">
                          {prices.hasDiscount ? (
                            <span className="rounded-md bg-[#C55B23]/15 px-2 py-0.5 text-[11px] font-bold text-[#C55B23]">
                              {prices.discountPercentage}% OFF
                            </span>
                          ) : (
                            <span className="text-[#7A7265]">0%</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-semibold ${
                              stockState.status === 'out_of_stock'
                                ? 'text-red-700'
                                : stockState.status === 'low_stock'
                                ? 'text-amber-800'
                                : 'text-emerald-800'
                            }`}
                          >
                            {stockState.availableStock} ({stockState.label})
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          {renderModerationStatusBadge(prod.moderation_status)}
                        </td>
                        <td className="py-3.5 pl-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            {prod.moderation_status === 'approved' && (
                              <Link
                                href={`/products/${prod.slug}`}
                                className="rounded-lg border border-[#D5C8B3] bg-[#FFFDF9] px-2.5 py-1 text-[11px] font-semibold text-[#1F332A] hover:border-[#C55B23]"
                              >
                                View
                              </Link>
                            )}
                            {(prod.moderation_status === 'draft' ||
                              prod.moderation_status === 'rejected') && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() =>
                                  handleProductStatusAction(prod.id, 'pending')
                                }
                                className="rounded-lg bg-[#1F332A] px-2.5 py-1 text-[11px] font-semibold text-[#FFFDF9] hover:bg-[#C55B23]"
                              >
                                Submit for Review
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingProduct(prod);
                                setAdjustThreshold(
                                  String(prod.low_stock_threshold ?? 5)
                                );
                                setActiveTab('inventory');
                              }}
                              className="rounded-lg border border-[#D5C8B3] bg-[#FAF4E8] px-2.5 py-1 text-[11px] font-semibold text-[#1F332A] hover:border-[#C55B23]"
                            >
                              Inventory
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 3: ADD NEW PRODUCT (Part 10)
      ==================================================================== */}
      {activeTab === 'add_product' && (
        <NewProductWizard
          seller={seller}
          embedded
          onCompleted={() => {
            refreshDeskData();
          }}
        />
      )}

      {/* ====================================================================
          TAB 4: INVENTORY MANAGEMENT (Part 10.7)
      ==================================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-6" data-testid="seller-desk-inventory-tab">
          {adjustingProduct && (
            <form
              onSubmit={handleInventoryAdjustSubmit}
              className="rounded-[24px] border border-[#C55B23] bg-[#FFFDF9] p-6 shadow-md space-y-4"
              data-testid="inventory-adjustment-modal"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C55B23]">
                    Stock Adjustment &amp; Threshold Update
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#1F332A]">
                    {adjustingProduct.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="text-xs font-semibold text-[#5C5549] hover:text-[#1F332A]"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#1F332A] mb-1">
                    Quantity Change (Use + to add, - to deduct) *
                  </label>
                  <input
                    type="number"
                    required
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(e.target.value)}
                    className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5 text-sm font-bold text-[#1F332A]"
                  />
                  <span className="text-[11px] text-[#5C5549] mt-1 block">
                    Current Stock:{' '}
                    {
                      resolveStockState(
                        adjustingProduct.available_stock,
                        adjustingProduct.low_stock_threshold,
                        adjustingProduct.inventory_status
                      ).availableStock
                    }
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-[#1F332A] mb-1">
                    Adjustment Reason *
                  </label>
                  <select
                    value={adjustReason}
                    onChange={(e) =>
                      setAdjustReason(
                        e.target.value as InventoryAdjustmentReason
                      )
                    }
                    className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5 text-xs text-[#1F332A]"
                  >
                    <option value="new_stock_added">
                      New Batch / Stock Added
                    </option>
                    <option value="manual_correction">
                      Manual Audit Correction
                    </option>
                    <option value="damaged_or_unsellable">
                      Damaged / Unsellable Stock Removed
                    </option>
                    <option value="return_restocked">
                      Customer Return Restocked
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1F332A] mb-1">
                    Low-Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adjustThreshold}
                    onChange={(e) => setAdjustThreshold(e.target.value)}
                    className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5 text-sm text-[#1F332A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1F332A] px-5 py-2.5 text-xs font-semibold text-[#FFFDF9] hover:bg-[#C55B23]"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>Confirm Stock Adjustment</span>
                </button>
              </div>
            </form>
          )}

          <div className="rounded-[26px] border border-[#D5C8B3]/80 bg-[#FFFDF9] p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1F332A]">
                Stock &amp; Inventory Control
              </h2>
              <p className="text-xs text-[#5C5549]">
                Monitor available stock, reserved stock, and low-stock alert
                thresholds across all listings.
              </p>
            </div>

            {products.length === 0 ? (
              <p className="text-xs text-[#5C5549] py-6">
                No products in your catalogue yet. Add a product to track stock.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#D5C8B3] text-[11px] font-bold uppercase tracking-wider text-[#5C5549]">
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3">Available Stock</th>
                      <th className="py-3 px-3">Reserved</th>
                      <th className="py-3 px-3">Low-Stock Threshold</th>
                      <th className="py-3 px-3">Stock Status</th>
                      <th className="py-3 pl-3 text-right">Adjust</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DEC9]">
                    {products.map((prod) => {
                      const stockState = resolveStockState(
                        prod.available_stock,
                        prod.low_stock_threshold,
                        prod.inventory_status
                      );
                      return (
                        <tr key={prod.id}>
                          <td className="py-3 pr-4 font-serif font-bold text-sm text-[#1F332A]">
                            {prod.title}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px]">
                            {prod.sku || '—'}
                          </td>
                          <td className="py-3 px-3 font-bold text-sm text-[#1F332A]">
                            {stockState.availableStock}
                          </td>
                          <td className="py-3 px-3 text-[#5C5549]">
                            {prod.reserved_stock ?? 0}
                          </td>
                          <td className="py-3 px-3 text-[#5C5549]">
                            {stockState.lowStockThreshold} units
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${
                                stockState.status === 'in_stock'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : stockState.status === 'low_stock'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-red-100 text-red-900'
                              }`}
                            >
                              {stockState.label}
                            </span>
                          </td>
                          <td className="py-3 pl-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingProduct(prod);
                                setAdjustThreshold(
                                  String(stockState.lowStockThreshold)
                                );
                              }}
                              className="rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3 py-1.5 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23]"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {movements.length > 0 && (
            <div className="rounded-[24px] border border-[#D5C8B3]/80 bg-[#FFFDF9] p-6 space-y-3">
              <h3 className="font-serif text-lg font-bold text-[#1F332A]">
                Recent Inventory Movement History
              </h3>
              <div className="divide-y divide-[#E5DEC9] text-xs">
                {movements.slice(0, 10).map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <span className="font-semibold text-[#1F332A] capitalize">
                        {String(m.reason || '').replace(/_/g, ' ')}
                      </span>
                      {m.notes && (
                        <span className="text-[#5C5549] ml-2">({m.notes})</span>
                      )}
                    </div>
                    <div className="font-mono">
                      <span>{m.previous_stock}</span> →{' '}
                      <strong className="text-[#1F332A]">{m.new_stock}</strong> (
                      {m.quantity_delta > 0
                        ? `+${m.quantity_delta}`
                        : m.quantity_delta}
                      )
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 5: ORDERS & SELLER FULFILMENT (Part 13)
      ==================================================================== */}
      {activeTab === 'orders' && (
        <div
          className="rounded-[26px] border border-[#D5C8B3]/80 bg-[#FFFDF9] p-6 sm:p-8 shadow-sm space-y-6"
          data-testid="seller-desk-orders-tab"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D5C8B3]/60 pb-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1F332A]">
                Orders &amp; Direct Seller Fulfilment ({orders.length})
              </h2>
              <p className="text-xs text-[#5C5549]">
                Every order is packaged, dispatched, and delivered directly by
                your seller/brand using your configured delivery arrangements.
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <ShoppingBag className="mx-auto h-9 w-9 text-[#1F332A]/40" />
              <h3 className="font-serif text-lg font-bold text-[#1F332A]">
                No Customer Orders Yet
              </h3>
              <p className="mx-auto max-w-md text-xs text-[#5C5549] leading-relaxed">
                When customers place orders for your approved products, order
                items, delivery addresses, and shipment tracking controls will
                appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#D5C8B3] bg-[#FAF4E8] p-5 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-[#C55B23]">
                        Order #{item.marketplace_orders?.order_number || item.order_id}
                      </span>
                      <h4 className="font-serif text-base font-bold text-[#1F332A]">
                        {item.product_title} &times; {item.quantity}
                      </h4>
                    </div>
                    <span className="rounded-lg bg-[#1F332A] px-3 py-1 text-[11px] font-bold text-[#FDE2A8] uppercase">
                      {String(item.fulfilment_status || 'new_order').replace(
                        /_/g,
                        ' '
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 6: BRANDS & VERIFICATION (Part 11)
      ==================================================================== */}
      {activeTab === 'brands_verification' && (
        <div
          className="space-y-8"
          data-testid="seller-desk-brands-verification-tab"
        >
          {/* 3 Verification Levels Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9] p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C55B23]">
                  Level 1
                </span>
                <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                  Approved
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1F332A]">
                1. Verified Seller
              </h3>
              <p className="text-xs text-[#5C5549] leading-relaxed">
                Seller identity, contact details, business constitution, and
                operating location verified by Uttarkunth.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9] p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C55B23]">
                  Level 2
                </span>
                <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                  {brands.some((b) => b.verification_status === 'approved')
                    ? 'Approved'
                    : brands.length > 0
                    ? 'Under Review'
                    : 'Submit Brand Below'}
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1F332A]">
                2. Verified Brand
              </h3>
              <p className="text-xs text-[#5C5549] leading-relaxed">
                Confirms brand ownership, manufacturer authority, or official
                reseller authorization.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9] p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C55B23]">
                  Level 3
                </span>
                <span className="rounded-lg bg-[#1F332A] px-2.5 py-0.5 text-[11px] font-bold text-[#FDE2A8]">
                  Reviewed per Product
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1F332A]">
                3. Verified &amp; Authentic Product
              </h3>
              <p className="text-xs text-[#5C5549] leading-relaxed">
                Awarded by Uttarkunth reviewers after verifying product photos,
                origin claims, and category compliance.
              </p>
            </div>
          </div>

          {/* Submit Brand for Verification */}
          <form
            onSubmit={handleRegisterBrand}
            className="rounded-[26px] border border-[#D5C8B3]/80 bg-[#FFFDF9] p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h3 className="font-serif text-xl font-bold text-[#1F332A]">
              Submit Brand for Verification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1F332A] mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBrandForm.name}
                  onChange={(e) =>
                    setNewBrandForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Jari Forest Apiary"
                  className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1F332A] mb-1">
                  Your Relationship to Brand *
                </label>
                <select
                  value={newBrandForm.brand_relationship}
                  onChange={(e) =>
                    setNewBrandForm((prev) => ({
                      ...prev,
                      brand_relationship: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
                >
                  <option value="brand_owner">Brand Owner</option>
                  <option value="manufacturer">Manufacturer / Producer</option>
                  <option value="artisan_maker">Artisan Collective</option>
                  <option value="authorized_reseller">
                    Authorized Reseller
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1F332A] mb-1">
                  Brand Origin Location
                </label>
                <input
                  type="text"
                  value={newBrandForm.origin_location}
                  onChange={(e) =>
                    setNewBrandForm((prev) => ({
                      ...prev,
                      origin_location: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1F332A] mb-1">
                  Brand Story / Authorization Note
                </label>
                <input
                  type="text"
                  value={newBrandForm.story}
                  onChange={(e) =>
                    setNewBrandForm((prev) => ({
                      ...prev,
                      story: e.target.value,
                    }))
                  }
                  placeholder="Brief note on brand heritage or authorization..."
                  className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1F332A] px-5 py-2.5 text-xs font-semibold text-[#FFFDF9] hover:bg-[#C55B23]"
            >
              <span>Submit Brand for Verification</span>
            </button>
          </form>

          {/* Existing Private Compliance Vault */}
          <SellerDeskGovernancePanel seller={seller} />
        </div>
      )}

      {/* ====================================================================
          TAB 7: SHIPPING & RETURNS (Part 12)
      ==================================================================== */}
      {activeTab === 'shipping_returns' && (
        <form
          onSubmit={handleSaveShippingProfile}
          className="rounded-[26px] border border-[#D5C8B3]/80 bg-[#FFFDF9] p-6 sm:p-8 shadow-sm space-y-6"
          data-testid="seller-desk-shipping-tab"
        >
          <div className="rounded-2xl border border-[#2B4438] bg-[#1F332A] p-5 text-xs text-[#F8F3E8] space-y-1.5">
            <div className="flex items-center gap-2 text-[#FDE2A8] font-bold">
              <Truck className="h-4 w-4" />
              <span>Direct Seller / Brand Fulfilment Policy</span>
            </div>
            <p className="leading-relaxed text-[#E7DFC8]/95">
              Every product listed on Uttarkunth is packaged, dispatched, and
              physically delivered directly by its respective seller or brand
              using their own delivery arrangements. Uttarkunth provides the
              marketplace for discovery and seller connections and does not
              operate physical product logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1F332A] mb-1">
                Primary Dispatch Address *
              </label>
              <input
                type="text"
                required
                value={shippingForm.dispatch_address}
                onChange={(e) =>
                  setShippingForm((prev) => ({
                    ...prev,
                    dispatch_address: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F332A] mb-1">
                Courier / Delivery Partners Used *
              </label>
              <input
                type="text"
                value={shippingForm.preferred_courier_partners}
                onChange={(e) =>
                  setShippingForm((prev) => ({
                    ...prev,
                    preferred_courier_partners: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F332A] mb-1">
                Delivery Coverage Regions
              </label>
              <input
                type="text"
                value={shippingForm.delivery_coverage}
                onChange={(e) =>
                  setShippingForm((prev) => ({
                    ...prev,
                    delivery_coverage: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F332A] mb-1">
                Standard Shipping Charge (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                value={shippingForm.standard_shipping_charge}
                onChange={(e) =>
                  setShippingForm((prev) => ({
                    ...prev,
                    standard_shipping_charge: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F332A] mb-1">
                Free Shipping Threshold (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                value={shippingForm.free_shipping_threshold}
                onChange={(e) =>
                  setShippingForm((prev) => ({
                    ...prev,
                    free_shipping_threshold: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F332A] mb-1">
                Estimated Dispatch Timeline *
              </label>
              <input
                type="text"
                value={shippingForm.estimated_dispatch_timeline}
                onChange={(e) =>
                  setShippingForm((prev) => ({
                    ...prev,
                    estimated_dispatch_timeline: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F332A] mb-1">
                Return / Replacement Window (Days)
              </label>
              <input
                type="number"
                min="0"
                value={shippingForm.return_window_days}
                onChange={(e) =>
                  setShippingForm((prev) => ({
                    ...prev,
                    return_window_days: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1F332A] mb-1">
                Detailed Return &amp; Replacement Policy
              </label>
              <textarea
                rows={3}
                value={shippingForm.return_policy_details}
                onChange={(e) =>
                  setShippingForm((prev) => ({
                    ...prev,
                    return_policy_details: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C55B23] px-6 py-3 text-xs font-semibold text-white hover:bg-[#AE4D1B]"
          >
            <span>Save Shipping &amp; Return Policy</span>
          </button>
        </form>
      )}

      {/* ====================================================================
          TAB 8: ANALYTICS (Real Catalogue & Stock Health)
      ==================================================================== */}
      {activeTab === 'analytics' && (
        <div
          className="rounded-[26px] border border-[#D5C8B3]/80 bg-[#FFFDF9] p-6 sm:p-8 shadow-sm space-y-6"
          data-testid="seller-desk-analytics-tab"
        >
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1F332A]">
              Catalogue &amp; Fulfilment Analytics
            </h2>
            <p className="text-xs text-[#5C5549]">
              Real-time metrics calculated strictly from your actual product
              listings, stock movements, and customer orders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-2xl border border-[#D5C8B3] bg-[#FAF4E8] p-5 space-y-1">
              <span className="text-[#5C5549]">Catalogue Approval Rate</span>
              <p className="font-serif text-2xl font-bold text-[#1F332A]">
                {metrics.total > 0
                  ? `${Math.round((metrics.live / metrics.total) * 100)}%`
                  : '0%'}
              </p>
              <span className="text-[11px] text-[#5C5549]">
                {metrics.live} of {metrics.total} listings approved
              </span>
            </div>

            <div className="rounded-2xl border border-[#D5C8B3] bg-[#FAF4E8] p-5 space-y-1">
              <span className="text-[#5C5549]">Healthy In-Stock Listings</span>
              <p className="font-serif text-2xl font-bold text-emerald-900">
                {Math.max(
                  0,
                  metrics.total - metrics.lowStock - metrics.outOfStock
                )}
              </p>
              <span className="text-[11px] text-[#5C5549]">
                {metrics.lowStock} low stock &bull; {metrics.outOfStock} out of
                stock
              </span>
            </div>

            <div className="rounded-2xl border border-[#D5C8B3] bg-[#FAF4E8] p-5 space-y-1">
              <span className="text-[#5C5549]">Verified Fulfilment Orders</span>
              <p className="font-serif text-2xl font-bold text-[#1F332A]">
                {orders.length}
              </p>
              <span className="text-[11px] text-[#5C5549]">
                {metrics.completedOrders} delivered &bull; {metrics.newOrders}{' '}
                awaiting acceptance
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 9: STORE PROFILE
      ==================================================================== */}
      {activeTab === 'store_profile' && (
        <form
          onSubmit={handleSaveStoreProfile}
          className="rounded-[26px] border border-[#D5C8B3]/80 bg-[#FFFDF9] p-6 sm:p-8 shadow-sm space-y-5"
          data-testid="seller-desk-store-profile-tab"
        >
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1F332A]">
              Public Store &amp; Maker Profile
            </h2>
            <p className="text-xs text-[#5C5549]">
              Update the public store name, heritage story, and materials shown
              on your product detail pages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1F332A] mb-1">
                Public Store / Brand Name *
              </label>
              <input
                type="text"
                required
                value={storeProfileForm.business_name}
                onChange={(e) =>
                  setStoreProfileForm((prev) => ({
                    ...prev,
                    business_name: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1F332A] mb-1">
                Customer Support / Contact Phone
              </label>
              <input
                type="text"
                value={storeProfileForm.contact_phone}
                onChange={(e) =>
                  setStoreProfileForm((prev) => ({
                    ...prev,
                    contact_phone: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1F332A] mb-1">
                Primary Natural Materials &amp; Ingredients
              </label>
              <input
                type="text"
                value={storeProfileForm.materials}
                onChange={(e) =>
                  setStoreProfileForm((prev) => ({
                    ...prev,
                    materials: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1F332A] mb-1">
                Maker / Brand Heritage Story
              </label>
              <textarea
                rows={4}
                value={storeProfileForm.bio}
                onChange={(e) =>
                  setStoreProfileForm((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3.5 py-2.5"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1F332A] px-6 py-3 text-xs font-semibold text-[#FFFDF9] hover:bg-[#C55B23]"
          >
            <span>Save Public Store Profile</span>
          </button>
        </form>
      )}

      {/* ====================================================================
          TAB 10: SETTINGS
      ==================================================================== */}
      {activeTab === 'settings' && (
        <div
          className="rounded-[26px] border border-[#D5C8B3]/80 bg-[#FFFDF9] p-6 sm:p-8 shadow-sm space-y-6"
          data-testid="seller-desk-settings-tab"
        >
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1F332A]">
              Seller Desk Settings &amp; Connected Workspaces
            </h2>
            <p className="text-xs text-[#5C5549]">
              Manage seller notifications, compliance status, and connected
              Uttarkunth partner roles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-2xl border border-[#D5C8B3] bg-[#FAF4E8] p-5 space-y-2">
              <span className="font-bold text-[#1F332A] block">
                Registered Seller Account Email
              </span>
              <span className="text-[#5C5549] block">
                {seller?.contact_email || 'Linked to your Uttarkunth account'}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold pt-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Order, stock, and moderation alerts active</span>
              </span>
            </div>

            <div className="rounded-2xl border border-[#D5C8B3] bg-[#FAF4E8] p-5 space-y-2">
              <span className="font-bold text-[#1F332A] block">
                Connected Uttarkunth Workspaces
              </span>
              <p className="text-[#5C5549]">
                {isAlsoHost
                  ? 'Your account holds both Verified Host and Verified Seller roles. You can switch between Host Dashboard and Seller Desk anytime.'
                  : 'Your account is active as a Verified Seller. You can also apply to host a Himalayan homestay anytime.'}
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                {isAlsoHost ? (
                  <Link
                    href="/account/stays/host"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F332A] px-3.5 py-2 text-xs font-semibold text-[#FFFDF9]"
                  >
                    <Home className="h-3.5 w-3.5 text-[#FDE2A8]" />
                    <span>Open Host Dashboard</span>
                  </Link>
                ) : (
                  <Link
                    href="/stays/list-property"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2 text-xs font-semibold text-[#1F332A]"
                  >
                    <span>Explore Homestay Hosting</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
