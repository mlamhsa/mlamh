"use client";

import { useState } from "react";

type ProfileShareButtonProps = {
  locale: "ar" | "en";
  title: string;
  url?: string;
  className?: string;
};

export function ProfileShareButton({
  locale,
  title,
  url,
  className = "",
}: ProfileShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl = url
      ? new URL(url, window.location.origin).toString()
      : window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
      } catch {
        // المستخدم أغلق نافذة المشاركة.
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      window.prompt(
        locale === "ar" ? "انسخ الرابط التالي:" : "Copy this link:",
        shareUrl
      );
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`rounded-full border border-white/10 px-7 py-4 text-[10px] uppercase tracking-[0.35em] text-white transition hover:border-gold/40 hover:text-gold ${className}`}
    >
      {copied
        ? locale === "ar"
          ? "✓ تم النسخ"
          : "✓ Copied"
        : locale === "ar"
          ? "مشاركة الملف"
          : "Share Profile"}
    </button>
  );
}