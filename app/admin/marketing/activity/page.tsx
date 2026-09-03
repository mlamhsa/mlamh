import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

function channelLabel(value: string | null, isArabic: boolean) {
  if (!value) return isArabic ? "داخلي" : "Internal";
  if (!isArabic) return value;
  return ({ facebook: "فيسبوك", instagram: "إنستغرام", email: "البريد", buffer: "Buffer", internal: "داخلي", whatsapp: "واتساب" } as Record<string, string>)[value.toLowerCase()] ?? value;
}

function stateLabel(hasError: boolean, approvalStatus: string | null, isArabic: boolean) {
  if (hasError) return isArabic ? "يحتاج مراجعة" : "Needs review";
  const value = (approvalStatus ?? "logged").toLowerCase();
  if (!isArabic) return approvalStatus ?? "Logged";
  return ({ approved: "معتمد", pending: "بانتظار الاعتماد", rejected: "مرفوض", logged: "مسجل", sent: "تم التنفيذ", completed: "مكتمل", queued: "في الانتظار" } as Record<string, string>)[value] ?? approvalStatus ?? "مسجل";
}

export default async function MarketingActivityPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_agent_activity")
    .select("id,agent_id,task_id,action,reason,entity_type,entity_id,channel,approval_status,error,created_at")
    .order("created_at", { ascending: false })
    .limit(150);
  const activity = data ?? [];
  const errorCount = activity.filter((item) => Boolean(item.error)).length;
  const approvalCount = activity.filter((item) => (item.approval_status ?? "").toLowerCase() === "pending").length;
  const channels = new Set(activity.map((item) => item.channel).filter(Boolean)).size;

  return (
    <AdminPageContainer>
      <AdminPageHeader title={isArabic ? "سجل تحركات فريق AI" : "AI Team Activity"} description={isArabic ? "ملخص تنفيذي لما فعله الفريق، لماذا فعله، وأي تحرك يحتاج انتباهك." : "An executive view of what the team did, why it did it, and which moves need your attention."} />
      {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "سجل Marketing Hub غير مفعّل في قاعدة البيانات بعد." : "Marketing Hub activity storage is not active in the database yet."}</AdminCard> : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "تحركات مسجلة" : "Recorded moves"}</div><div className="mt-2 text-2xl font-semibold text-white">{activity.length}</div></AdminCard>
        <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "تحتاج مراجعة" : "Needs review"}</div><div className={`mt-2 text-2xl font-semibold ${errorCount > 0 ? "text-red-200" : "text-emerald-200"}`}>{errorCount + approvalCount}</div></AdminCard>
        <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "قنوات نشطة بالسجل" : "Channels in activity"}</div><div className="mt-2 text-2xl font-semibold text-gold">{channels}</div></AdminCard>
      </div>

      <div className="grid gap-3">
        {activity.length === 0 ? <AdminCard className="p-6 text-sm text-white/40">{isArabic ? "لا يوجد نشاط حقيقي مسجل حتى الآن." : "No real AI activity recorded yet."}</AdminCard> : activity.map((item) => {
          const needsAttention = Boolean(item.error) || (item.approval_status ?? "").toLowerCase() === "pending";
          return <AdminCard key={item.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-white">{item.action}</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/45">{channelLabel(item.channel, isArabic)}</span>
                </div>
                <div className="mt-2 text-sm leading-6 text-white/55">{item.reason || (isArabic ? "لم يُسجل سبب إضافي لهذا التحرك." : "No additional rationale was recorded for this move.")}</div>
              </div>
              <div className="shrink-0 text-start lg:text-end">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${needsAttention ? "border-amber-300/20 bg-amber-300/10 text-amber-200" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"}`}>{stateLabel(Boolean(item.error), item.approval_status, isArabic)}</span>
                <div className="mt-2 text-[11px] text-white/30">{new Date(item.created_at).toLocaleString(isArabic ? "ar-SA" : "en-US")}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/40">
              <span className="rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-1.5">{isArabic ? "المنفذ" : "Agent"}: <span className="text-white/65">{item.agent_id ?? (isArabic ? "النظام" : "System")}</span></span>
              {item.task_id ? <span className="rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-1.5">{isArabic ? "المهمة" : "Task"}: <span className="text-white/65">#{item.task_id}</span></span> : null}
              {item.entity_type ? <span className="rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-1.5">{isArabic ? "مرتبط بـ" : "Linked to"}: <span className="text-white/65">{item.entity_type}</span></span> : null}
            </div>

            {item.error || item.entity_id ? <details className="mt-4 rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3 text-xs text-white/40">
              <summary className="cursor-pointer select-none text-white/45">{isArabic ? "عرض التفاصيل التقنية" : "Show technical details"}</summary>
              <div className="mt-3 grid gap-2 text-[11px] leading-5 text-white/45">
                {item.entity_id ? <div>entity_id: {item.entity_id}</div> : null}
                {item.error ? <div className="text-red-200/70">error: {item.error}</div> : null}
              </div>
            </details> : null}
          </AdminCard>;
        })}
      </div>
    </AdminPageContainer>
  );
}
