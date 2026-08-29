import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";

import { createPaymentCheckoutAction } from "@/lib/actions/create-payment-checkout";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SANDBOX_PRICE_CODE = "sandbox_tap_sar_100";

export default async function AdminPaymentsSandboxPage() {
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/ar/login");

  const adminClient = createAdminClient();
  const { data: adminProfile, error: adminProfileError } = await adminClient
    .from("profiles").select("id").eq("user_id", user.id).eq("account_type", "admin").maybeSingle();
  if (adminProfileError || !adminProfile) redirect("/ar");

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
      locale: "ar",
    });
    redirect(result.checkoutUrl);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Tap Sandbox</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">اختبار بوابة الدفع</h1>
        <p className="mt-4 leading-7 text-white/60">هذه الصفحة مخصصة لمسؤول ملامح فقط. العملية تستخدم كتالوج اختبار منفصل ومفتاح Tap التجريبي، ولا تمثل منتجًا تجاريًا معتمدًا.</p>

        {priceError ? (
          <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">تعذر تحميل سعر الاختبار.</p>
        ) : !price ? (
          <p className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">لم يتم إنشاء سعر Sandbox بعد.</p>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-white/50">السعر التجريبي</span>
              <span className="font-medium text-white">{(Number(price.amount_minor) / 100).toFixed(2)} {price.currency}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-sm">
              <span className="text-white/50">الحالة</span>
              <span className={price.active ? "text-emerald-300" : "text-amber-200"}>{price.active ? "جاهز للاختبار" : "غير مفعّل"}</span>
            </div>
          </div>
        )}

        <form action={startSandboxCheckout} className="mt-8">
          <button type="submit" disabled={!price?.active} className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40">
            بدء اختبار Tap Sandbox
          </button>
        </form>
      </div>
    </div>
  );
}
