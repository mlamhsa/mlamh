import Link from "next/link";
import { CalendarDays, CreditCard, Sparkles, UserRound } from "lucide-react";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { minorToMajorAmount } from "@/lib/payments/money";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

type EntitlementRow = {
  id: number;
  user_id: string;
  product_id: number;
  payment_id: number | null;
  entitlement_code: string;
  target_type: string | null;
  target_id: string | null;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
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
  provider: string | null;
  provider_payment_id: string | null;
  succeeded_at: string | null;
};

type TalentRow = {
  id: number;
  name_ar: string | null;
  name_en: string | null;
};

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function remainingDays(expiresAt: string | null) {
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

function isActive(row: EntitlementRow) {
  if (row.status !== "active") return false;
  if (!row.expires_at) return true;
  return new Date(row.expires_at).getTime() > Date.now();
}

export const metadata = {
  title: "Subscriptions & Entitlements — MLAMH Admin",
  robots: { index: false, follow: false },
};

export default async function AdminEntitlementsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const locale = lang === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const adminClient = createAdminClient();

  const { data: entitlementData, error } = await adminClient
    .from("entitlements")
    .select("id, user_id, product_id, payment_id, entitlement_code, target_type, target_id, status, starts_at, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Unable to load entitlements: ${error.message}`);
  }

  const rows = (entitlementData ?? []) as EntitlementRow[];
  const productIds = [...new Set(rows.map((row) => row.product_id))];
  const paymentIds = [
    ...new Set(rows.map((row) => row.payment_id).filter((value): value is number => typeof value === "number")),
  ];
  const talentIds = [
    ...new Set(
      rows
        .filter((row) => row.target_type === "talent" && row.target_id)
        .map((row) => Number(row.target_id))
        .filter((value) => Number.isInteger(value) && value > 0),
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
      .select("id, amount_minor, currency, status, provider, provider_payment_id, succeeded_at")
      .in("id", paymentIds);
    for (const payment of (data ?? []) as PaymentRow[]) {
      paymentsById.set(payment.id, payment);
    }
  }

  const talentsById = new Map<number, TalentRow>();
  if (talentIds.length > 0) {
    const { data } = await adminClient
      .from("talents")
      .select("id, name_ar, name_en")
      .in("id", talentIds);
    for (const talent of (data ?? []) as TalentRow[]) {
      talentsById.set(talent.id, talent);
    }
  }

  const activeCount = rows.filter(isActive).length;
  const expiredCount = rows.filter((row) => !isActive(row)).length;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="mx-auto max-w-7xl px-4 py-8 text-white sm:px-6 lg:px-8"
    >
      <section className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold">MLAMH ADMIN</p>
        <h1 className="mt-3 text-3xl font-light tracking-tight md:text-5xl">
          {isArabic ? "الاشتراكات والمزايا" : "Subscriptions & Benefits"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
          {isArabic
            ? "متابعة ما اشتراه المستخدمون، حالة كل ميزة، تاريخ تفعيلها، موعد انتهائها، وربطها بعملية الدفع."
            : "Track purchased benefits, their status, activation and expiry dates, and the linked payment."}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label={isArabic ? "إجمالي المزايا" : "Total benefits"} value={rows.length} />
        <Stat label={isArabic ? "نشطة" : "Active"} value={activeCount} />
        <Stat label={isArabic ? "منتهية / موقوفة" : "Expired / inactive"} value={expiredCount} />
      </section>

      <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-medium">
            {isArabic ? "آخر 100 استحقاق" : "Latest 100 entitlements"}
          </h2>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/40">
            {isArabic ? "لا توجد مزايا مدفوعة حتى الآن." : "No paid benefits yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/25 text-[10px] uppercase tracking-[0.16em] text-white/35">
                <tr>
                  <th className="px-5 py-4 text-start">{isArabic ? "المستخدم / الهدف" : "User / target"}</th>
                  <th className="px-5 py-4 text-start">{isArabic ? "الميزة" : "Benefit"}</th>
                  <th className="px-5 py-4 text-start">{isArabic ? "الحالة" : "Status"}</th>
                  <th className="px-5 py-4 text-start">{isArabic ? "البدء" : "Starts"}</th>
                  <th className="px-5 py-4 text-start">{isArabic ? "الانتهاء" : "Expires"}</th>
                  <th className="px-5 py-4 text-start">{isArabic ? "المتبقي" : "Remaining"}</th>
                  <th className="px-5 py-4 text-start">{isArabic ? "الدفع" : "Payment"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07]">
                {rows.map((row) => {
                  const product = productsById.get(row.product_id);
                  const payment = row.payment_id ? paymentsById.get(row.payment_id) : null;
                  const talent = row.target_type === "talent" && row.target_id
                    ? talentsById.get(Number(row.target_id))
                    : null;
                  const active = isActive(row);
                  const days = remainingDays(row.expires_at);
                  const productName = isArabic
                    ? product?.name_ar || product?.name_en || row.entitlement_code
                    : product?.name_en || product?.name_ar || row.entitlement_code;
                  const talentName = talent
                    ? isArabic
                      ? talent.name_ar || talent.name_en || `#${talent.id}`
                      : talent.name_en || talent.name_ar || `#${talent.id}`
                    : null;

                  return (
                    <tr key={row.id} className="align-top hover:bg-white/[0.025]">
                      <td className="px-5 py-5">
                        <div className="flex items-start gap-2">
                          <UserRound className="mt-0.5 h-4 w-4 text-white/30" />
                          <div>
                            {talentName && row.target_id ? (
                              <Link
                                href={`/admin/talents/${row.target_id}?lang=${locale}`}
                                className="text-white/75 transition hover:text-gold"
                              >
                                {talentName}
                              </Link>
                            ) : (
                              <p className="text-white/65">{row.target_type || "account"}</p>
                            )}
                            <p className="mt-1 max-w-[180px] truncate font-mono text-[10px] text-white/30" title={row.user_id}>
                              {row.user_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-gold" />
                          <span className="text-white/75">{productName}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-white/30">{row.entitlement_code}</p>
                      </td>
                      <td className="px-5 py-5">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] ${active ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.04] text-white/45"}`}>
                          {active ? (isArabic ? "نشط" : "Active") : (isArabic ? "غير نشط" : "Inactive")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-xs text-white/50">
                        {formatDate(row.starts_at, locale)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-xs text-white/50">
                        {formatDate(row.expires_at, locale)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-xs text-white/60">
                        {days == null ? "—" : active ? (isArabic ? `${days} يوم` : `${days} day${days === 1 ? "" : "s"}`) : (isArabic ? "انتهت" : "Expired")}
                      </td>
                      <td className="px-5 py-5">
                        {payment ? (
                          <div className="flex items-start gap-2">
                            <CreditCard className="mt-0.5 h-4 w-4 text-white/30" />
                            <div>
                              <p className="text-xs text-white/70">
                                {new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", {
                                  style: "currency",
                                  currency: payment.currency,
                                }).format(minorToMajorAmount(payment.amount_minor, payment.currency))}
                              </p>
                              <p className="mt-1 text-[10px] text-white/30">
                                #{payment.id} · {payment.status}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-white/30">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
        <CalendarDays className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-3 text-3xl font-light text-white">{value}</p>
    </div>
  );
}
