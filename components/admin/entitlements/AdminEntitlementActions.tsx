"use client";

import { useFormStatus } from "react-dom";

import { revokeEntitlement } from "@/lib/actions/revoke-entitlement";

type Props = {
  entitlementId: number;
  locale: "ar" | "en";
  compact?: boolean;
};

function SubmitButton({ locale, compact }: Pick<Props, "locale" | "compact">) {
  const { pending } = useFormStatus();
  const isArabic = locale === "ar";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full border border-red-400/25 bg-red-400/[0.06] font-medium text-red-300 transition hover:border-red-400/45 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-xs"}`}
    >
      {pending ? (isArabic ? "جارٍ الإيقاف…" : "Revoking…") : (isArabic ? "إيقاف الميزة" : "Revoke benefit")}
    </button>
  );
}

export default function AdminEntitlementActions({ entitlementId, locale, compact = false }: Props) {
  const isArabic = locale === "ar";
  return (
    <form
      action={revokeEntitlement}
      onSubmit={(event) => {
        const message = isArabic
          ? "سيتم إيقاف الميزة فورًا مع الاحتفاظ بسجل الدفع والتاريخ المالي. هل تريد المتابعة؟"
          : "This will revoke the benefit immediately while keeping payment and financial history. Continue?";
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <input type="hidden" name="entitlement_id" value={entitlementId} />
      <SubmitButton locale={locale} compact={compact} />
    </form>
  );
}
