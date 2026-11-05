'use client';

import React, { useEffect, useState } from 'react';
import {
  SELLER_DOCUMENT_LABELS,
  validateIndianGSTIN,
  type SellerDocumentType,
} from '@/lib/seller-verification';
import {
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  Upload,
  Lock,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface SellerDeskGovernancePanelProps {
  seller: any;
}

export function SellerDeskGovernancePanel({ seller }: SellerDeskGovernancePanelProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Replacement document form state
  const [docType, setDocType] = useState<SellerDocumentType>('provenance_evidence');
  const [docRefNumber, setDocRefNumber] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFileName, setDocFileName] = useState('');
  const [docExpiry, setDocExpiry] = useState('');

  // Legal/Brand update state
  const [brandName, setBrandName] = useState(seller?.brand_name || seller?.business_name || '');
  const [legalBusinessName, setLegalBusinessName] = useState(
    seller?.legal_business_name || seller?.business_name || ''
  );
  const [gstin, setGstin] = useState(seller?.gstin || '');

  const fetchComplianceStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products/seller-desk', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDocuments(data.documents || []);
        setChecks(data.checks || []);
      }
    } catch {
      // Ignore errors if tables pending migration
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceStatus();
  }, []);

  const handleUpdateBrandOrLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (gstin.trim()) {
      const check = validateIndianGSTIN(gstin);
      if (!check.valid) {
        setFeedback({ type: 'error', message: check.error || 'Invalid GSTIN format.' });
        return;
      }
    }

    try {
      const res = await fetch('/api/products/seller-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_brand_profile',
          brand_name: brandName,
          legal_business_name: legalBusinessName,
          gstin: gstin.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Update failed.' });
        return;
      }
      setFeedback({ type: 'success', message: data.message });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleUploadReplacementDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!docFileName) {
      setFeedback({ type: 'error', message: 'Please select a PDF or image file to upload.' });
      return;
    }

    try {
      let storagePath = `seller-verification/${seller.user_id}/${Date.now()}-${docFileName}`;
      let mimeType = docFile?.type || 'application/pdf';
      let fileSizeBytes = docFile?.size || 240000;

      if (docFile) {
        const uploadForm = new FormData();
        uploadForm.append('file', docFile);
        uploadForm.append('document_type', docType);
        if (docRefNumber) uploadForm.append('document_reference_number', docRefNumber);
        if (docExpiry) uploadForm.append('expiry_date', docExpiry);

        const uploadRes = await fetch('/api/products/documents', {
          method: 'POST',
          body: uploadForm,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.ok || !uploadData.document) {
          setFeedback({
            type: 'error',
            message: uploadData.error || 'Failed to upload document to private storage.',
          });
          return;
        }
        storagePath = uploadData.document.storage_path;
        mimeType = uploadData.document.mime_type;
        fileSizeBytes = uploadData.document.file_size_bytes;
      }

      const res = await fetch('/api/products/seller-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_replacement_document',
          document_type: docType,
          document_title: SELLER_DOCUMENT_LABELS[docType] || docFileName,
          document_reference_number: docRefNumber || undefined,
          storage_bucket: 'seller-verification-docs',
          storage_path: storagePath,
          mime_type: mimeType,
          file_size_bytes: fileSizeBytes,
          expiry_date: docExpiry || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Document upload failed.' });
        return;
      }
      setFeedback({ type: 'success', message: data.message });
      setDocRefNumber('');
      setDocFile(null);
      setDocFileName('');
      setDocExpiry('');
      fetchComplianceStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-forest/10 pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-forest" />
          <div>
            <h3 className="font-serif text-xl font-bold text-forest">
              Seller Brand &amp; Business Compliance Vault
            </h3>
            <p className="text-xs text-charcoal-muted">
              Manage your public brand profile, private GSTIN &amp; category licences, and replacement verification documents.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-ivory-warm border border-forest/15 text-forest text-[11px] font-mono rounded-full flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-ukorange" />
          Zero Bank / Payout Details Collected
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Brand & Legal Identity Profile */}
        <form onSubmit={handleUpdateBrandOrLegal} className="space-y-4">
          <h4 className="font-serif text-base font-bold text-forest">
            Brand &amp; Legal Registration Details
          </h4>
          <p className="text-[11px] text-charcoal-muted">
            Note: Modifying your legal entity name, GSTIN, or statutory licence numbers automatically sets your business verification status to <strong>Pending Re-Verification</strong> by the Marketplace Reviewer. Sellers cannot self-approve listings.
          </p>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Public Brand / Storefront Name
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-forest/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Private Legal Entity Name (Triggers Re-Verification if Changed)
            </label>
            <input
              type="text"
              value={legalBusinessName}
              onChange={(e) => setLegalBusinessName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-forest/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              15-Character Indian GSTIN (Optional if Exempt Artisan)
            </label>
            <input
              type="text"
              maxLength={15}
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="02AAAAA0000A1Z5"
              className="w-full px-3.5 py-2 text-xs font-mono uppercase rounded-xl border border-forest/20"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Save Brand &amp; Legal Profile
          </button>
        </form>

        {/* Right: Replacement Document Upload & Status */}
        <div className="space-y-4">
          <h4 className="font-serif text-base font-bold text-forest">
            Upload Replacement or Additional Licence Document
          </h4>
          <form onSubmit={handleUploadReplacementDocument} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Document Category
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as SellerDocumentType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-forest/20 bg-white"
              >
                {Object.entries(SELLER_DOCUMENT_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Licence / Certificate No."
                value={docRefNumber}
                onChange={(e) => setDocRefNumber(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-forest/20"
              />
              <input
                type="date"
                title="Document Expiry Date (if applicable)"
                value={docExpiry}
                onChange={(e) => setDocExpiry(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-forest/20"
              />
            </div>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setDocFile(f);
                setDocFileName(f?.name || '');
              }}
              className="w-full text-xs text-charcoal-muted"
            />

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-ivory-warm hover:bg-forest/10 text-forest border border-forest/20 text-xs font-semibold rounded-xl"
            >
              <Upload className="w-3.5 h-3.5 text-ukorange" />
              <span>Upload to Private Compliance Vault</span>
            </button>
          </form>

          {/* Uploaded Documents List */}
          <div className="pt-3 border-t border-forest/10 space-y-2">
            <span className="text-xs font-semibold text-forest block">
              Submitted Compliance Documents ({documents.length})
            </span>
            {documents.length === 0 ? (
              <p className="text-[11px] text-charcoal-muted">
                No replacement documents uploaded in this session.
              </p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 bg-ivory-warm rounded-xl border border-forest/10 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-charcoal">
                        {SELLER_DOCUMENT_LABELS[d.document_type as SellerDocumentType] ||
                          d.document_type}
                      </span>
                      {d.expiry_date && (
                        <span className="block text-[10px] text-charcoal-muted">
                          Expires: {d.expiry_date}
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase">
                      {d.verification_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}