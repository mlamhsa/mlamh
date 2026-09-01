"use client";

import { Bot, CheckCircle2, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function DanaRunButton({
  isArabic,
  processed,
  approvalStatus,
}: {
  isArabic: boolean;
  processed: boolean;
  approvalStatus?: string | null;
}) {
  const { pending } = useFormStatus();

  if (processed) {
    const waitingApproval = approvalStatus === "pending";
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] px-4 text-xs font-medium text-emerald-200 opacity-90"
      >
        <CheckCircle2 className="h-4 w-4" />
        {isArabic
          ? waitingApproval
            ? "تم تشغيل Dana — بانتظار الموافقة"
            : "تم تشغيل Dana لهذا الطلب"
          : waitingApproval
            ? "Dana completed — awaiting approval"
            : "Dana already completed"}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gold/30 bg-gold/[0.1] px-4 text-xs font-medium text-gold transition hover:bg-gold/[0.15] disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
      {pending
        ? isArabic
          ? "جاري تشغيل Dana..."
          : "Running Dana..."
        : isArabic
          ? "تشغيل Dana لهذا الطلب"
          : "Run Dana for this request"}
    </button>
  );
}
