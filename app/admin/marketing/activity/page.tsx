import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

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

  return (
    <AdminPageContainer>
      <AdminPageHeader title={isArabic ? "نشاط فريق AI" : "AI Team Activity"} description={isArabic ? "سجل قابل للتتبع لما فعله فريق التسويق الذكي ولماذا وما كانت النتيجة." : "Traceable record of what the AI marketing team did, why, and with what result."} />
      {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "سجل Marketing Hub غير مفعّل في قاعدة البيانات بعد." : "Marketing Hub activity storage is not active in the database yet."}</AdminCard> : null}
      <AdminCard className="overflow-hidden">
        <div className="divide-y divide-white/[0.07]">
          {activity.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا يوجد نشاط حقيقي مسجل حتى الآن." : "No real AI activity recorded yet."}</div> : activity.map((item) => (
            <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[.8fr_1.3fr_1fr_.8fr]">
              <div><div className="text-sm text-gold">{item.agent_id ?? "system"}</div><div className="mt-1 text-[11px] text-white/35">Task {item.task_id ?? "—"}</div></div>
              <div><div className="text-sm text-white">{item.action}</div><div className="mt-1 text-xs text-white/40">{item.reason ?? "—"}</div></div>
              <div className="text-xs text-white/50">{item.entity_type ? `${item.entity_type}:${item.entity_id ?? "—"}` : "—"}<div className="mt-1">{item.channel ?? "internal"}</div></div>
              <div className="text-xs"><span className={item.error ? "text-red-300" : "text-white/45"}>{item.error ? "error" : (item.approval_status ?? "logged")}</span><div className="mt-1 text-white/30">{new Date(item.created_at).toLocaleString(isArabic ? "ar-SA" : "en-US")}</div></div>
            </div>
          ))}
        </div>
      </AdminCard>
    </AdminPageContainer>
  );
}
