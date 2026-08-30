import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ lang?: string }> };

type Agent = {
  id: string;
  name: string;
  role: string;
  status: string;
  autonomy_level: string;
  assigned_channels: string[] | null;
  current_task_id: number | null;
  last_action_at: string | null;
  next_scheduled_task_at: string | null;
  tasks_completed: number;
  tasks_failed: number;
};

const statusLabel: Record<string, { ar: string; en: string }> = {
  idle: { ar: "متاح", en: "Idle" },
  working: { ar: "يعمل الآن", en: "Working" },
  waiting_approval: { ar: "بانتظار اعتماد", en: "Waiting approval" },
  scheduled: { ar: "مجدول", en: "Scheduled" },
  paused: { ar: "متوقف", en: "Paused" },
  error: { ar: "خطأ", en: "Error" },
};

export default async function MarketingAiTeamPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const admin = createAdminClient();

  const [{ data: agents, error }, { count: queued }, { count: running }, { count: approvals }] = await Promise.all([
    admin.from("marketing_agents").select("id,name,role,status,autonomy_level,assigned_channels,current_task_id,last_action_at,next_scheduled_task_at,tasks_completed,tasks_failed").eq("is_active", true).order("id"),
    admin.from("marketing_tasks").select("id", { count: "exact", head: true }).in("status", ["queued", "scheduled"]),
    admin.from("marketing_tasks").select("id", { count: "exact", head: true }).eq("status", "running"),
    admin.from("marketing_approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  if (error) console.error("[MarketingAiTeamPage]", error);
  const team = (agents ?? []) as Agent[];

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "فريق الذكاء الاصطناعي" : "AI Team"}
        description={isArabic ? "حالة فريق التسويق التشغيلي، المهام الجارية، مستوى الاستقلالية، وما ينتظر اعتمادك." : "Operational marketing team status, active work, autonomy levels, and approvals awaiting your decision."}
      />

      <AdminGrid className="mb-8 md:grid-cols-3">
        <AdminStatCard label={isArabic ? "مهام في الطابور" : "Queued tasks"} value={queued ?? 0} />
        <AdminStatCard label={isArabic ? "يعمل عليها الآن" : "Running now"} value={running ?? 0} />
        <AdminStatCard label={isArabic ? "بانتظار اعتماد" : "Awaiting approval"} value={approvals ?? 0} />
      </AdminGrid>

      {error ? (
        <AdminCard className="p-5 text-sm text-amber-200/80">
          {isArabic ? "جداول Marketing Hub لم تُفعّل في قاعدة البيانات بعد. الواجهة جاهزة وستقرأ البيانات الحقيقية فور تطبيق Migration المعتمدة." : "Marketing Hub tables are not active in the database yet. This view is ready and will read real data once the approved migration is applied."}
        </AdminCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {team.map((agent) => {
            const label = statusLabel[agent.status] ?? { ar: agent.status, en: agent.status };
            return (
              <AdminCard key={agent.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-light text-white">{agent.name}</p>
                    <p className="mt-1 text-sm text-white/45">{agent.role}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-gold/80">{isArabic ? label.ar : label.en}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-black/20 p-3"><p className="text-white/35">{isArabic ? "الاستقلالية" : "Autonomy"}</p><p className="mt-1 text-white/75">{agent.autonomy_level}</p></div>
                  <div className="rounded-xl bg-black/20 p-3"><p className="text-white/35">{isArabic ? "المهمة الحالية" : "Current task"}</p><p className="mt-1 text-white/75">{agent.current_task_id ?? "—"}</p></div>
                  <div className="rounded-xl bg-black/20 p-3"><p className="text-white/35">{isArabic ? "مكتملة" : "Completed"}</p><p className="mt-1 tabular-nums text-white/75">{agent.tasks_completed}</p></div>
                  <div className="rounded-xl bg-black/20 p-3"><p className="text-white/35">{isArabic ? "فشلت" : "Failed"}</p><p className="mt-1 tabular-nums text-white/75">{agent.tasks_failed}</p></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(agent.assigned_channels ?? []).map((channel) => <span key={channel} className="rounded-lg border border-white/[0.07] px-2 py-1 text-[10px] text-white/40">{channel}</span>)}
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </AdminPageContainer>
  );
}
