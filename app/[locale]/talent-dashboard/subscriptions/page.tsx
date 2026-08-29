import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Sparkles } from "lucide-react";

import { requireTalent } from "@/lib/auth/require-talent";
import { minorToMajorAmount } from "@/lib/payments/money";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type EntitlementRow = {
  id: number;
  product_id: number;
  payment_id: number | null;
  entitlement_code: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

type ProductRow = {
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
};

type PaymentRow = {
  id: number;
  amount_minor: number;
  currency: string;
  status: string;
  succeeded_at: string | null;
};

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getRemainingDays(expiresAt: string | null) {
  if (!expiresAt) return null;
  const difference = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(difference / 86_400_000));
}

function isCurrentlyActive(row: EntitlementRow) {
  if (row.status !== "active") return false;
  if (!row.expires_at) return true;
  return new Date(row.expires_at).getTime() > Date.now();
}

export const metadata = {
  title: "Subscriptions & Benefits — MLAMH",
  robots: { index: false, follow: false },
};

export default async function TalentSubscriptionsPage({ params }: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";
  const { user } = await requireTalent(locale);
  const adminClient = createAdminClient();

  const { data: entitlementData, error: entitlementError } = await adminClient
    .from("entitlements")
    .select("id, product_id, payment_id, entitlement_code, status, starts_at, expires_at, target_type, target_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (entitlementError) {
    throw new Error(`Unable to load entitlements: ${entitlementError.message}`);
  }

  const entitlements = (entitlementData ?? []) as EntitlementRow[];
  const productIds = [...new Set(entitlements.map((item) => item.product_id))];
  const paymentIds = [
    ...new Set(
      entitlements
        .map((item) => item.payment_id)
        .filter((value): value is number => typeof value === "number"),
    ),
  ];

  const productsById = new Map<number, ProductRow>();
  if (productIds.length > 0) {
    const { data } = await adminClient
      .from("payment_products")
      .select("id, code, name_ar, name_en")
      .in("id", productIds);
    for (const product of (data ?? []) as ProductRow[]) {
      productsById.set(product.id, product);
    }
  }

  const paymentsById = new Map<number, PaymentRow>();
  if (paymentIds.length > 0) {
    const { data } = await adminClient
      .from("payments")
      .select("id, amount_minor, currency, status, succeeded_at")
      .in("id", paymentIds);
    for (const payment of (data ?? []) as PaymentRow[]) {
      paymentsById.set(payment.id, payment);
    }
  }

  const activeEntitlements = entitlements.filter(isCurrentlyActive);
  const historicalEntitlements = entitlements.filter((item) => !isCurrentlyActive(item));

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:pt-32"
    >
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.13),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-7 lg:p-8">
          <Link
            href={`/${locale}/talent-dashboard`}
            className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold"
          >
            <ArrowLeft className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
            {isRtl ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.36em] text-gold">
                {isRtl ? "المزايا المدفوعة" : "Paid Benefits"}
              </p>
              <h1 className="mt-3 text-4xl font-light sm:text-5xl">
                {isRtl ? "اشتراكاتي ومزاياي" : "My Subscriptions & Benefits"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
                {isRtl
                  ? "تابع المزايا التي اشتريتها، حالة كل ميزة، تاريخ بدايتها وموعد انتهائها."
                  : "Track what you purchased, each benefit status, start date, and expiry date."}
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-gold/[0.07] text-gold">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label={isRtl ? "المزايا النشطة" : "Active benefits"}
            value={String(activeEntitlements.length)}
          />
          <SummaryCard
            label={isRtl ? "إجمالي المزايا" : "Total benefits"}
            value={String(entitlements.length)}
          />
          <SummaryCard
            label={isRtl ? "الحالة" : "Status"}
            value={activeEntitlements.length > 0 ? (isRtl ? "نشط" : "Active") : (isRtl ? "لا توجد ميزة نشطة" : "No active benefit")}
          />
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {isRtl ? "نشطة الآن" : "Active now"}
              </p>
              <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                {isRtl ? "مزاياك الحالية" : "Your current benefits"}
              </h2>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-300" />
          </div>

          {activeEntitlements.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-white/45">
              {isRtl ? "لا توجد لديك مزايا مدفوعة نشطة حالياً." : "You do not have active paid benefits right now."}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {activeEntitlements.map((entitlement) => {
                const product = productsById.get(entitlement.product_id);
                const payment = entitlement.payment_id ? paymentsById.get(entitlement.payment_id) : null;
                const remainingDays = getRemainingDays(entitlement.expires_at);
                const title = isRtl
                  ? product?.name_ar || product?.name_en || entitlement.entitlement_code
                  : product?.name_en || product?.name_ar || entitlement.entitlement_code;

                return (
                  <article
                    key={entitlement.id}
                    className="rounded-3xl border border-gold/25 bg-gold/[0.055] p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                          {isRtl ? "نشط" : "Active"}
                        </span>
                        <h3 className="mt-3 text-2xl font-light text-white">{title}</h3>
                      </div>
                      <Sparkles className="h-6 w-6 text-gold" />
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Detail label={isRtl ? "تاريخ البدء" : "Start date"} value={formatDate(entitlement.starts_at, locale)} />
                      <Detail label={isRtl ? "تاريخ الانتهاء" : "Expiry date"} value={formatDate(entitlement.expires_at, locale)} />
                      <Detail
                        label={isRtl ? "المدة المتبقية" : "Time remaining"}
                        value={remainingDays == null ? "—" : isRtl ? `${remainingDays} يوم` : `${remainingDays} day${remainingDays === 1 ? "" : "s"}`}
                      />
                      <Detail
                        label={isRtl ? "قيمة العملية" : "Payment amount"}
                        value={
                          payment
                            ? new Intl.NumberFormat(isRtl ? "ar-SA" : "en-US", {
                                style: "currency",
                                currency: payment.currency,
                              }).format(minorToMajorAmount(payment.amount_minor, payment.currency))
                            : "—"
                        }
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {historicalEntitlements.length > 0 ? (
          <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-white/40" />
              <h2 className="text-xl font-light">
                {isRtl ? "السجل السابق" : "Previous benefits"}
              </h2>
            </div>
            <div className="mt-5 divide-y divide-white/[0.07]">
              {historicalEntitlements.map((entitlement) => {
                const product = productsById.get(entitlement.product_id);
                const title = isRtl
                  ? product?.name_ar || product?.name_en || entitlement.entitlement_code
                  : product?.name_en || product?.name_ar || entitlement.entitlement_code;
                return (
                  <div key={entitlement.id} className="grid gap-3 py-4 sm:grid-cols-4">
                    <span className="text-sm text-white/70">{title}</span>
                    <span className="text-xs text-white/40">{formatDate(entitlement.starts_at, locale)}</span>
                    <span className="text-xs text-white/40">{formatDate(entitlement.expires_at, locale)}</span>
                    <span className="text-xs text-white/40">{entitlement.status}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</p>
      <p className="mt-3 text-2xl font-light text-white">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/35">
        <CalendarDays className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm text-white/75">{value}</p>
    </div>
  );
}
