import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";

import {
  AdminCard,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";

import { createPaymentCheckoutAction } from "@/lib/actions/create-payment-checkout";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const SANDBOX_PRICE_CODE = "sandbox_tap_sar_100";

export default async function AdminPaymentsSandboxPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  await requireAdminAccess();
  const query = await searchParams;
  const language: "ar" | "en" = query.lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";

  const adminClient = createAdminClient();

  const { data: price, error: priceError } = await adminClient
    .from("payment_prices").select("id, code, currency, amount_minor, active")
    .eq("code", SANDBOX_PRICE_CODE).maybeSingle();

  const checkoutRequestKey = randomUUID();

  async function startSandboxCheckout() {
    "use server";
    if (!price || !price.active) throw new Error("Sandbox payment price is not available.");
    const result = await createPaymentCheckoutAction({
      priceId: Number(price.id),
      requestKey: checkoutRequestKey,
      marketCountry: "SA",
      locale: language,
    });
    redirect(result.checkoutUrl);
  }

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer className="max-w-3xl">
        <AdminPageHeader
          eyebrow="TAP SANDBOX"
          title={isArabic ? "اختبار بوابة الدفع" : "Payment gateway sandbox"}
          description={
            isArabic
              ? "بيئة إدارية معزولة لاختبار Tap باستخدام كتالوج ومفتاح تجريبيين، ولا تمثل عملية شراء تجارية حقيقية."
              : "An isolated admin workspace for testing Tap with a sandbox catalog and key. It does not represent a live commercial purchase."
          }
        />

        <AdminCard className="p-5 sm:p-6">
          {priceError ? (
            <p className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-200">
              {isArabic ? "تعذر تحميل سعر الاختبار." : "Unable to load the sandbox price."}
            </p>
          ) : !price ? (
            <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4 text-sm text-amber-100">
              {isArabic ? "لم يتم إنشاء سعر Sandbox بعد." : "The sandbox price has not been created yet."}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-[10px] text-white/30">{isArabic ? "السعر التجريبي" : "Sandbox price"}</p>
                <p className="mt-2 text-lg font-semibold text-white/85">
                  {(Number(price.amount_minor) / 100).toFixed(2)} {price.currency}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-[10px] text-white/30">{isArabic ? "الحالة" : "Status"}</p>
                <p className={`mt-2 text-sm font-medium ${price.active ? "text-emerald-300" : "text-amber-200"}`}>
                  {price.active
                    ? (isArabic ? "جاهز للاختبار" : "Ready for testing")
                    : (isArabic ? "غير مفعّل" : "Inactive")}
                </p>
              </div>
            </div>
          )}

          <form action={startSandboxCheckout} className="mt-5">
            <button
              type="submit"
              disabled={!price?.active}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isArabic ? "بدء اختبار Tap Sandbox" : "Start Tap Sandbox test"}
            </button>
          </form>
        </AdminCard>
      </AdminPageContainer>
    </div>
  );
}
