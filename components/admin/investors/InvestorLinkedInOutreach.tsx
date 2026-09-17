"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle, RefreshCw, Sparkles } from "lucide-react";

type Props = {
  investorId: number;
  contactName: string | null;
  isArabic: boolean;
  disabled?: boolean;
};

type LinkedInDraftResponse = {
  ok?: boolean;
  error?: string;
  draft?: string;
  linkedinUrl?: string;
};

export function InvestorLinkedInOutreach({ investorId, contactName, isArabic, disabled = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function prepareDraft() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const response = await fetch(`/api/admin/investors/${investorId}/linkedin-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json().catch(() => ({})) as LinkedInDraftResponse;
      if (!response.ok || payload.ok === false || !payload.draft || !payload.linkedinUrl) {
        throw new Error(payload.error || (isArabic ? "تعذر تجهيز رسالة LinkedIn." : "Could not prepare LinkedIn message."));
      }
      setDraft(payload.draft);
      setLinkedinUrl(payload.linkedinUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isArabic ? "تعذر تجهيز رسالة LinkedIn." : "Could not prepare LinkedIn message."));
    } finally {
      setLoading(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(isArabic ? "تعذر نسخ الرسالة. انسخها يدويًا من الحقل." : "Could not copy the message. Copy it manually from the field.");
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-sky-400/10 bg-sky-400/[0.025] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={prepareDraft}
          disabled={disabled || loading || !contactName}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-300/20 px-3 py-2 text-xs text-sky-200 transition hover:bg-sky-300/[0.07] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isArabic ? "جهّز رسالة LinkedIn" : "Prepare LinkedIn message"}
        </button>
        {linkedinUrl ? (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-white/60 transition hover:border-sky-300/20 hover:text-sky-200"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {isArabic ? "فتح LinkedIn" : "Open LinkedIn"}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      {!contactName ? (
        <p className="mt-2 text-[11px] text-white/30">
          {isArabic ? "يحتاج شخصًا موثقًا قبل تجهيز رسالة LinkedIn." : "A verified decision-maker is required before preparing LinkedIn outreach."}
        </p>
      ) : null}

      {error ? <p className="mt-2 text-[11px] text-red-200/75">{error}</p> : null}

      {draft ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-sky-200/60">LINKEDIN DRAFT</p>
            <button
              type="button"
              onClick={copyDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-white/55 transition hover:text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? (isArabic ? "تم النسخ" : "Copied") : (isArabic ? "نسخ الرسالة" : "Copy message")}
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={6}
            dir="auto"
            className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/25 px-3 py-3 text-sm leading-7 text-white/70 outline-none transition focus:border-sky-300/25"
          />
          <p className="mt-2 text-[10px] leading-5 text-white/25">
            {isArabic
              ? "راجع النص وعدّله إن رغبت، ثم انسخه وافتح LinkedIn وأرسله بنفسك. ملامح لا ترسل رسائل LinkedIn تلقائيًا."
              : "Review or edit the draft, then copy it and send it yourself on LinkedIn. MLAMH does not auto-send LinkedIn messages."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
