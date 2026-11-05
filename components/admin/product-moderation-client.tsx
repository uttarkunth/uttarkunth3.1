'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Package,
  CheckCircle2,
  XCircle,
  MapPin,
  Users,
  Loader2,
  ShieldCheck,
  ExternalLink,
  FileCheck2,
} from 'lucide-react';
import {
  CATEGORY_LICENCE_REQUIREMENTS,
  SELLER_DOCUMENT_LABELS,
  validateIndianGSTIN,
} from '@/lib/seller-verification';

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
  const [activeTab, setActiveTab] = useState<
    'sellers' | 'products' | 'compliance_matrix' | 'interests'
  >('sellers');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Official GST Portal Verification Check Form State (per seller)
  const [activeGstinSellerId, setActiveGstinSellerId] = useState<string | null>(null);
  const [gstinInput, setGstinInput] = useState('');
  const [portalLegalName, setPortalLegalName] = useState('');
  const [portalTradeName, setPortalTradeName] = useState('');
  const [portalStatus, setPortalStatus] = useState<
    'Active' | 'Inactive' | 'Cancelled' | 'Suspended' | 'Not Found'
  >('Active');
  const [nameMatchesApplicant, setNameMatchesApplicant] = useState(true);
  const [gstinNotes, setGstinNotes] = useState('');
  const [verificationDocuments, setVerificationDocuments] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/admin/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && Array.isArray(d.verificationDocuments)) {
          setVerificationDocuments(d.verificationDocuments);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenSellerDocumentSignedUrl = async (docId: string) => {
    setFeedback(null);
    try {
      const res = await fetch(`/api/products/documents?id=${encodeURIComponent(docId)}`);
      const data = await res.json();
      if (!res.ok || !data.ok || !data.signedUrl) {
        throw new Error(data.error || 'Could not generate signed URL.');
      }
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDocumentReviewAction = async (
    docId: string,
    action: 'verify' | 'reject' | 'request_revision'
  ) => {
    setActionLoading(`doc-${docId}-${action}`);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'seller_document',
          target_id: docId,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Document review action failed.');
      }
      setVerificationDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                verification_status:
                  action === 'verify'
                    ? 'verified'
                    : action === 'reject'
                    ? 'rejected'
                    : 'revision_requested',
              }
            : d
        )
      );
      setFeedback({
        type: 'success',
        message: `Document status updated (${action}) and recorded in audit log.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSellerAction = async (
    sellerId: string,
    action: 'approve' | 'reject' | 'request_revision' | 'suspend'
  ) => {
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
        prev.map((s) =>
          s.user_id === sellerId
            ? { ...s, status: action === 'approve' ? 'approved' : 'rejected' }
            : s
        )
      );
      setFeedback({
        type: 'success',
        message: `Seller status updated (${action}) and recorded in audit log.`,
      });
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Action failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecordGstinCheck = async (sellerUserId: string) => {
    setFeedback(null);
    const formatCheck = validateIndianGSTIN(gstinInput);
    if (!formatCheck.valid) {
      setFeedback({
        type: 'error',
        message: formatCheck.error || 'Invalid 15-character GSTIN format.',
      });
      return;
    }

    setActionLoading(`gstin-${sellerUserId}`);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'seller_gstin_check',
          target_id: sellerUserId,
          action: 'verify_gstin',
          gstin: gstinInput,
          portal_legal_name: portalLegalName,
          portal_trade_name: portalTradeName,
          portal_status: portalStatus,
          name_matches_applicant: nameMatchesApplicant,
          notes: gstinNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'GSTIN verification check failed.');
      }
      setFeedback({
        type: 'success',
        message: `Official GST Portal check recorded for ${formatCheck.normalized} (${formatCheck.stateName}). Status: VERIFIED.`,
      });
      setActiveGstinSellerId(null);
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleProductAction = async (
    productId: string,
    action: 'approve' | 'reject' | 'set_inventory',
    inventoryStatus?: string
  ) => {
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
          if (action === 'set_inventory' && inventoryStatus)
            return { ...p, inventory_status: inventoryStatus };
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
      <div className="flex flex-wrap items-center gap-2 border-b border-forest/15 pb-2">
        <button suppressHydrationWarning
          onClick={() => setActiveTab('sellers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'sellers'
              ? 'bg-forest text-white shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal hover:bg-forest/5'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Seller &amp; GSTIN Verification</span>
          {pendingSellersCount > 0 && (
            <span className="px-1.5 py-0.2 bg-ukorange text-white text-[10px] font-bold rounded-full">
              {pendingSellersCount}
            </span>
          )}
        </button>

        <button suppressHydrationWarning
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

        <button suppressHydrationWarning
          onClick={() => setActiveTab('compliance_matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'compliance_matrix'
              ? 'bg-forest text-white shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal hover:bg-forest/5'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Category Licence Matrix</span>
        </button>

        <button suppressHydrationWarning
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
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Tab 1: Artisan Applications & GSTIN Verification */}
      {activeTab === 'sellers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-lg font-bold text-forest">
                Artisan, Brand &amp; Business Verification Queue ({sellers.length})
              </h2>
              <p className="text-xs text-charcoal-muted">
                Verify workshop provenance, category licences, and official GST Portal status before approving seller accounts.
              </p>
            </div>
            <a
              href="https://services.gst.gov.in/services/searchtp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-ivory-warm hover:bg-forest/10 text-forest border border-forest/20 rounded-xl text-xs font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-ukorange" />
              <span>Official GST Portal Taxpayer Search</span>
              <ExternalLink className="w-3 h-3" />
            </a>
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
                        <span>
                          Lead: <strong>{s.maker_name}</strong>
                        </span>
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

                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <button suppressHydrationWarning
                        type="button"
                        onClick={() => {
                          setActiveGstinSellerId(
                            activeGstinSellerId === s.user_id ? null : s.user_id
                          );
                          setGstinInput(s.gstin || '');
                          setPortalLegalName(s.legal_business_name || s.business_name || '');
                          setPortalTradeName(s.business_name || '');
                        }}
                        className="px-3.5 py-2 bg-ivory-warm hover:bg-forest/10 text-forest border border-forest/20 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-ukorange" />
                        <span>Verify GSTIN / Licences</span>
                      </button>

                      {s.status === 'pending' && (
                        <>
                          <button suppressHydrationWarning
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
                          <button suppressHydrationWarning
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
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-2 text-xs">
                    <div>
                      <span className="text-charcoal-muted font-medium">Craft &amp; Materials: </span>
                      <span className="text-charcoal font-semibold">
                        {s.craft_type} {s.materials && `(${s.materials})`}
                      </span>
                    </div>
                    {s.bio && (
                      <div>
                        <span className="text-charcoal-muted font-medium">
                          Heritage &amp; Workshop Story:{' '}
                        </span>
                        <p className="text-charcoal mt-0.5 leading-relaxed">{s.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Expandable Official GST Portal Verification Panel */}
                  {activeGstinSellerId === s.user_id && (
                    <div className="p-5 bg-forest/5 rounded-2xl border border-forest/20 space-y-4 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="font-serif text-base font-bold text-forest">
                            Official GST Portal &amp; Document Verification Check
                          </h4>
                          <p className="text-[11px] text-charcoal-muted">
                            1. Validate 15-character GSTIN Mod-36 checksum &bull; 2. Check taxpayer status on{' '}
                            <a
                              href="https://services.gst.gov.in/services/searchtp"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-forest"
                            >
                              services.gst.gov.in
                            </a>{' '}
                            &bull; 3. Record returned legal name, trade name, and active status.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-charcoal mb-1">
                            15-Character GSTIN *
                          </label>
                          <input suppressHydrationWarning
                            type="text"
                            maxLength={15}
                            value={gstinInput}
                            onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
                            placeholder="02AAAAA0000A1Z5"
                            className="w-full px-3 py-2 font-mono uppercase rounded-xl border border-forest/20 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-charcoal mb-1">
                            Returned Legal Name on GST Portal *
                          </label>
                          <input suppressHydrationWarning
                            type="text"
                            value={portalLegalName}
                            onChange={(e) => setPortalLegalName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-forest/20 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-charcoal mb-1">
                            Returned Trade Name *
                          </label>
                          <input suppressHydrationWarning
                            type="text"
                            value={portalTradeName}
                            onChange={(e) => setPortalTradeName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-forest/20 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-charcoal mb-1">
                            GST Portal Taxpayer Status *
                          </label>
                          <select suppressHydrationWarning
                            value={portalStatus}
                            onChange={(e) => setPortalStatus(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl border border-forest/20 bg-white"
                          >
                            <option value="Active">Active (Eligible for Verified Status)</option>
                            <option value="Inactive">Inactive (Blocks Verification)</option>
                            <option value="Cancelled">Cancelled (Blocks Verification)</option>
                            <option value="Suspended">Suspended (Blocks Verification)</option>
                            <option value="Not Found">Not Found (Blocks Verification)</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2 flex items-center pt-5">
                          <label className="flex items-center gap-2 cursor-pointer font-semibold text-forest">
                            <input suppressHydrationWarning
                              type="checkbox"
                              checked={nameMatchesApplicant}
                              onChange={(e) => setNameMatchesApplicant(e.target.checked)}
                              className="w-4 h-4 accent-forest"
                            />
                            <span>
                              Returned GST Portal Legal/Trade Name matches applicant identity &amp; PAN
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button suppressHydrationWarning
                          type="button"
                          onClick={() => setActiveGstinSellerId(null)}
                          className="px-3.5 py-2 text-charcoal-muted hover:text-charcoal"
                        >
                          Cancel
                        </button>
                        <button suppressHydrationWarning
                          type="button"
                          onClick={() => handleRecordGstinCheck(s.user_id)}
                          disabled={actionLoading === `gstin-${s.user_id}`}
                          className="px-4 py-2 bg-forest hover:bg-forest-hover text-white font-semibold rounded-xl"
                        >
                          {actionLoading === `gstin-${s.user_id}`
                            ? 'Recording Verification...'
                            : 'Record Official GSTIN Verification'}
                        </button>
                      </div>

                      {/* Private Verification Documents Vault for this Seller */}
                      <div className="pt-3 border-t border-forest/15 space-y-2">
                        <span className="font-semibold text-forest block">
                          Private Verification Documents (60s Signed URL Access · Audited)
                        </span>
                        {verificationDocuments.filter((d) => d.seller_user_id === s.user_id)
                          .length === 0 ? (
                            <p className="text-[11px] text-charcoal-muted">
                              No private verification documents uploaded by this seller yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {verificationDocuments
                                .filter((d) => d.seller_user_id === s.user_id)
                                .map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="p-3 bg-white rounded-xl border border-forest/15 flex flex-wrap items-center justify-between gap-2"
                                  >
                                    <div>
                                      <span className="font-semibold text-charcoal">
                                        {doc.document_title || doc.document_type}
                                      </span>
                                      {(doc.document_reference_number || doc.reference_number) && (
                                        <span className="ml-2 text-[11px] font-mono text-charcoal-muted">
                                          Ref: {doc.document_reference_number || doc.reference_number}
                                        </span>
                                      )}
                                      <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase">
                                        {doc.verification_status}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button suppressHydrationWarning
                                        type="button"
                                        onClick={() => handleOpenSellerDocumentSignedUrl(doc.id)}
                                        className="px-2.5 py-1 bg-ivory-warm hover:bg-forest/10 text-forest border border-forest/20 rounded-lg text-[11px] font-semibold"
                                      >
                                        Open 60s Signed URL
                                      </button>
                                      <button suppressHydrationWarning
                                        type="button"
                                        disabled={!!actionLoading}
                                        onClick={() => handleDocumentReviewAction(doc.id, 'verify')}
                                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-semibold"
                                      >
                                        Verify Doc
                                      </button>
                                      <button suppressHydrationWarning
                                        type="button"
                                        disabled={!!actionLoading}
                                        onClick={() => handleDocumentReviewAction(doc.id, 'reject')}
                                        className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-[11px] font-semibold"
                                      >
                                        Reject Doc
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
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
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.photos[0]}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-forest/40 m-auto mt-5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-bold text-forest">{p.title}</h3>
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
                          Category: <span className="font-semibold capitalize">{p.category}</span>{' '}
                          &bull; Maker: {p.maker_name} &bull; Valley: {p.origin_valley}
                        </p>
                        <p className="text-xs text-charcoal-muted">
                          Materials: {p.materials}{' '}
                          {p.price_estimate &&
                            `| Fair Price: ₹${Number(p.price_estimate).toLocaleString('en-IN')}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {p.moderation_status === 'pending' && (
                        <>
                          <button suppressHydrationWarning
                            disabled={!!actionLoading}
                            onClick={() => handleProductAction(p.id, 'approve')}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve &amp; Publish</span>
                          </button>
                          <button suppressHydrationWarning
                            disabled={!!actionLoading}
                            onClick={() => handleProductAction(p.id, 'reject')}
                            className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors disabled:opacity-60"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      <select suppressHydrationWarning
                        value={p.inventory_status}
                        onChange={(e) =>
                          handleProductAction(p.id, 'set_inventory', e.target.value)
                        }
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

      {/* Tab 3: Configurable Category Licence Matrix */}
      {activeTab === 'compliance_matrix' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-forest">
              Configurable Category-Specific Licence &amp; Provenance Requirements
            </h2>
            <p className="text-xs text-charcoal-muted mt-1">
              Each marketplace category enforces specific regulatory licences or provenance declarations. Trademark registration is always optional and never blocks individual artisans or village cooperatives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(CATEGORY_LICENCE_REQUIREMENTS).map((rule) => (
              <div
                key={rule.category}
                className="p-5 rounded-2xl border border-forest/15 bg-ivory-warm space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base font-bold text-forest">{rule.title}</h3>
                  <span className="px-2 py-0.5 bg-forest text-white font-mono text-[10px] rounded">
                    {rule.category}
                  </span>
                </div>
                <p className="text-charcoal-muted">{rule.regulatoryNotes}</p>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ukorange block mb-1">
                    Mandatory Documents:
                  </span>
                  <ul className="space-y-1">
                    {rule.requiredDocuments.map((doc) => (
                      <li key={doc} className="font-semibold text-charcoal flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{SELLER_DOCUMENT_LABELS[doc]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Customer Interest & Early Patrons */}
      {activeTab === 'interests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-forest">
              Early Patron Waitlist ({interests.length})
            </h2>
            <span className="text-xs text-charcoal-muted">Verified guest notifications</span>
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