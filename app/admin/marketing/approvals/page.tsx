import { AdminCard, AdminPageContainer, AdminPageHeader, AdminStatCard, AdminGrid } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveMarketingApproval, cancelMarketingApproval, editMarketingApproval, rejectMarketingApproval, scheduleMarketingApproval } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function MarketingApprovalsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_approvals").select("id,task_id,requested_by_agent_id,approval_level,status,reason,proposed_action,preview,channel,risk_level,expires_at,execute_after,created_at").order("created_at", { ascending: false }).limit(100);
  const approvals = data ?? [];
  const pending = approvals.filter((item) => item.status === "pending").length;
  const ceoOnly = approvals.filter((item) => item.status === "pending" && item.approval_level === "ceo_only").length;
  const highRisk = approvals.filter((item) => item.status === "pending" && ["high", "critical"].includes(item.risk_level)).length;

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "مركز الاعتمادات" : "Approvals Center"} description={isArabic ? "الاعتماد يجهّز Job فقط ولا ينشر تلقائيًا. الجدولة قرار منفصل، والتنفيذ يتم من Social Scheduler." : "Approval prepares a job only and never auto-publishes. Scheduling is separate; execution happens from Social Scheduler."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول Marketing Hub غير مفعلة بعد. لن يتم عرض بيانات افتراضية." : "Marketing Hub tables are not active yet. No mock data will be shown."}</AdminCard> : null}
    <AdminGrid className="mb-6 md:grid-cols-3"><AdminStatCard label={isArabic ? "بانتظار الاعتماد" : "Pending"} value={pending} /><AdminStatCard label={isArabic ? "CEO فقط" : "CEO Only"} value={ceoOnly} /><AdminStatCard label={isArabic ? "مخاطر مرتفعة" : "High Risk"} value={highRisk} /></AdminGrid>
    <div className="space-y-4">{approvals.length === 0 ? <AdminCard className="p-6 text-sm text-white/40">{isArabic ? "لا توجد طلبات اعتماد حقيقية حاليًا." : "No real approval requests yet."}</AdminCard> : approvals.map((item) => <AdminCard key={item.id} className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-sm text-white">#{item.id} · Task #{item.task_id} · {item.requested_by_agent_id ?? "system"}</div><div className="mt-1 text-xs text-white/40">{item.reason ?? (isArabic ? "بدون سبب مسجل" : "No reason recorded")}</div></div><div className="text-end"><div className="text-xs text-gold">{item.status}</div><div className="mt-1 text-[11px] text-white/35">{item.approval_level} · {item.risk_level} · {item.channel ?? "internal"}</div></div></div>
      {item.status === "pending" ? <div className="mt-5 space-y-3"><form action={editMarketingApproval} className="grid gap-2 lg:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="approval_id" value={item.id}/><input name="reason" defaultValue={item.reason ?? ""} placeholder={isArabic ? "سبب/ملاحظة" : "Reason/note"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"/><input name="preview_json" defaultValue={JSON.stringify(item.preview ?? {})} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"/><button className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/65">{isArabic ? "تعديل" : "Edit"}</button></form><div className="flex flex-wrap gap-2"><form action={approveMarketingApproval}><input type="hidden" name="approval_id" value={item.id}/><button className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 text-xs text-gold">{isArabic ? "اعتماد وتجهيز للنشر" : "Approve & Make Ready"}</button></form><form action={rejectMarketingApproval}><input type="hidden" name="approval_id" value={item.id}/><button className="rounded-xl border border-red-400/20 px-4 py-2 text-xs text-red-300">{isArabic ? "رفض" : "Reject"}</button></form><form action={cancelMarketingApproval}><input type="hidden" name="approval_id" value={item.id}/><button className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50">{isArabic ? "إلغاء" : "Cancel"}</button></form></div><form action={scheduleMarketingApproval} className="flex flex-wrap gap-2"><input type="hidden" name="approval_id" value={item.id}/><input type="datetime-local" name="execute_after" required className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"/><button className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60">{isArabic ? "اعتماد مع وقت جدولة" : "Approve with Schedule"}</button></form></div> : null}
    </AdminCard>)}</div>
  </AdminPageContainer>;
}
