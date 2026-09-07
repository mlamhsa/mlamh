"use client";

import {
  trackOpportunityShareAction,
  type OpportunityShareChannel,
} from "@/lib/actions/track-opportunity-share";

type ShareButtonProps = {
  opportunityId: number;
  title: string;
};

function buildTrackedShareUrl(channel: OpportunityShareChannel) {
  const url = new URL(window.location.href);
  url.searchParams.set("mlamh_source", "opportunity_share");
  url.searchParams.set("mlamh_channel", channel);
  return url.toString();
}

export default function OpportunityShareButton({
  opportunityId,
  title,
}: ShareButtonProps) {
  function trackShare(channel: OpportunityShareChannel) {
    void trackOpportunityShareAction({ opportunityId, channel });
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: buildTrackedShareUrl("native"),
        });
        trackShare("native");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[OpportunityShareButton.nativeShare]", error);
      }
      return;
    }

    const url = buildTrackedShareUrl("copy_link");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        trackShare("copy_link");
        alert("تم نسخ رابط الفرصة");
        return;
      }

      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
      const copied = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (!copied) throw new Error("Clipboard copy is not supported");
      trackShare("copy_link");
      alert("تم نسخ رابط الفرصة");
    } catch (error) {
      console.error("[OpportunityShareButton.copyLink]", error);
      window.prompt("انسخ رابط الفرصة:", url);
    }
  };

  const handleWhatsAppShare = () => {
    const url = buildTrackedShareUrl("whatsapp");
    const message = [
      "🎬 فرصة جديدة عبر ملامح",
      "",
      `*${title}*`,
      "",
      "قد تناسبك هذه الفرصة، أو أرسلها لشخص تناسبه.",
      "",
      "التفاصيل والتقديم عبر MLAMH:",
      url,
    ].join("\n");
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    trackShare("whatsapp");
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/45">تعرف شخصًا تناسبه هذه الفرصة؟ أرسلها له.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleWhatsAppShare} className="rounded-full border border-[#25D366]/40 px-5 py-3 text-sm text-[#25D366] transition hover:bg-[#25D366] hover:text-black">
          مشاركة عبر WhatsApp
        </button>
        <button type="button" onClick={handleShare} className="rounded-full border border-[#c8a45d]/40 px-5 py-3 text-sm text-[#c8a45d] transition hover:bg-[#c8a45d] hover:text-black">
          مشاركة الفرصة
        </button>
      </div>
    </div>
  );
}
