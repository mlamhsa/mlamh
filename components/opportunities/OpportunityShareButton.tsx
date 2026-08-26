"use client";

import {
  trackOpportunityShareAction,
  type OpportunityShareChannel,
} from "@/lib/actions/track-opportunity-share";

type ShareButtonProps = {
  opportunityId: number;
  title: string;
};

export default function OpportunityShareButton({
  opportunityId,
  title,
}: ShareButtonProps) {
  function trackShare(
    channel: OpportunityShareChannel,
  ) {
    void trackOpportunityShareAction({
      opportunityId,
      channel,
    });
  }

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });

        trackShare("native");
      } catch (error) {
        /*
         * إغلاق نافذة المشاركة ليس خطأ في المنتج،
         * ولا نسجل Share إذا ألغى المستخدم العملية.
         */
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "[OpportunityShareButton.nativeShare]",
          error,
        );
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(url);

      trackShare("copy_link");

      alert("تم نسخ رابط الفرصة");
    } catch (error) {
      console.error(
        "[OpportunityShareButton.copyLink]",
        error,
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-full border border-[#c8a45d]/40 px-5 py-3 text-sm text-[#c8a45d] transition hover:bg-[#c8a45d] hover:text-black"
    >
      مشاركة الفرصة
    </button>
  );
}