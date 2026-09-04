import Link from "next/link";
import { CreditCard, Sparkles } from "lucide-react";

import AdminEntitlementActions from "@/components/admin/entitlements/AdminEntitlementActions";
import { minorToMajorAmount } from "@/lib/payments/money";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  talentId: number;
  language: "ar" | "en";
};

type EntitlementRow = {
  id: number;
  product_id: number;
  payment_id: number | null;
  entitlement_code: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

type ProductRow = { id: number; name_ar: string; name_en: string };
type PaymentRow = { id: number; amount_minor: number; currency: string; status: string };

function active(row: EntitlementRow) {
  const now = Date.now();
  if (row.status !== "active" || row.revoked_at) return false;
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
  return !row.expires_at || new Date(row.expires_at).getTime() > now;
}

function formatDate(value: string | null, language: "ar" | "en") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function remainingDays(value: string | null) {
  if (!value) return null;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
}

function money(payment: PaymentRow | null, language: "ar" | "en") {
  if (!payment) return "—";
  return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: payment.currency,
  }).format(minorToMajorAmount(payment.amount_minor, payment.currency));
}

export async function AdminTalentEntitlementsPanel({ talentId, language }: Props) {
  const ar = language === "ar";
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("entitlements")
    .select("id, product_id, payment_id, entitlement_code, status, starts_at, expires_at, revoked_at, created_at")
    .eq("target_type", "talent")
    .eq("target_id", String(talentId))
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[AdminTalentEntitlementsPanel]", error);
    return null;
  }

  const rows = (data ?? []) as EntitlementRow[];
  const productIds = [...new Set(rows.map((row) => row.product_id))];
  const paymentIds = [...new Set(rows.map((row) => row.payment_id).filter((id): id is number => typeof id === "number"))];
  const products = new Map<number, ProductRow>();
  const payments = new Map<number, PaymentRow>();

  if (productIds.length) {
    const { data: productData } = await adminClient
      .from("payment_products")
      .select("id, name_ar, name_en")
      .in("id", productIds);
    for (const item of (productData ?? []) as ProductRow[]) products.set(item.id, item);
  }

  if (paymentIds.length) {
    const { data: paymentData } = await adminClient
      .from("payments")
      .select("id, amount_minor, currency, status")
      .in("id", paymentIds);
    for (const item of (paymentData ?? []) as PaymentRow[]) payments.set(item.id, item);
  }

  const activeRows = rows.filter(active);

  return (
    <section dir={ar ? "rtl" : "ltr"} className="mx-auto mt-5 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-[1.75rem] border border-gold/20 bg-gold/[0.025] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold">{ar ? "الحساب التجاري" : "Commercial account"}</p>
            <h2 className="mt-2 text-xl font-light text-white sm:text-2xl">{ar ? "الاشتراك والمزايا" : "Subscription & benefits"}</h2>
            <p className="mt-2 text-xs leading-6 text-white/45">
              {ar ? "يمكن إيقاف الميزة أو إعادة تفعيلها إداريًا، مع بقاء سجل الدفع والإيراد محفوظًا بشكل مستقل." : "Benefits can be revoked or administratively reactivated while payment and revenue history remain intact."}
            </p>
          </div>
          <Link href={`/admin/entitlements?lang=${language}`} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:border-gold/30 hover:text-gold">
            {ar ? "فتح سجل الاشتراكات" : "Open subscriptions"}
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/20 p-5 text-sm text-white/40">
            {ar ? "لا توجد مزايا مدفوعة مرتبطة بهذه الموهبة." : "No paid benefits are linked to this talent."}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {rows.map((row) => {
              const isActive = active(row);
              const product = products.get(row.product_id);
              const payment = row.payment_id ? payments.get(row.payment_id) ?? null : null;
              const days = remainingDays(row.expires_at);
              const name = ar ? (product?.name_ar || product?.name_en || row.entitlement_code) : (product?.name_en || product?.name_ar || row.entitlement_code);
              const statusLabel = row.revoked_at
                ? (ar ? "موقوف" : "Revoked")
                : isActive
                  ? (ar ? "نشط" : "Active")
                  : (ar ? "منتهي / غير نشط" : "Expired / inactive");

              return (
                <div key={row.id} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-xl border border-gold/20 bg-gold/[0.06] p-2 text-gold"><Sparkles className="h-4 w-4" /></span>
                      <div>
                        <p className="text-sm font-medium text-white/85">{name}</p>
                        <p className={`mt-1 text-xs ${isActive ? "text-emerald-300" : row.revoked_at ? "text-red-300" : "text-white/40"}`}>{statusLabel}</p>
                      </div>
                    </div>
                    <AdminEntitlementActions
                      entitlementId={row.id}
                      locale={language}
                      mode={isActive ? "revoke" : "reactivate"}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
                    <Info label={ar ? "البدء" : "Starts"} value={formatDate(row.starts_at, language)} />
                    <Info label={ar ? "الانتهاء" : "Expires"} value={formatDate(row.expires_at, language)} />
                    <Info label={ar ? "المتبقي" : "Remaining"} value={days == null ? "—" : isActive ? (ar ? `${days} يوم` : `${days} days`) : "—"} />
                    <Info label={ar ? "الدفع" : "Payment"} value={money(payment, language)} icon />
                    <Info label={ar ? "حالة الدفع" : "Payment status"} value={payment?.status ?? "—"} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-[11px] leading-5 text-white/35">
          {ar ? "إيقاف الميزة لا يحذف عملية الدفع. إعادة التفعيل تبدأ من وقت تنفيذها وتستخدم مدة الاشتراك الأصلية، ولا تنشئ عملية دفع جديدة." : "Revoking keeps the payment record. Reactivation starts from the time it is performed, uses the original subscription duration, and does not create a new payment."}
        </p>
      </div>
    </section>
  );
}

function Info({ label, value, icon = false }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-[10px] text-white/30">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-white/70">{icon ? <CreditCard className="h-3 w-3 text-gold" /> : null}{value}</p>
    </div>
  );
}
