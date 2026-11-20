'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MARKETPLACE_CATEGORIES,
  calculateProductDiscount,
  formatINR,
  type CanonicalCategorySlug,
} from '@/lib/marketplace';
import { ProductCard } from '@/components/products/product-card';
import {
  Package,
  Store,
  MapPin,
  Image as ImageIcon,
  Tag,
  Layers,
  Truck,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Upload,
} from 'lucide-react';

interface NewProductWizardProps {
  seller: {
    id?: string;
    user_id: string;
    business_name: string;
    maker_name: string;
    valley: string;
    state: string;
    craft_type?: string;
  };
  onCompleted?: () => void;
  embedded?: boolean;
}

const WIZARD_STEPS = [
  { step: 1, title: '1. Basic Info', icon: Package },
  { step: 2, title: '2. Brand Info', icon: Store },
  { step: 3, title: '3. Origin & Specs', icon: MapPin },
  { step: 4, title: '4. Product Images', icon: ImageIcon },
  { step: 5, title: '5. Pricing & Discount', icon: Tag },
  { step: 6, title: '6. Stock & Variants', icon: Layers },
  { step: 7, title: '7. Delivery & Returns', icon: Truck },
  { step: 8, title: '8. Preview & Submit', icon: Eye },
] as const;

export function NewProductWizard({
  seller,
  onCompleted,
  embedded = false,
}: NewProductWizardProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<{
    isDraft: boolean;
    title: string;
  } | null>(null);

  const [form, setForm] = useState({
    // Step 1: Basic Info
    title: '',
    short_description: '',
    description: '',
    category: 'handcrafted-artisan' as CanonicalCategorySlug,
    subcategory: 'Woodcraft',
    sku: '',
    tags_text: '',

    // Step 2: Brand Info
    brand_name: seller.business_name || '',
    maker_name: seller.maker_name || seller.business_name || '',
    seller_brand_relation: 'brand_owner' as
      | 'brand_owner'
      | 'manufacturer'
      | 'artisan_maker'
      | 'authorized_reseller',

    // Step 3: Origin & Specifications
    country_of_origin: 'India',
    origin_valley: seller.valley || 'Parvati Valley',
    origin_state: seller.state || 'Himachal Pradesh',
    manufacturing_location: `${seller.valley || 'Jari'}, ${
      seller.state || 'Himachal Pradesh'
    }`,
    sourcing_location: `${seller.valley || 'Parvati Valley'}, ${
      seller.state || 'Himachal Pradesh'
    }`,
    dispatch_location: `${seller.valley || 'Jari'}, ${
      seller.state || 'Himachal Pradesh'
    }`,
    craft_type: seller.craft_type || 'Handcrafted',
    materials: '',
    ingredients: '',
    dimensions: '',
    weight: '',
    specifications: '',
    packaging_info: '',

    // Step 4: Images
    photo_url_input: '',
    photos: [] as string[],

    // Step 5: Pricing & Automatic Discount
    mrp: '1000',
    selling_price: '800',
    tax_rate: '5',

    // Step 6: Stock & Inventory
    initial_stock: '15',
    available_stock: '15',
    low_stock_threshold: '5',
    inventory_status: 'in_stock' as
      | 'in_stock'
      | 'made_to_order'
      | 'coming_soon'
      | 'sold_out',

    // Step 7: Delivery & Return Information
    delivery_method: 'Direct Seller Courier / India Post',
    delivery_partner: 'India Post / Delhivery / BlueDart',
    shipping_charges: '0',
    estimated_dispatch_days: '2–4 business days',
    tracking_available: true,
    return_policy:
      '7-day replacement for transit damage or verified defect; managed and fulfilled directly by the seller.',

    // Step 8: Confirmation
    accuracy_confirmed: true,
  });

  const [variants, setVariants] = useState<
    Array<{
      variant_name: string;
      sku: string;
      mrp: string;
      selling_price: string;
      available_stock: string;
    }>
  >([]);

  const currentCategoryDef = useMemo(
    () =>
      MARKETPLACE_CATEGORIES.find((c) => c.slug === form.category) ||
      MARKETPLACE_CATEGORIES[0],
    [form.category]
  );

  const discountPreview = useMemo(
    () => calculateProductDiscount(form.mrp, form.selling_price),
    [form.mrp, form.selling_price]
  );

  const handleFieldChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === 'category') {
        const nextCat =
          MARKETPLACE_CATEGORIES.find((c) => c.slug === value) ||
          MARKETPLACE_CATEGORIES[0];
        return {
          ...prev,
          category: nextCat.slug,
          subcategory: nextCat.subcategories[0]?.label || '',
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleAddPhotoUrl = () => {
    const url = form.photo_url_input.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setErrorMsg('Please enter a valid https:// image URL.');
      return;
    }
    setErrorMsg('');
    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, url],
      photo_url_input: '',
    }));
  };

  const handlePhotoFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'products');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload product image.');
      }
      setForm((prev) => ({
        ...prev,
        photos: [...prev.photos, data.url],
      }));
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'Image upload unavailable; you can also paste a direct HTTPS image URL.'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        variant_name: '',
        sku: '',
        mrp: form.mrp,
        selling_price: form.selling_price,
        available_stock: '5',
      },
    ]);
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProduct = async (saveAsDraft: boolean) => {
    setErrorMsg('');

    if (!form.title || form.title.trim().length < 3) {
      setErrorMsg('Product name must be at least 3 characters (Step 1).');
      setActiveStep(1);
      return;
    }
    if (!form.description || form.description.trim().length < 20) {
      setErrorMsg(
        'Detailed product description must be at least 20 characters (Step 1).'
      );
      setActiveStep(1);
      return;
    }
    if (!form.materials || form.materials.trim().length < 2) {
      setErrorMsg(
        'Please specify the natural materials or ingredients (Step 3).'
      );
      setActiveStep(3);
      return;
    }
    if (form.photos.length === 0) {
      setErrorMsg(
        'At least one genuine product photograph is required (Step 4).'
      );
      setActiveStep(4);
      return;
    }
    if (!discountPreview.valid) {
      setErrorMsg(discountPreview.error || 'Invalid MRP / Selling Price (Step 5).');
      setActiveStep(5);
      return;
    }
    if (!saveAsDraft && !form.accuracy_confirmed) {
      setErrorMsg(
        'Please confirm that all product, origin, pricing, and delivery details are accurate.'
      );
      setActiveStep(8);
      return;
    }

    setSubmitting(true);
    try {
      const tags = form.tags_text
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const cleanedVariants = variants
        .filter((v) => v.variant_name.trim().length > 0)
        .map((v) => ({
          variant_name: v.variant_name.trim(),
          sku: v.sku.trim() || undefined,
          mrp: Number(v.mrp) || discountPreview.mrp,
          selling_price: Number(v.selling_price) || discountPreview.sellingPrice,
          available_stock: Math.max(0, Number(v.available_stock) || 0),
        }));

      const payload = {
        title: form.title.trim(),
        short_description: form.short_description.trim(),
        description: form.description.trim(),
        category: form.category,
        subcategory: form.subcategory,
        sku: form.sku.trim(),
        tags,
        brand_name: form.brand_name.trim() || seller.business_name,
        maker_name: form.maker_name.trim() || seller.maker_name,
        seller_brand_relation: form.seller_brand_relation,
        country_of_origin: form.country_of_origin.trim() || 'India',
        origin_valley: form.origin_valley.trim() || seller.valley,
        origin_state: form.origin_state.trim() || seller.state,
        manufacturing_location: form.manufacturing_location.trim(),
        sourcing_location: form.sourcing_location.trim(),
        dispatch_location: form.dispatch_location.trim(),
        craft_type: form.craft_type.trim() || form.subcategory || 'Artisan Craft',
        materials: form.materials.trim(),
        ingredients: form.ingredients.trim(),
        dimensions: form.dimensions.trim(),
        weight: form.weight.trim(),
        specifications: form.specifications.trim(),
        packaging_info: form.packaging_info.trim(),
        photos: form.photos,
        mrp: discountPreview.mrp,
        selling_price: discountPreview.sellingPrice,
        price_estimate: discountPreview.sellingPrice,
        tax_rate: Math.max(0, Number(form.tax_rate) || 0),
        initial_stock: Math.max(0, Number(form.initial_stock) || 0),
        available_stock: Math.max(0, Number(form.available_stock) || 0),
        low_stock_threshold: Math.max(0, Number(form.low_stock_threshold) || 5),
        inventory_status: form.inventory_status,
        variants: cleanedVariants,
        delivery_method: form.delivery_method.trim(),
        delivery_partner: form.delivery_partner.trim(),
        shipping_charges: Math.max(0, Number(form.shipping_charges) || 0),
        estimated_dispatch_days: form.estimated_dispatch_days.trim(),
        tracking_available: form.tracking_available,
        return_policy: form.return_policy.trim(),
        save_as_draft: saveAsDraft,
        accuracy_confirmed: form.accuracy_confirmed,
      };

      const res = await fetch('/api/products/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit product.');
      }

      setSuccessData({
        isDraft: saveAsDraft,
        title: form.title.trim(),
      });
      if (onCompleted) {
        onCompleted();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div
        className="rounded-[26px] border border-[#D5C8B3] bg-[linear-gradient(135deg,#FFFDF9_0%,#FAF4E8_100%)] p-8 sm:p-12 text-center shadow-md space-y-5"
        data-testid="product-wizard-success"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2 max-w-lg mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C55B23]">
            {successData.isDraft ? 'Draft Saved' : 'Submitted for Review'}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F332A]">
            {successData.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#4E4A43] leading-relaxed">
            {successData.isDraft
              ? 'Your product draft has been saved to your Seller Desk. It will remain private until you submit it for review.'
              : 'Your product has been submitted to the Uttarkunth Products review queue (Pending Approval). Once approved and published, it will appear live on /products.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setSuccessData(null);
              setActiveStep(1);
              setForm((prev) => ({
                ...prev,
                title: '',
                short_description: '',
                description: '',
                sku: '',
                photos: [],
              }));
            }}
            className="rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-5 py-2.5 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23]"
          >
            Add Another Product
          </button>
          <Link
            href="/seller/dashboard"
            className="rounded-xl bg-[#1F332A] px-6 py-2.5 text-xs font-semibold text-[#FFFDF9] hover:bg-[#C55B23] transition-colors"
          >
            Return to Seller Desk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[26px] sm:rounded-[32px] border border-[#D5C8B3]/80 bg-[linear-gradient(135deg,rgba(255,253,249,0.96)_0%,rgba(244,236,220,0.94)_100%)] p-6 sm:p-8 lg:p-10 shadow-[0_24px_60px_-20px_rgba(31,51,42,0.14)] space-y-8"
      data-testid="new-product-wizard"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5C8B3]/70 pb-5">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C55B23]">
            Seller Desk &bull; 8-Step Product Creation Flow
          </span>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#1F332A]">
            Add New Product to Catalogue
          </h2>
          <p className="mt-1 text-xs text-[#5C5549]">
            Complete product provenance, MRP &amp; automatic discount pricing,
            stock levels, and direct seller delivery policy.
          </p>
        </div>
        {!embedded && (
          <Link
            href="/seller/dashboard"
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-4 py-2 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Seller Desk</span>
          </Link>
        )}
      </div>

      {/* 8-Step Horizontal Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {WIZARD_STEPS.map((s) => {
          const Icon = s.icon;
          const isCurrent = activeStep === s.step;
          const isDone = activeStep > s.step;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step)}
              data-testid={`wizard-step-btn-${s.step}`}
              className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all ${
                isCurrent
                  ? 'border-[#C55B23] bg-[#1F332A] text-[#FFFDF9] shadow-sm'
                  : isDone
                  ? 'border-emerald-700/30 bg-emerald-50/70 text-[#1F332A]'
                  : 'border-[#D5C8B3]/70 bg-[#FFFDF9]/80 text-[#5C5549] hover:border-[#C55B23]/50'
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${
                  isCurrent
                    ? 'text-[#FDE2A8]'
                    : isDone
                    ? 'text-emerald-700'
                    : 'text-[#C55B23]'
                }`}
              />
              <span className="text-[11px] font-semibold leading-tight">
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div
          className="flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 p-4 text-xs text-red-900"
          data-testid="wizard-error-banner"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-700 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: BASIC PRODUCT INFORMATION */}
      {activeStep === 1 && (
        <div className="space-y-5" data-testid="wizard-step-1">
          <h3 className="font-serif text-xl font-bold text-[#1F332A]">
            Step 1: Basic Product Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleFieldChange}
                placeholder="e.g. Handwoven Kullu Sheep-Wool Shawl — Natural Walnut Dye"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A] focus:border-[#C55B23] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              >
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Subcategory *
              </label>
              <select
                name="subcategory"
                value={form.subcategory}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              >
                {currentCategoryDef.subcategories.map((sub) => (
                  <option key={sub.slug} value={sub.label}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Product Code / SKU
              </label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleFieldChange}
                placeholder="e.g. UK-JARI-WL-001"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs font-mono text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Search Tags / Keywords (Comma-separated)
              </label>
              <input
                type="text"
                name="tags_text"
                value={form.tags_text}
                onChange={handleFieldChange}
                placeholder="e.g. handloom, kullu wool, natural dye, parvati valley"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Short Summary Description (Shown on Product Cards)
              </label>
              <input
                type="text"
                name="short_description"
                value={form.short_description}
                onChange={handleFieldChange}
                maxLength={240}
                placeholder="Brief 1-2 sentence summary of the product and its craftsmanship"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Detailed Product Description * (Minimum 20 characters)
              </label>
              <textarea
                rows={4}
                name="description"
                value={form.description}
                onChange={handleFieldChange}
                placeholder="Describe how this product is made, the traditional technique, use care instructions, and what makes it authentic..."
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: BRAND INFORMATION */}
      {activeStep === 2 && (
        <div className="space-y-5" data-testid="wizard-step-2">
          <h3 className="font-serif text-xl font-bold text-[#1F332A]">
            Step 2: Brand &amp; Maker Relationship
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Brand Name (Displayed on Card &amp; Detail Page) *
              </label>
              <input
                type="text"
                name="brand_name"
                value={form.brand_name}
                onChange={handleFieldChange}
                placeholder="e.g. Parvati Handloom Guild"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Maker / Artisan / Producer Name *
              </label>
              <input
                type="text"
                name="maker_name"
                value={form.maker_name}
                onChange={handleFieldChange}
                placeholder="e.g. Master Weaver Chhering Dorje"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Seller Relationship to Brand *
              </label>
              <select
                name="seller_brand_relation"
                value={form.seller_brand_relation}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              >
                <option value="brand_owner">
                  Brand Owner (We own and operate this brand)
                </option>
                <option value="manufacturer">
                  Manufacturer / Producer (We manufacture this product directly)
                </option>
                <option value="artisan_maker">
                  Independent Artisan / Cooperative Maker
                </option>
                <option value="authorized_reseller">
                  Authorized Reseller (Authorized to distribute this brand)
                </option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PRODUCT ORIGIN & SPECIFICATIONS */}
      {activeStep === 3 && (
        <div className="space-y-5" data-testid="wizard-step-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1F332A]">
              Step 3: Product Origin &amp; Specifications
            </h3>
            <p className="text-xs text-[#5C5549] mt-0.5">
              Uttarkunth records brand origin, manufacturing location, material
              sourcing location, and seller dispatch location separately for
              transparent provenance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Country of Origin *
              </label>
              <input
                type="text"
                name="country_of_origin"
                value={form.country_of_origin}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Origin Valley / Region *
              </label>
              <input
                type="text"
                name="origin_valley"
                value={form.origin_valley}
                onChange={handleFieldChange}
                placeholder="e.g. Parvati Valley, Kullu"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Manufacturing / Craft Workshop Location *
              </label>
              <input
                type="text"
                name="manufacturing_location"
                value={form.manufacturing_location}
                onChange={handleFieldChange}
                placeholder="e.g. Jari Village Loom Studio, Kullu, HP"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Raw Material Sourcing Location *
              </label>
              <input
                type="text"
                name="sourcing_location"
                value={form.sourcing_location}
                onChange={handleFieldChange}
                placeholder="e.g. High-altitude pastures of Malana & Lug Valley"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Craft Technique / Process *
              </label>
              <input
                type="text"
                name="craft_type"
                value={form.craft_type}
                onChange={handleFieldChange}
                placeholder="e.g. Pit-loom weaving, cold-pressed extraction"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Materials Used *
              </label>
              <input
                type="text"
                name="materials"
                value={form.materials}
                onChange={handleFieldChange}
                placeholder="e.g. 100% Pure Himalayan Sheep Wool, Natural Walnut Dye"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Ingredients (For Food, Pantry &amp; Personal Care)
              </label>
              <input
                type="text"
                name="ingredients"
                value={form.ingredients}
                onChange={handleFieldChange}
                placeholder="e.g. 100% Raw Multi-floral Wild Forest Honey"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Dimensions &amp; Weight
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="dimensions"
                  value={form.dimensions}
                  onChange={handleFieldChange}
                  placeholder="200cm x 75cm"
                  className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3 py-2.5 text-xs text-[#1F332A]"
                />
                <input
                  type="text"
                  name="weight"
                  value={form.weight}
                  onChange={handleFieldChange}
                  placeholder="420 g"
                  className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3 py-2.5 text-xs text-[#1F332A]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Additional Specifications &amp; Packaging Details
              </label>
              <textarea
                rows={2}
                name="specifications"
                value={form.specifications}
                onChange={handleFieldChange}
                placeholder="Care instructions, shelf life, certifications, or eco-packaging details..."
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: PRODUCT IMAGES */}
      {activeStep === 4 && (
        <div className="space-y-5" data-testid="wizard-step-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1F332A]">
              Step 4: Genuine Product Photographs
            </h3>
            <p className="text-xs text-[#5C5549] mt-0.5">
              Upload genuine photographs of your actual product and packaging.
              Fake stock images or misleading photos are rejected during review.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File upload */}
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D5C8B3] bg-[#FFFDF9] p-6 text-center cursor-pointer hover:border-[#C55B23] transition-colors">
              <Upload className="h-6 w-6 text-[#C55B23]" />
              <span className="text-xs font-semibold text-[#1F332A]">
                {uploadingPhoto
                  ? 'Uploading Photograph...'
                  : 'Upload Product Photograph (JPG / PNG / WEBP)'}
              </span>
              <span className="text-[11px] text-[#5C5549]">
                First image becomes the Main Product Card image
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoFileUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </label>

            {/* Direct HTTPS URL input */}
            <div className="rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9] p-5 space-y-3">
              <label className="block text-xs font-semibold text-[#1F332A]">
                Or Add Direct Product Image URL (HTTPS)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="photo_url_input"
                  value={form.photo_url_input}
                  onChange={handleFieldChange}
                  placeholder="https://..."
                  className="flex-1 rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3 py-2 text-xs text-[#1F332A]"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  className="rounded-xl bg-[#1F332A] px-4 py-2 text-xs font-semibold text-[#FFFDF9] hover:bg-[#C55B23]"
                >
                  Add Image
                </button>
              </div>
              <p className="text-[11px] text-[#5C5549]">
                Add main product view, back/detail views, and packaging view.
              </p>
            </div>
          </div>

          {form.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {form.photos.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9]"
                >
                  <img
                    src={url}
                    alt={`Product view ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-md bg-[#1F332A]/85 px-2 py-0.5 text-[10px] font-semibold text-[#FDE2A8]">
                    {idx === 0 ? 'Main Image' : `Gallery #${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700"
                    title="Remove image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 5: PRICING & AUTOMATIC DISCOUNT CALCULATION */}
      {activeStep === 5 && (
        <div className="space-y-6" data-testid="wizard-step-5">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1F332A]">
              Step 5: Pricing &amp; Automatic Discount Calculation
            </h3>
            <p className="text-xs text-[#5C5549] mt-0.5">
              Enter your Maximum Retail Price (MRP) and Selling Price in INR.
              Uttarkunth automatically computes the customer savings and
              percentage discount badge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                MRP / Original Price (INR ₹) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                name="mrp"
                value={form.mrp}
                onChange={handleFieldChange}
                data-testid="wizard-input-mrp"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-sm font-semibold text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Selling Price / Current Price (INR ₹) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                name="selling_price"
                value={form.selling_price}
                onChange={handleFieldChange}
                data-testid="wizard-input-selling-price"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-sm font-semibold text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Included GST / Tax Rate (%)
              </label>
              <select
                name="tax_rate"
                value={form.tax_rate}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-sm text-[#1F332A]"
              >
                <option value="0">0% (Exempt Handicraft / Raw Produce)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST</option>
              </select>
            </div>
          </div>

          {/* Live Automatic Discount Preview Card */}
          <div
            className="rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9] p-5 space-y-3"
            data-testid="wizard-discount-preview"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C55B23]">
              Live Storefront Price &amp; Discount Preview
            </span>

            {discountPreview.valid ? (
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-serif text-3xl font-bold text-[#1F332A]">
                  {discountPreview.formattedSellingPrice}
                </span>
                {discountPreview.hasDiscount ? (
                  <>
                    <span className="text-sm font-medium text-[#7A7265] line-through">
                      {discountPreview.formattedMrp}
                    </span>
                    <span className="rounded-lg bg-[#C55B23] px-2.5 py-1 text-xs font-bold text-white">
                      {discountPreview.formattedBadge}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      Customer saves {formatINR(discountPreview.discountAmount)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-[#5C5549]">
                    Selling at MRP (No discount badge displayed)
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs font-semibold text-red-700">
                {discountPreview.error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 6: STOCK & INVENTORY */}
      {activeStep === 6 && (
        <div className="space-y-6" data-testid="wizard-step-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1F332A]">
              Step 6: Stock Quantity &amp; Variants
            </h3>
            <p className="text-xs text-[#5C5549] mt-0.5">
              Set your available stock and low-stock alert threshold. Stock can
              never be negative, and automatically marks as Out of Stock at 0.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Available Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                name="available_stock"
                value={form.available_stock}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    available_stock: e.target.value,
                    initial_stock: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-sm font-semibold text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Low-Stock Alert Threshold
              </label>
              <input
                type="number"
                min="0"
                step="1"
                name="low_stock_threshold"
                value={form.low_stock_threshold}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-sm text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Availability Mode
              </label>
              <select
                name="inventory_status"
                value={form.inventory_status}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              >
                <option value="in_stock">Ready to Dispatch (In Stock)</option>
                <option value="made_to_order">Made to Order by Artisan</option>
                <option value="sold_out">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Product Variants Section */}
          <div className="space-y-3 border-t border-[#D5C8B3]/60 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif text-base font-bold text-[#1F332A]">
                  Product Variants (Size / Weight / Pack / Color)
                </h4>
                <p className="text-xs text-[#5C5549]">
                  Optional: Add variant-level SKUs, pricing, and stock counts.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariantRow}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23]"
              >
                <Plus className="h-3.5 w-3.5 text-[#C55B23]" />
                <span>Add Variant</span>
              </button>
            </div>

            {variants.length > 0 && (
              <div className="space-y-2.5">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] p-3"
                  >
                    <input
                      type="text"
                      placeholder="Variant (e.g. 500g Jar / Large)"
                      value={v.variant_name}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, variant_name: e.target.value }
                              : item
                          )
                        )
                      }
                      className="sm:col-span-4 rounded-lg border border-[#D5C8B3] px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Variant SKU"
                      value={v.sku}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, sku: e.target.value } : item
                          )
                        )
                      }
                      className="sm:col-span-2 rounded-lg border border-[#D5C8B3] px-2.5 py-1.5 text-xs font-mono"
                    />
                    <input
                      type="number"
                      placeholder="MRP ₹"
                      value={v.mrp}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, mrp: e.target.value } : item
                          )
                        )
                      }
                      className="sm:col-span-2 rounded-lg border border-[#D5C8B3] px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Selling ₹"
                      value={v.selling_price}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, selling_price: e.target.value }
                              : item
                          )
                        )
                      }
                      className="sm:col-span-2 rounded-lg border border-[#D5C8B3] px-2.5 py-1.5 text-xs"
                    />
                    <div className="sm:col-span-2 flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="Stock"
                        value={v.available_stock}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, available_stock: e.target.value }
                                : item
                            )
                          )
                        }
                        className="w-full rounded-lg border border-[#D5C8B3] px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariantRow(idx)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 7: DELIVERY & RETURN INFORMATION */}
      {activeStep === 7 && (
        <div className="space-y-5" data-testid="wizard-step-7">
          <div className="rounded-2xl border border-[#2B4438] bg-[#1F332A] p-4 text-xs text-[#F8F3E8] flex items-start gap-3">
            <Truck className="h-5 w-5 text-[#FDE2A8] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#FDE2A8] block">
                Direct Seller / Brand Delivery Model
              </strong>
              <span>
                Every product on Uttarkunth is packaged, dispatched, and
                delivered directly by its respective seller or brand using their
                own delivery arrangements. Specify your dispatch and return
                terms clearly for buyers.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Seller Dispatch Location *
              </label>
              <input
                type="text"
                name="dispatch_location"
                value={form.dispatch_location}
                onChange={handleFieldChange}
                placeholder="e.g. Jari, Parvati Valley, Himachal Pradesh"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Delivery Method *
              </label>
              <input
                type="text"
                name="delivery_method"
                value={form.delivery_method}
                onChange={handleFieldChange}
                placeholder="e.g. Direct Seller Courier / India Post"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Courier / Delivery Partners Used
              </label>
              <input
                type="text"
                name="delivery_partner"
                value={form.delivery_partner}
                onChange={handleFieldChange}
                placeholder="e.g. India Post Speed Post, Delhivery, BlueDart"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Standard Shipping Charges (INR ₹, 0 for Free Shipping)
              </label>
              <input
                type="number"
                min="0"
                name="shipping_charges"
                value={form.shipping_charges}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Estimated Dispatch Timeline *
              </label>
              <input
                type="text"
                name="estimated_dispatch_days"
                value={form.estimated_dispatch_days}
                onChange={handleFieldChange}
                placeholder="e.g. 2–4 business days"
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#1F332A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tracking_available}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      tracking_available: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-[#D5C8B3] text-[#1F332A]"
                />
                <span>Shipment Tracking Number Provided to Customer</span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F332A] mb-1">
                Return / Replacement Policy *
              </label>
              <textarea
                rows={2}
                name="return_policy"
                value={form.return_policy}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2.5 text-xs text-[#1F332A]"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 8: PREVIEW & SUBMIT */}
      {activeStep === 8 && (
        <div className="space-y-6" data-testid="wizard-step-8">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1F332A]">
              Step 8: Live Storefront Preview &amp; Submission
            </h3>
            <p className="text-xs text-[#5C5549] mt-0.5">
              Review how your product card and provenance details will appear on
              the public marketplace once approved by the Uttarkunth Products
              team.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#C55B23] mb-2">
                Public Product Card Preview
              </span>
              <ProductCard
                previewMode
                product={{
                  id: 'preview',
                  slug: 'preview',
                  title: form.title || 'Untitled Himalayan Product',
                  short_description:
                    form.short_description || form.description || '',
                  category: form.category,
                  subcategory: form.subcategory,
                  brand_name: form.brand_name || seller.business_name,
                  maker_name: form.maker_name || seller.maker_name,
                  origin_valley: form.origin_valley || seller.valley,
                  origin_state: form.origin_state || seller.state,
                  photos: form.photos,
                  mrp: discountPreview.mrp,
                  selling_price: discountPreview.sellingPrice,
                  available_stock: Math.max(
                    0,
                    Number(form.available_stock) || 0
                  ),
                  low_stock_threshold: Math.max(
                    0,
                    Number(form.low_stock_threshold) || 5
                  ),
                  inventory_status: form.inventory_status,
                  verification_badge_approved: false,
                }}
              />
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9] p-5 space-y-3 text-xs">
                <h4 className="font-serif text-base font-bold text-[#1F332A]">
                  Product Dossier Summary
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#7A7265] block">Brand / Maker</span>
                    <span className="font-semibold text-[#1F332A]">
                      {form.brand_name} &bull; {form.maker_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7A7265] block">
                      Category &amp; Subcategory
                    </span>
                    <span className="font-semibold text-[#1F332A]">
                      {currentCategoryDef.title} → {form.subcategory}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7A7265] block">
                      MRP &amp; Selling Price
                    </span>
                    <span className="font-semibold text-[#1F332A]">
                      Selling: {discountPreview.formattedSellingPrice} (MRP:{' '}
                      {discountPreview.formattedMrp}
                      {discountPreview.hasDiscount
                        ? ` • ${discountPreview.formattedBadge}`
                        : ''}
                      )
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7A7265] block">
                      Stock &amp; Threshold
                    </span>
                    <span className="font-semibold text-[#1F332A]">
                      {form.available_stock} units (Low-stock alert at{' '}
                      {form.low_stock_threshold})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7A7265] block">
                      Manufacturing &amp; Sourcing
                    </span>
                    <span className="font-semibold text-[#1F332A]">
                      {form.manufacturing_location} | {form.sourcing_location}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7A7265] block">
                      Dispatch &amp; Delivery
                    </span>
                    <span className="font-semibold text-[#1F332A]">
                      {form.dispatch_location} ({form.estimated_dispatch_days})
                    </span>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9] p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.accuracy_confirmed}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      accuracy_confirmed: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-[#D5C8B3] text-[#1F332A]"
                />
                <span className="text-xs text-[#1F332A] leading-relaxed">
                  <strong>Seller Authenticity &amp; Fulfilment Confirmation:</strong>{' '}
                  I confirm that all product images, origin locations, MRP &amp;
                  selling prices, and stock quantities are accurate, and that
                  this product will be packaged and delivered directly by our
                  seller/brand.
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Footer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#D5C8B3]/70 pt-5">
        <div>
          {activeStep > 1 && (
            <button
              type="button"
              onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-4 py-2.5 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous Step</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmitProduct(true)}
            data-testid="wizard-save-draft-btn"
            className="inline-flex items-center gap-2 rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-5 py-2.5 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23] disabled:opacity-60"
          >
            <span>Save Draft</span>
          </button>

          {activeStep < 8 ? (
            <button
              type="button"
              onClick={() => setActiveStep((s) => Math.min(8, s + 1))}
              data-testid="wizard-next-step-btn"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F332A] px-6 py-2.5 text-xs font-semibold text-[#FFFDF9] hover:bg-[#C55B23] transition-colors"
            >
              <span>Next Step</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitProduct(false)}
              data-testid="wizard-submit-review-btn"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C55B23] px-6 py-3 text-xs font-semibold text-white shadow-md hover:bg-[#AE4D1B] disabled:opacity-60 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit for Review</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
