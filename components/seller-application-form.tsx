'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import {
  CATEGORY_LICENCE_REQUIREMENTS,
  SELLER_DOCUMENT_LABELS,
  getRequiredDocumentsForCategories,
  validateIndianGSTIN,
  type ProductCategoryCode,
  type SellerDocumentType,
} from '@/lib/seller-verification';

export function SellerApplicationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Public Brand Profile
    business_name: '',
    brand_name: '',
    maker_name: '',
    craft_type: '',
    primary_category: 'textiles' as ProductCategoryCode,
    valley: '',
    origin_village: '',
    state: 'Himachal Pradesh',
    contact_email: '',
    contact_phone: '',
    bio: '',
    materials: '',
    website_url: '',

    // Private Business & Tax Verification (Never exposed publicly)
    legal_business_name: '',
    business_constitution: 'individual_artisan',
    tax_registration_status: 'unregistered_artisan',
    gstin: '',
    pan_or_tax_reference: '',
    registered_address: '',
    workshop_address: '',
    fssai_number: '',
    ayush_or_organic_cert_number: '',
    legal_metrology_reg_number: '',
    bis_certificate_number: '',
    trademark_registration_number: '',
    privacy_notice_accepted: true,
  });

  const [selectedCategories, setSelectedCategories] = useState<ProductCategoryCode[]>(['textiles']);
  const [attachedDocs, setAttachedDocs] = useState<
    Record<
      string,
      {
        file?: File | null;
        fileName: string;
        referenceNumber: string;
        expiryDate: string;
      }
    >
  >({});

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'primary_category' ? { primary_category: value as ProductCategoryCode } : {}),
    }));
    if (name === 'primary_category') {
      const cat = value as ProductCategoryCode;
      if (!selectedCategories.includes(cat)) {
        setSelectedCategories((prev) => Array.from(new Set([cat, ...prev])));
      }
    }
  };

  const toggleCategory = (cat: ProductCategoryCode) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        const filtered = prev.filter((c) => c !== cat);
        return filtered.length > 0 ? filtered : [cat];
      }
      return [...prev, cat];
    });
  };

  const gstinValidation =
    formData.gstin.trim().length > 0 ? validateIndianGSTIN(formData.gstin) : null;

  const requiredDocsForSelection = getRequiredDocumentsForCategories(selectedCategories);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (
      (formData.tax_registration_status === 'gst_registered' ||
        formData.tax_registration_status === 'composition_scheme') &&
      (!gstinValidation || !gstinValidation.valid)
    ) {
      setErrorMsg(
        gstinValidation?.error ||
          'A valid 15-character Indian GSTIN is required for GST-registered sellers.'
      );
      return;
    }

    setLoading(true);

    try {
      const verificationDocumentsPayload: Array<{
        document_type: SellerDocumentType;
        doc_type: SellerDocumentType;
        document_title: string;
        document_reference_number?: string;
        reference_number?: string;
        storage_bucket: 'seller-verification-docs';
        storage_path: string;
        mime_type: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
        file_size_bytes: number;
        size_bytes: number;
        expiry_date?: string;
        expires_at?: string;
      }> = [];

      for (const [docType, meta] of Object.entries(attachedDocs)) {
        if (!meta.fileName.trim()) continue;

        if (meta.file) {
          const uploadForm = new FormData();
          uploadForm.append('file', meta.file);
          uploadForm.append('document_type', docType);
          if (meta.referenceNumber) {
            uploadForm.append('document_reference_number', meta.referenceNumber);
          }
          if (meta.expiryDate) {
            uploadForm.append('expiry_date', meta.expiryDate);
          }

          const uploadRes = await fetch('/api/products/documents', {
            method: 'POST',
            body: uploadForm,
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || !uploadData.ok || !uploadData.document) {
            throw new Error(
              uploadData.error ||
                `Failed to upload ${SELLER_DOCUMENT_LABELS[docType as SellerDocumentType] || docType}.`
            );
          }

          verificationDocumentsPayload.push({
            document_type: docType as SellerDocumentType,
            doc_type: docType as SellerDocumentType,
            document_title:
              uploadData.document.document_title ||
              SELLER_DOCUMENT_LABELS[docType as SellerDocumentType] ||
              meta.fileName,
            document_reference_number: meta.referenceNumber || undefined,
            reference_number: meta.referenceNumber || undefined,
            storage_bucket: 'seller-verification-docs',
            storage_path: uploadData.document.storage_path,
            mime_type: uploadData.document.mime_type,
            file_size_bytes: uploadData.document.file_size_bytes,
            size_bytes: uploadData.document.size_bytes,
            expiry_date: meta.expiryDate || undefined,
            expires_at: meta.expiryDate || undefined,
          });
        } else {
          verificationDocumentsPayload.push({
            document_type: docType as SellerDocumentType,
            doc_type: docType as SellerDocumentType,
            document_title:
              SELLER_DOCUMENT_LABELS[docType as SellerDocumentType] || meta.fileName,
            document_reference_number: meta.referenceNumber || undefined,
            reference_number: meta.referenceNumber || undefined,
            storage_bucket: 'seller-verification-docs',
            storage_path: `seller-verification/${
              formData.contact_email || 'applicant'
            }/${Date.now()}-${meta.fileName}`,
            mime_type: 'application/pdf',
            file_size_bytes: 256000,
            size_bytes: 256000,
            expiry_date: meta.expiryDate || undefined,
            expires_at: meta.expiryDate || undefined,
          });
        }
      }

      const payload = {
        ...formData,
        brand_name: formData.brand_name || formData.business_name,
        legal_business_name: formData.legal_business_name || formData.business_name,
        selected_categories: selectedCategories,
        verification_documents: verificationDocumentsPayload,
        submitted_documents: verificationDocumentsPayload,
      };

      const res = await fetch('/api/products/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed. Please verify all fields.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-soft text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
          Brand &amp; Provenance Dossier Received
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-muted max-w-lg mx-auto leading-relaxed">
          Thank you for applying to partner with Uttarkunth. Our Marketplace &amp; Compliance team will verify your workshop provenance, tax registration, and category licences, and respond to{' '}
          <strong>{formData.contact_email}</strong> within 48 hours.
        </p>
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push('/account/products/seller')}
            className="px-6 py-2.5 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest-hover transition-colors"
          >
            Open Seller Desk
          </button>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-2.5 bg-ivory-warm border border-forest/20 text-forest text-xs font-semibold rounded-xl hover:bg-forest/10 transition-colors"
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-6 sm:p-10 border border-forest/15 shadow-soft space-y-8"
    >
      <div className="space-y-1 border-b border-forest/10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-ukorange">
            Seller Brand &amp; Compliance Verification
          </span>
          <span className="text-[10px] font-mono bg-forest/10 text-forest px-2.5 py-1 rounded-full">
            Public Brand Profile + Private Compliance Vault
          </span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-forest">
          Artisan, Brand &amp; Cooperative Registration
        </h2>
        <p className="text-xs text-charcoal-muted">
          Uttarkunth separates your public storefront brand narrative from private legal, GSTIN, and category licence records.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PART 1: PUBLIC SELLER BRAND PROFILE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-ukorange" />
          <h3 className="font-serif text-lg font-bold text-forest">
            1. Public Seller Brand Profile (Displayed on Storefront)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Business / Cooperative / Brand Name *
            </label>
            <input
              type="text"
              required
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="e.g. Parvati Valley Weavers Collective"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Lead Artisan / Contact Name *
            </label>
            <input
              type="text"
              required
              name="maker_name"
              value={formData.maker_name}
              onChange={handleChange}
              placeholder="e.g. Tenzing Norbu"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Primary Marketplace Category *
            </label>
            <select
              name="primary_category"
              value={formData.primary_category}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-white"
            >
              {Object.values(CATEGORY_LICENCE_REQUIREMENTS).map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Specific Craft or Harvest Specialty *
            </label>
            <input
              type="text"
              required
              name="craft_type"
              value={formData.craft_type}
              onChange={handleChange}
              placeholder="e.g. Handloom Yak Shawls, Raw Pine Honey, Woodcarving"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Valley / Sub-region *
            </label>
            <input
              type="text"
              required
              name="valley"
              value={formData.valley}
              onChange={handleChange}
              placeholder="e.g. Parvati Valley, Kullu Valley, Spiti"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Origin Village / Town
            </label>
            <input
              type="text"
              name="origin_village"
              value={formData.origin_village}
              onChange={handleChange}
              placeholder="e.g. Jana Village, Naggar, Chini"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              State *
            </label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-white"
            >
              <option value="Himachal Pradesh">Himachal Pradesh</option>
              <option value="Uttarakhand">Uttarakhand</option>
              <option value="Ladakh">Ladakh</option>
              <option value="Jammu & Kashmir">Jammu &amp; Kashmir</option>
              <option value="Sikkim">Sikkim</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Contact Email *
            </label>
            <input
              type="email"
              required
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="artisan@example.com"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Contact Phone / WhatsApp (Optional)
            </label>
            <input
              type="tel"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="+91 98160 XXXXX"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Workshop &amp; Heritage Narrative *
            </label>
            <textarea
              required
              rows={3}
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Share your story: how long has your family or cooperative practiced this craft? Where do you harvest raw materials? (Minimum 20 characters)"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 resize-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Natural Materials Used
            </label>
            <input
              type="text"
              name="materials"
              value={formData.materials}
              onChange={handleChange}
              placeholder="e.g. 100% Indigenous sheep wool, wild walnut bark dye, alpine pine resin"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
            />
          </div>
        </div>
      </div>

      {/* PART 2: PRIVATE BUSINESS & TAX VERIFICATION */}
      <div className="space-y-4 pt-6 border-t border-forest/15">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-forest" />
            <h3 className="font-serif text-lg font-bold text-forest">
              2. Private Business &amp; Tax Verification (Confidential Compliance Vault)
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Never Exposed Publicly &bull; Zero Bank/Payout Details Collected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Legal Business / Entity Name
            </label>
            <input
              type="text"
              name="legal_business_name"
              value={formData.legal_business_name}
              onChange={handleChange}
              placeholder="Defaults to Brand Name if individual artisan"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Business Constitution
            </label>
            <select
              name="business_constitution"
              value={formData.business_constitution}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-white"
            >
              <option value="individual_artisan">Individual Artisan / Master Maker</option>
              <option value="self_help_group">Village Self-Help Group (SHG)</option>
              <option value="cooperative_society">Registered Cooperative Society</option>
              <option value="sole_proprietorship">Sole Proprietorship</option>
              <option value="partnership">Partnership Firm</option>
              <option value="llp">Limited Liability Partnership (LLP)</option>
              <option value="private_limited">Private Limited Company</option>
              <option value="trust_or_ngo">Trust / Non-Profit Foundation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              GST &amp; Tax Registration Status
            </label>
            <select
              name="tax_registration_status"
              value={formData.tax_registration_status}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-white"
            >
              <option value="unregistered_artisan">
                Exempt / Small Artisan Below Threshold (Non-GST Declaration)
              </option>
              <option value="gst_registered">Regular GST Registered Entity</option>
              <option value="composition_scheme">GST Composition Scheme Taxpayer</option>
              <option value="exempt_handicraft">Exempted Handloom / Handicraft Cooperative</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              15-Character Indian GSTIN{' '}
              {(formData.tax_registration_status === 'gst_registered' ||
                formData.tax_registration_status === 'composition_scheme') &&
                '*'}
            </label>
            <input
              type="text"
              name="gstin"
              maxLength={15}
              value={formData.gstin}
              onChange={(e) =>
                setFormData({ ...formData, gstin: e.target.value.toUpperCase() })
              }
              placeholder="e.g. 02AAAAA0000A1Z5"
              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-forest/20 uppercase"
            />
            {gstinValidation && (
              <p
                className={`text-[11px] mt-1 font-medium ${
                  gstinValidation.valid ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {gstinValidation.valid
                  ? `Valid GSTIN Checksum (${gstinValidation.stateName} · PAN: ${gstinValidation.pan})`
                  : gstinValidation.error}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Registered Workshop / Business Address
            </label>
            <input
              type="text"
              name="registered_address"
              value={formData.registered_address}
              onChange={handleChange}
              placeholder="Full address for internal compliance records"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Trademark Registration / Application Number (Optional — Never Mandatory)
            </label>
            <input
              type="text"
              name="trademark_registration_number"
              value={formData.trademark_registration_number}
              onChange={handleChange}
              placeholder="Optional for registered brands; artisans do not require a trademark"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
            />
          </div>
        </div>
      </div>

      {/* PART 3: CONFIGURABLE CATEGORY-SPECIFIC LICENCE & DOCUMENT CHECKLIST */}
      <div className="space-y-4 pt-6 border-t border-forest/15">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-ukorange" />
          <h3 className="font-serif text-lg font-bold text-forest">
            3. Category-Specific Licences &amp; Private Verification Documents
          </h3>
        </div>
        <p className="text-xs text-charcoal-muted">
          Select all product categories you intend to list. The required regulatory licences (such as FSSAI for edible harvests, AYUSH/NPOP for organic/herbal claims, Legal Metrology for pre-packaged goods, or Craft Provenance for handloom/woodcraft) adjust automatically.
        </p>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {Object.values(CATEGORY_LICENCE_REQUIREMENTS).map((cat) => {
            const active = selectedCategories.includes(cat.category);
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => toggleCategory(cat.category)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-forest text-white border-forest'
                    : 'bg-ivory-warm text-charcoal border-forest/15 hover:bg-forest/5'
                }`}
              >
                {cat.title}
              </button>
            );
          })}
        </div>

        {/* Dynamic Required Documents Checklist */}
        <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/15 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-forest">
              Required Verification Documents for Selected Categories ({requiredDocsForSelection.required.length})
            </span>
            <span className="text-[10px] font-mono text-charcoal-muted">
              Private Bucket: seller-verification-docs (PDF/JPG/PNG/WEBP, max 10 MB)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requiredDocsForSelection.required.map((docType) => (
              <div
                key={docType}
                className="p-3 bg-white rounded-xl border border-forest/10 space-y-2 text-xs"
              >
                <div className="font-semibold text-forest flex items-center justify-between">
                  <span>{SELLER_DOCUMENT_LABELS[docType]}</span>
                  <span className="text-[10px] text-ukorange font-mono uppercase">Required</span>
                </div>
                <input
                  type="text"
                  placeholder="Licence / Certificate / Reference No."
                  value={attachedDocs[docType]?.referenceNumber || ''}
                  onChange={(e) =>
                    setAttachedDocs((prev) => ({
                      ...prev,
                      [docType]: {
                        file: prev[docType]?.file || null,
                        fileName: prev[docType]?.fileName || '',
                        referenceNumber: e.target.value,
                        expiryDate: prev[docType]?.expiryDate || '',
                      },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-forest/15"
                />
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    const fname = selectedFile?.name || '';
                    setAttachedDocs((prev) => ({
                      ...prev,
                      [docType]: {
                        file: selectedFile,
                        fileName: fname,
                        referenceNumber: prev[docType]?.referenceNumber || '',
                        expiryDate: prev[docType]?.expiryDate || '',
                      },
                    }));
                  }}
                  className="w-full text-[11px] text-charcoal-muted"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Submit */}
      <div className="pt-4 border-t border-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-[11px] text-charcoal-muted max-w-xl">
          <strong className="text-charcoal">Data Protection &amp; Compliance Notice:</strong> Private business documents are stored in an encrypted private bucket and are never accessible to other sellers, public visitors, or general support staff.
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-forest hover:bg-forest-hover text-white px-6 py-3 rounded-xl font-semibold text-xs transition-all shadow-xs disabled:opacity-60 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Store className="w-4 h-4 text-ukorange" />
              <span>Submit Seller Application</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}