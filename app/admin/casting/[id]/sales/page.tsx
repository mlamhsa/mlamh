import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createCastingPaymentAction,
  updateCastingCommercialStatusAction,
  updateCastingPaymentStatusAction,
} from "@/lib/actions/admin-casting-commercial";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const commercialStatuses = ["lead", "proposal", "won", "lost", "cancelled"] as const;
const paymentStatuses = ["pending", "paid", "failed", "refunded", "cancelled"] as const;
const mutablePaymentStatuses = ["pending", "paid", "failed", "cancelled"] as const;

export default async function CastingProjectSalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();

  const language = query.lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  const admin = createAdminClient();

  const [{ data: project }, { data: payments }] = await Promise.all([
    admin
      .from("casting_projects")
      .select("id,project_title,company_name,package_code,quoted_amount,currency,commercial_status")
      .eq("id", projectId)
      .maybeSingle(),
    admin
      .from("casting_payments")
      .select("id,status,amount,currency,provider,provider_reference,paid_at,internal_notes,created_at")
      .eq("casting_project_id", projectId)
      .order("created_at", { ascending: false }),
  ]);
  if (!project) notFound();

  const paymentRows = payments ?? [];
  const paid = paymentRows
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const refunded = paymentRows
    .filter((item) => item.status === "refunded")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const collected = Math.max(0, paid - refunded);
  const quote = Number(project.quoted_amount || 0);
  const outstanding = Math.max(0, quote - collected);
  const currency = project.currency || "SAR";

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Link href={`/admin/casting/${projectId}?lang=${language}`} className="text-xs text-gold hover:underline">
              {isArabic ? "← العودة للمشروع" : "← Back to project"}
            </Link>
            <p className="mt-4 text-xs uppercase tracking-[0.28em] text-gold">SALES & COLLECTIONS</p>
            <h1 className="mt-2 text-3xl font-light text-white">{project.project_title}</h1>
            <p className="mt-2 text-sm text-white/40">{project.company_name || "MLAMH Casting"}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/casting/commercial?lang=${language}`} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/55">{isArabic ? "كل المبيعات" : "All sales"}</Link>
            <Link href={`/admin/casting/analytics?lang=${language}`} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/55">{isArabic ? "التحليلات" : "Analytics"}</Link>
          </div>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [isArabic ? "قيمة العرض" : "Quoted", quote],
            [isArabic ? "المحصّل" : "Collected", collected],
            [isArabic ? "المتبقي" : "Outstanding", outstanding],
            [isArabic ? "السجل" : "Ledger entries", paymentRows.length],
          ].map(([title, value], index) => (
            <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <p className="text-xs text-white/35">{title}</p>
              <p className="mt-3 text-2xl font-light text-white">{index < 3 ? `${Number(value).toLocaleString()} ${currency}` : value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <h2 className="text-lg font-light text-white">{isArabic ? "الحالة التجارية" : "Commercial status"}</h2>
            <form action={updateCastingCommercialStatusAction} className="mt-4 flex gap-3">
              <input type="hidden" name="project_id" value={projectId} />
              <select name="commercial_status" defaultValue={project.commercial_status || "lead"} className="min-h-11 flex-1 rounded-xl border border-white/10 bg-black px-3 text-sm text-white/70">
                {commercialStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button className="rounded-xl border border-gold/25 px-4 text-sm text-gold">{isArabic ? "حفظ" : "Save"}</button>
            </form>
            <p className="mt-4 text-xs leading-6 text-white/30">{isArabic ? "قيمة العرض تمثل قيمة خط المبيعات وليست إيرادًا محصلًا. الإيراد المحصل = المدفوع ناقص سجلات الاسترداد." : "Quoted amount is pipeline value, not collected revenue. Collected revenue = paid entries less refund entries."}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <h2 className="text-lg font-light text-white">{isArabic ? "تسجيل حركة مالية" : "Record ledger entry"}</h2>
            <p className="mt-2 text-xs leading-6 text-white/35">{isArabic ? "عند الاسترداد أضف حركة جديدة بحالة Refunded ولا تحوّل الدفعة الأصلية إلى مستردة، حتى يبقى صافي التحصيل صحيحًا." : "For a refund, add a new Refunded ledger entry instead of converting the original paid entry, so net collected remains correct."}</p>
            <form action={createCastingPaymentAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="project_id" value={projectId} />
              <input name="amount" type="number" min="0.01" step="0.01" required placeholder={isArabic ? "المبلغ" : "Amount"} className="min-h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white" />
              <input name="currency" defaultValue={currency} maxLength={3} pattern="[A-Za-z]{3}" className="min-h-11 rounded-xl border border-white/10 bg-black px-3 text-sm uppercase text-white" />
              <select name="status" defaultValue="pending" className="min-h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white/70">{paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
              <input name="provider" placeholder={isArabic ? "مزود الدفع" : "Provider"} className="min-h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white" />
              <input name="provider_reference" placeholder={isArabic ? "مرجع العملية" : "Provider reference"} className="min-h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white sm:col-span-2" />
              <textarea name="internal_notes" placeholder={isArabic ? "ملاحظات داخلية" : "Internal notes"} className="min-h-24 rounded-xl border border-white/10 bg-black p-3 text-sm text-white sm:col-span-2" />
              <button className="min-h-11 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 text-sm text-gold sm:col-span-2">{isArabic ? "إضافة للسجل" : "Add ledger entry"}</button>
            </form>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-light text-white">{isArabic ? "سجل المدفوعات" : "Payment ledger"}</h2><span className="text-xs text-white/30">{paymentRows.length}</span></div>
          {paymentRows.length === 0 ? <p className="mt-5 text-sm text-white/35">{isArabic ? "لا توجد حركات مالية مسجلة." : "No ledger entries recorded."}</p> : <div className="mt-5 space-y-3">{paymentRows.map((payment) => {
            const statusOptions = payment.status === "refunded" ? ["refunded"] : mutablePaymentStatuses;
            return (
              <div key={payment.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-sm text-white/80">{Number(payment.amount || 0).toLocaleString()} {payment.currency || currency}</p><p className="mt-1 text-xs text-white/30">{[payment.provider, payment.provider_reference].filter(Boolean).join(" · ") || `#${payment.id}`} · {payment.status}</p></div>
                  <form action={updateCastingPaymentStatusAction} className="flex gap-2">
                    <input type="hidden" name="project_id" value={projectId} />
                    <input type="hidden" name="payment_id" value={payment.id} />
                    <select name="status" defaultValue={payment.status} className="rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-white/65">{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select>
                    <button disabled={payment.status === "refunded"} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 disabled:cursor-not-allowed disabled:opacity-40">{isArabic ? "تحديث" : "Update"}</button>
                  </form>
                </div>
              </div>
            );
          })}</div>}
        </section>
      </div>
    </div>
  );
}
