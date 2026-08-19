"use client";

import { ArrowDown } from "lucide-react";

type NewMessagesButtonProps = {
  count: number;
  locale: string;
  onClick: () => void;
};

export default function NewMessagesButton({
  count,
  locale,
  onClick,
}: NewMessagesButtonProps) {
  const isArabic = locale === "ar";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center gap-2 rounded-full border border-gold/35 bg-black/90 px-4 text-xs font-medium text-gold shadow-xl shadow-black/35 backdrop-blur-xl transition hover:border-gold hover:bg-gold hover:text-black active:scale-95"
    >
      <ArrowDown size={15} />

      <span>
        {isArabic
          ? count === 1
            ? "رسالة جديدة"
            : `${count} رسائل جديدة`
          : count === 1
            ? "New message"
            : `${count} new messages`}
      </span>
    </button>
  );
}