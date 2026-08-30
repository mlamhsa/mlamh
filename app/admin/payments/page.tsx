import Link from "next/link";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { minorToMajorAmount } from "@/lib/payments/money";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Payments — MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

type PaymentRow = {
  id: number;
  public_id: string;
  user_id: string;
  product_code_snapshot: string | null;
  price_code_snapshot: string | null;
  target_type: string | null;
  target_id: string | null;
  currency: string;
  amount_minor: number;
  provider: string | null;
  provider_payment_id: string | null;
  status: string;
  created_at: string;
  succeeded_at: string | null;
};

type PaymentTransactionRow = {
  payment_id: number;
  provider_status: string | null;
  created_at: string;
};

const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "partially_refunded",
  "refunded",
] as const;

function statusClasses(status: string) {
  if (status === "succeeded") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (status === "failed" || status === "cancelled") return "border-red-400/30 bg-red-400/10 text-red-300";
  if (status === "processing") return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  if (status === "refunded" || status === "partially_refunded") return "border-purple-400/30 bg-purple-400/10 text-purple-300";
  return "border-amber-400/30 bg-amber-400/10 text-amber-300";
}

function formatAmount(amountMinor: number, currency: string, locale: string) {
  const amount = minorToMajorAmount(Number(amountMinor), currency);
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

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

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const locale = lang === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const adminClient = createAdminClient();

  const { data: payments, error: paymentsError } = await adminClient
    .from("payments")
    .select("id, public_id, user_id, product_code_snapshot, price_code_snapshot, target_type, target_id, currency, amount_minor, provider, provider_payment_id, status, created_at, succeeded_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (paymentsError) throw new Error(`Unable to load payments: ${paymentsError.message}`);

  const rows = (payments ?? []) as PaymentRow[];
  const paymentIds = rows.map((payment) => payment.id);
  const latestProviderStatusByPaymentId = new Map<number, string>();

  if (paymentIds.length > 0) {
    const { data: transactions, error: transactionsError } = await adminClient
      .from("payment_transactions")
      .select("payment_id, provider_status, created_at")
      .in("payment_id", paymentIds)
      .order("created_at", { ascending: false });

    if (transactionsError) throw new Error(`Unable to load payment transaction statuses: ${transactionsError.message}`);

    for (const transaction of (transactions ?? []) as PaymentTransactionRow[]) {
      if (!latestProviderStatusByPaymentId.has(transaction.payment_id) && transaction.provider_status) {
        latestProviderStatusByPaymentId.set(transaction.payment_id, transaction.provider_status);
      }
    }
  }

  const countResults = await Promise.all(
    PAYMENT_STATUSES.map((status) =>
      adminClient.from("payments").select("id", { count: "exact", head: true }).eq("status", status),
    ),
  );

  const counts = Object.fromEntries(
    PAYMENT_STATUSES.map((status, index) => [status, countResults[index].count ?? 0]),
  ) as Record<(typeof PAYMENT_STATUSES)[number], number>;

  const total = PAYMENT_STATUSES.reduce((sum, status) => sum + counts[status], 0);

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="mx-auto max-w-7xl px-4 py-7 text-white sm:px-6 lg:px-8 lg:py-10">
      <section className="mb-7 sm:mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold">MLAMH ADMIN</p>
        <h1 className="mt-3 text-3xl font-light tracking-tight md:text-5xl">
          {isArabic ? "المدفوعات والاشتراكات" : "Payments & Subscriptions"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
          {isArabic
            ? "تابع عمليات الدفع، ثم انتقل إلى الاشتراكات والمزايا لمعرفة ما تم تفعيله لكل مستخدم وموعد انتهائه."
            : "Track payment operations, then open subscriptions and benefits to see what is active for each user and when it expires."}
        </p>

        <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.025] p-2 sm:flex-wrap">
          <Link href={`/admin/payments?lang=${locale}`} className="shrink-0 rounded-xl border border-gold/25 bg-gold/[0.1] px-4 py-2.5 text-xs text-gold sm:text-sm">
            {isArabic ? "سجل عمليات الدفع" : "Payment log"}
          </Link>
          <Link href={`/admin/entitlements?lang=${locale}`} className="shrink-0 rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs text-white/60 transition hover:border-gold/25 hover:text-gold sm:text-sm">
            {isArabic ? "الاشتراكات والمزايا" : "Subscriptions & Benefits"}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Stat label={isArabic ? "إجمالي العمليات" : "Total payments"} value={total} />
        <Stat label={isArabic ? "ناجحة" : "Succeeded"} value={counts.succeeded} />
        <Stat label={isArabic ? "معلقة / معالجة" : "Pending / Processing"} value={counts.pending + counts.processing} />
        <Stat label={isArabic ? "فاشلة / ملغاة" : "Failed / Cancelled"} value={counts.failed + counts.cancelled} />
      </section>

      <section className="mt-7 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] sm:mt-8 sm:rounded-[2rem]">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-base font-medium sm:text-lg">
            {isArabic ? "آخر 50 عملية دفع" : "Latest 50 payments"}
          </h2>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/40">
            {isArabic ? "لا توجد عمليات دفع حتى الآن." : "No payments yet."}
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/[0.07] md:hidden">
              {rows.map((payment) => {
                const providerStatus = latestProviderStatusByPaymentId.get(payment.id) ?? null;
                return (
                  <article key={payment.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-white/75">#{payment.id}</p>
                        <p className="mt-1 truncate text-sm text-white/65">
                          {payment.product_code_snapshot ?? "—"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] uppercase ${statusClasses(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.06] bg-black/20 p-3">
                      <Info label={isArabic ? "المبلغ" : "Amount"} value={formatAmount(payment.amount_minor, payment.currency, locale)} strong />
                      <Info label={isArabic ? "التاريخ" : "Created"} value={formatDate(payment.created_at, locale)} />
                      <Info label="Tap" value={payment.provider ?? "—"} />
                      <Info label={isArabic ? "الهدف" : "Target"} value={`${payment.target_type ?? "account"}${payment.target_id ? ` · ${payment.target_id}` : ""}`} />
                    </div>

                    <div className="mt-3 space-y-1.5 text-[10px] text-white/30">
                      <p className="truncate font-mono" title={payment.public_id}>{payment.public_id}</p>
                      {payment.provider_payment_id ? (
                        <p className="truncate font-mono" title={payment.provider_payment_id}>{payment.provider_payment_id}</p>
                      ) : null}
                      {providerStatus ? <p>{providerStatus}</p> : null}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-black/25 text-[10px] uppercase tracking-[0.18em] text-white/35">
                  <tr>
                    <th className="px-5 py-4 text-start">{isArabic ? "العملية" : "Payment"}</th>
                    <th className="px-5 py-4 text-start">{isArabic ? "المنتج" : "Product"}</th>
                    <th className="px-5 py-4 text-start">{isArabic ? "المبلغ" : "Amount"}</th>
                    <th className="px-5 py-4 text-start">{isArabic ? "الحالة" : "Status"}</th>
                    <th className="px-5 py-4 text-start">Tap</th>
                    <th className="px-5 py-4 text-start">{isArabic ? "الهدف" : "Target"}</th>
                    <th className="px-5 py-4 text-start">{isArabic ? "التاريخ" : "Created"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {rows.map((payment) => {
                    const providerStatus = latestProviderStatusByPaymentId.get(payment.id) ?? null;
                    return (
                      <tr key={payment.id} className="align-top hover:bg-white/[0.025]">
                        <td className="px-5 py-5">
                          <p className="font-mono text-xs text-white/70">#{payment.id}</p>
                          <p className="mt-1 max-w-[190px] truncate font-mono text-[10px] text-white/30" title={payment.public_id}>{payment.public_id}</p>
                        </td>
                        <td className="px-5 py-5">
                          <p className="text-white/75">{payment.product_code_snapshot ?? "—"}</p>
                          <p className="mt-1 text-xs text-white/30">{payment.price_code_snapshot ?? "—"}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-5 text-white/75">{formatAmount(payment.amount_minor, payment.currency, locale)}</td>
                        <td className="px-5 py-5">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${statusClasses(payment.status)}`}>{payment.status}</span>
                          {providerStatus ? <p className="mt-2 text-[10px] text-white/30">{providerStatus}</p> : null}
                        </td>
                        <td className="px-5 py-5">
                          <p className="text-xs text-white/60">{payment.provider ?? "—"}</p>
                          <p className="mt-1 max-w-[180px] truncate font-mono text-[10px] text-white/30" title={payment.provider_payment_id ?? undefined}>{payment.provider_payment_id ?? "—"}</p>
                        </td>
                        <td className="px-5 py-5 text-xs text-white/50">
                          <p>{payment.target_type ?? "account"}</p>
                          <p className="mt-1 font-mono text-[10px] text-white/30">{payment.target_id ?? "—"}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-5 text-xs text-white/45">{formatDate(payment.created_at, locale)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:rounded-3xl sm:p-5">
      <p className="text-[9px] uppercase leading-4 tracking-[0.12em] text-white/35 sm:text-[10px] sm:tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-2xl font-light text-white sm:mt-3 sm:text-3xl">{value}</p>
    </div>
  );
}

function Info({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] text-white/30">{label}</p>
      <p className={`mt-1 truncate text-xs ${strong ? "text-gold" : "text-white/65"}`}>{value}</p>
    </div>
  );
}
