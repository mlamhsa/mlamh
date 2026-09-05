"use client";

import { useFormStatus } from "react-dom";

import { reactivateEntitlement } from "@/lib/actions/reactivate-entitlement";
import { revokeEntitlement } from "@/lib/actions/revoke-entitlement";

type Props = {
  entitlementId: number;
  locale: "ar" | "en";
  compact?: boolean;
  mode?: "revoke" | "reactivate";
};

function SubmitButton({
  locale,
  compact,
  mode,
}: Pick<Props, "locale" | "compact" | "mode">) {
  const { pending } = useFormStatus();
  const isArabic = locale === "ar";
  const isReactivate = mode === "reactivate";

  const label = pending
    ? isReactivate
      ? (isArabic ? "جارٍ إعادة التفعيل…" : "Reactivating…")
      : (isArabic ? "جارٍ الإيقاف…" : "Revoking…")
    : isReactivate
      ? (isArabic ? "إعادة تفعيل الميزة" : "Reactivate benefit")
      : (isArabic ? "إيقاف الميزة" : "Revoke benefit");

  const tone = isReactivate
    ? "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-300 hover:border-emerald-400/45 hover:bg-emerald-400/10"
    : "border-red-400/25 bg-red-400/[0.06] text-red-300 hover:border-red-400/45 hover:bg-red-400/10";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full border font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${tone} ${compact ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-xs"}`}
    >
      {label}
    </button>
  );
}

export default function AdminEntitlementActions({
  entitlementId,
  locale,
  compact = false,
  mode = "revoke",
}: Props) {
  const isArabic = locale === "ar";
  const isReactivate = mode === "reactivate";
  const action = isReactivate ? reactivateEntitlement : revokeEntitlement;

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const message = isReactivate
          ? isArabic
            ? "سيتم إعادة تفعيل الميزة من الآن وبنفس مدة الاشتراك الأصلية، دون إنشاء دفعة جديدة. هل تريد المتابعة؟"
            : "This will reactivate the benefit from now for the original subscription duration without creating a new payment. Continue?"
          : isArabic
            ? "سيتم إيقاف الميزة فورًا مع الاحتفاظ بسجل الدفع والتاريخ المالي. هل تريد المتابعة؟"
            : "This will revoke the benefit immediately while keeping payment and financial history. Continue?";
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <input type="hidden" name="entitlement_id" value={entitlementId} />
      <SubmitButton locale={locale} compact={compact} mode={mode} />
    </form>
  );
}
