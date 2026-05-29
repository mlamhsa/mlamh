"use client";

import { useState } from "react";

export function ProfileShareButton({
  locale,
  title,
}: {
  locale: "ar" | "en";
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({
        title,
        url,
      });

      return;
    }

    await navigator.clipboard.writeText(url);

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-full border border-white/10 px-7 py-4 text-[10px] uppercase tracking-[0.35em] text-white transition hover:border-gold/40 hover:text-gold"
    >
      {copied
        ? locale === "ar"
          ? "تم النسخ"
          : "Copied"
        : locale === "ar"
          ? "مشاركة الملف"
          : "Share Profile"}
    </button>
  );
}