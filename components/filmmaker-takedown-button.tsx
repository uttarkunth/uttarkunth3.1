'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Loader2 } from 'lucide-react';

interface FilmmakerTakedownButtonProps {
  proposalId: string;
  currentStatus: string;
}

export function FilmmakerTakedownButton({
  proposalId,
  currentStatus,
}: FilmmakerTakedownButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  if (
    currentStatus === 'takedown_requested' ||
    currentStatus === 'archived' ||
    currentStatus === 'removed'
  ) {
    return null;
  }

  const handleRequestTakedown = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/production/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_takedown',
          proposal_id: proposalId,
          reason: reason.trim() || 'Filmmaker requested takedown/archival.',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit takedown request.');
      }
      setMsg({ type: 'ok', text: data.message || 'Takedown request submitted.' });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2">
      {msg && (
        <p
          className={`text-[11px] font-semibold mb-2 ${
            msg.type === 'ok' ? 'text-emerald-800' : 'text-red-700'
          }`}
        >
          {msg.text}
        </p>
      )}
      {!open ? (
        <button suppressHydrationWarning
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-800 border border-red-200 rounded-xl text-[11px] font-semibold transition-colors"
        >
          <Archive className="w-3 h-3" />
          <span>Request Takedown / Archive</span>
        </button>
      ) : (
        <form
          onSubmit={handleRequestTakedown}
          className="p-3 bg-white rounded-xl border border-red-200 space-y-2"
        >
          <label className="block text-[11px] font-semibold text-charcoal">
            Reason for Takedown / Removal Request *
          </label>
          <input suppressHydrationWarning
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Festival exclusivity window or elder consent update"
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-forest/20"
          />
          <div className="flex items-center gap-2">
            <button suppressHydrationWarning
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[11px] font-semibold"
            >
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Submit Takedown Request</span>
            </button>
            <button suppressHydrationWarning
              type="button"
              onClick={() => setOpen(false)}
              className="px-2.5 py-1.5 text-charcoal-muted hover:text-charcoal text-[11px]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}