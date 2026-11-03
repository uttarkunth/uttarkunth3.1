'use client';

import React, { useState } from 'react';
import { BookOpen, Send, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

export function CommunityStoryForm({ isDbReady = false }: { isDbReady?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [village, setVillage] = useState('');
  const [valley, setValley] = useState('Parvati Valley');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!consentGiven) {
      setErrorMsg('You must verify explicit consent from all participants and village contributors before submitting.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/community/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: authorName,
          author_role: authorRole,
          village,
          valley,
          title,
          excerpt,
          content,
          consent_given: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit story');
      }

      setSuccessMsg(data.message || 'Story submitted for review!');
      setTitle('');
      setExcerpt('');
      setContent('');
      setConsentGiven(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting story');
    } finally {
      setLoading(false);
    }
  };

  if (!isDbReady) {
    return (
      <div className="bg-ivory-warm rounded-3xl p-6 sm:p-8 border border-amber-300 ring-1 ring-amber-200/60 text-center space-y-4">
        <BookOpen className="w-8 h-8 text-ukorange mx-auto" />
        <div className="space-y-1.5 max-w-xl mx-auto">
          <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full uppercase tracking-wider">
            Online Submissions Not Yet Open
          </span>
          <h3 className="font-serif text-xl font-bold text-forest">Share a Mountain Story With Us</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Our online oral history database module is prepared and currently awaiting production database activation. In the meantime, you can email your story or oral transcription directly to our archive team.
          </p>
        </div>
        <a
          href="mailto:info@uttarkunth.com?subject=Community%20Oral%20Story%20Contribution"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-ukorange" />
          <span>Email Story to info@uttarkunth.com</span>
        </a>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="bg-ivory-warm rounded-3xl p-6 sm:p-8 border border-forest/15 text-center space-y-4">
        <BookOpen className="w-8 h-8 text-ukorange mx-auto" />
        <div className="space-y-1">
          <h3 className="font-serif text-xl font-bold text-forest">Do You Have a Mountain Story to Share?</h3>
          <p className="text-xs text-charcoal-muted max-w-lg mx-auto">
            We invite village elders, local hosts, and field volunteers to contribute oral history transcripts, folklore, and field reflections.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-ukorange" />
          <span>Contribute an Oral History / Story</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-forest/15 shadow-soft space-y-6">
      <div className="flex items-center justify-between border-b border-forest/10 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-ukorange">Community Archive</span>
          <h3 className="font-serif text-2xl font-bold text-forest mt-0.5">Contribute a Mountain Story</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-charcoal-muted hover:text-forest"
        >
          Cancel
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-700 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-charcoal block">Author / Narrator Name *</label>
          <input
            type="text"
            required
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="e.g. Ramesh Negi"
            className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-charcoal block">Role / Affiliation *</label>
          <input
            type="text"
            required
            value={authorRole}
            onChange={(e) => setAuthorRole(e.target.value)}
            placeholder="e.g. Village Elder / Homestay Host / Field Fellow"
            className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-charcoal block">Village *</label>
          <input
            type="text"
            required
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="e.g. Jari / Malana / Sainj"
            className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-charcoal block">Valley *</label>
          <input
            type="text"
            required
            value={valley}
            onChange={(e) => setValley(e.target.value)}
            placeholder="e.g. Parvati Valley / Spiti / Tirthan"
            className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-charcoal block">Story Title (min 5 characters) *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. The Spring When the Devta Spoke to the Glaciers"
          className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-charcoal block">Short Excerpt / Summary (min 20 characters) *</label>
        <input
          type="text"
          required
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="A brief teaser describing the core event or teaching..."
          className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-charcoal block">Story Content (min 50 characters) *</label>
        <textarea
          required
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write the full story or transcription here..."
          className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 outline-none"
        />
      </div>

      {/* Ethical Consent Checkbox */}
      <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/15 space-y-2">
        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-charcoal leading-relaxed">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5 rounded text-forest focus:ring-forest"
          />
          <span>
            <strong>Mandatory Ethical Verification:</strong> I confirm that this story, testimony, and names have been shared with the informed consent of all named community members and elders, honoring indigenous privacy and traditions.
          </span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 text-xs font-semibold text-charcoal-muted hover:text-forest"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || !consentGiven}
          className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {loading ? <span>Submitting...</span> : <><Send className="w-3.5 h-3.5" /><span>Submit Story for Review</span></>}
        </button>
      </div>
    </form>
  );
}
