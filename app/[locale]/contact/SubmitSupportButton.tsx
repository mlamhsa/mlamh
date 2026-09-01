"use client";

import { useFormStatus } from "react-dom";

export default function SubmitSupportButton({ isRtl }: { isRtl: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="min-h-14 w-full rounded-2xl bg-gold px-6 text-sm font-medium text-black transition hover:bg-gold-soft disabled:cursor-wait disabled:opacity-60"
    >
      {pending
        ? isRtl
          ? "جاري إرسال الطلب..."
          : "Sending request..."
        : isRtl
          ? "إرسال الطلب"
          : "Submit request"}
    </button>
  );
}
