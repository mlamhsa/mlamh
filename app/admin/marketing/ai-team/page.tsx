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

type Activity = {
  id: number;
  agent_id: string | null;
  task_id: number | null;
  action: string;
  reason: string | null;
  channel: string | null;
  error: string | null;
  result: Record<string, unknown> | null;
  created_at: string;
};

const statusLabel: Record<string, { ar: string; en: string }> = {
  idle: { ar: "متاح", en: "Idle" },
  working: { ar: "يعمل الآن", en: "Working" },
  waiting_approval: { ar: "بانتظار اعتماد", en: "Waiting approval" },
  scheduled: { ar: "مجدول", en: "Scheduled" },
  paused: { ar: "متوقف", en: "Paused" },
  error: { ar: "خطأ", en: "Error" },
};

const activityLabel: Record<string, { ar: string; en: string }> = {
  task_created: { ar: "أنشأ مهمة", en: "Task created" },
  task_completed: { ar: "أكمل التحليل", en: "Analysis completed" },
  task_retry_queued: { ar: "أعاد المهمة للطابور", en: "Queued for retry" },
  task_failed: { ar: "فشلت المهمة", en: "Task failed" },
  resolved: { ar: "حدد جهة الاتصال", en: "Contact resolved" },
  lead: { ar: "جهز العميل المحتمل", en: "Lead prepared" },
  brief: { ar: "جهز الـBrief", en: "Brief prepared" },
  matched: { ar: "طابق المواهب", en: "Talent matched" },
  draft_prepared: { ar: "جهز المسودة", en: "Draft prepared" },
  approval_requested: { ar: "طلب اعتماد", en: "Approval requested" },
  deduplicated: { ar: "منع تكرار التنفيذ", en: "Duplicate prevented" },
};

function formatTime(value: string, isArabic: boolean) {
  return new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function activitySummary(activity: Activity, isArabic: boolean) {
  const label = activityLabel[activity.action] ?? { ar: activity.action, en: activity.action };
  if (activity.task_id) {
    return `${isArabic ? label.ar : label.en} · #${activity.task_id}`;
  }
  return isArabic ? label.ar : label.en;
}

export default async function MarketingAiTeamPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const admin = createAdminClient();

  const [
    { data: agents, error },
    { count: queued },
    { count: running },
    { count: approvals },
    activityResult,
  ] = await Promise.all([
    admin.from("marketing_agents").select("id,name,role,status,autonomy_level,assigned_channels,current_task_id,last_action_at,next_scheduled_task_at,tasks_completed,tasks_failed").eq("is_active", true).order("id"),
    admin.from("marketing_tasks").select("id", { count: "exact", head: true }).in("status", ["queued", "scheduled"]),
    admin.from("marketing_tasks").select("id", { count: "exact", head: true }).eq("status", "running"),
    admin.from("marketing_approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("marketing_agent_activity").select("id,agent_id,task_id,action,reason,channel,error,result,created_at").order("created_at", { ascending: false }).limit(12),
  ]);

  if (error) console.error("[MarketingAiTeamPage]", error);
  if (activityResult.error) console.error("[MarketingAiTeamPage.activity]", activityResult.error);
  const team = (agents ?? []) as Agent[];
  const activity = (activityResult.data ?? []) as Activity[];
  const agentNames = new Map(team.map((agent) => [agent.id, agent.name]));
  const latestActivityAt = activity[0]?.created_at ?? null;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "فريق الذكاء الاصطناعي" : "AI Team"}
        description={isArabic ? "شاهد ما يعمل عليه فريق التسويق الآن وآخر القرارات والتحليلات التي نفذها فعليًا." : "See what the marketing team is working on now and the latest decisions and analyses it actually executed."}
      />

      <AdminGrid className="mb-5 md:grid-cols-3">
        <AdminStatCard label={isArabic ? "مهام في الطابور" : "Queued tasks"} value={queued ?? 0} />
        <AdminStatCard label={isArabic ? "يعمل عليها الآن" : "Running now"} value={running ?? 0} />
        <AdminStatCard label={isArabic ? "بانتظار اعتماد" : "Awaiting approval"} value={approvals ?? 0} />
      </AdminGrid>

      <AdminCard className="mb-8 overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-white/[0.07] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${(running ?? 0) > 0 ? "animate-pulse bg-gold" : "bg-emerald-400"}`} />
              <h2 className="text-sm font-medium text-white">{isArabic ? "نشاط الفريق المباشر" : "Live team activity"}</h2>
            </div>
            <p className="mt-1 text-xs text-white/35">
              {isArabic ? "سجل فعلي من محرك Marketing Hub، وليس بيانات تجريبية في الواجهة." : "Real Marketing Hub engine activity, not placeholder UI data."}
            </p>
          </div>
          {latestActivityAt && (
            <p className="text-[10px] text-white/30">
              {isArabic ? "آخر حركة" : "Last activity"}: {formatTime(latestActivityAt, isArabic)}
            </p>
          )}
        </div>

        {activityResult.error ? (
          <div className="p-5 text-sm text-amber-200/70">
            {isArabic ? "تعذر قراءة سجل النشاط الآن." : "Could not read the activity feed."}
          </div>
        ) : activity.length === 0 ? (
          <div className="p-8 text-center text-sm text-white/45">
            {isArabic ? "لا يوجد نشاط مسجل حتى الآن." : "No recorded activity yet."}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {activity.map((item, index) => {
              const agentName = item.agent_id ? agentNames.get(item.agent_id) ?? item.agent_id : "Marketing AI";
              const provider = item.result && typeof item.result.provider === "string" ? item.result.provider : null;
              const model = item.result && typeof item.result.model === "string" ? item.result.model : null;
              return (
                <div key={item.id} className="flex gap-4 px-5 py-4">
                  <div className="pt-1.5">
                    <span className={`block h-2 w-2 rounded-full ${index === 0 ? "bg-emerald-400" : item.error ? "bg-amber-300" : "bg-white/20"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-white/80">{agentName}</p>
                        <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[9px] text-white/35">{item.channel ?? "internal"}</span>
                      </div>
                      <p className="text-[10px] text-white/25">{formatTime(item.created_at, isArabic)}</p>
                    </div>
                    <p className="mt-1 text-sm text-white/60">{activitySummary(item, isArabic)}</p>
                    {item.reason && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/35">{item.reason}</p>}
                    {(provider || model) && <p className="mt-2 text-[10px] text-emerald-300/55">{[provider, model].filter(Boolean).join(" · ")}</p>}
                    {item.error && <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-amber-200/55">{item.error}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>

      {error ? (
        <AdminCard className="p-5 text-sm text-amber-200/80">
          {isArabic ? "تعذر قراءة فريق Marketing Hub من قاعدة البيانات." : "Could not read the Marketing Hub team."}
        </AdminCard>
      ) : team.length === 0 ? (
        <AdminCard className="p-8 text-center text-sm text-white/45">
          {isArabic ? "لا يوجد Agents نشطون حاليًا." : "No active agents right now."}
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
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-gold/80">
                    {agent.status === "working" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />}
                    {isArabic ? label.ar : label.en}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-black/20 p-3"><p className="text-white/35">{isArabic ? "الاستقلالية" : "Autonomy"}</p><p className="mt-1 text-white/75">{agent.autonomy_level}</p></div>
                  <div className="rounded-xl bg-black/20 p-3"><p className="text-white/35">{isArabic ? "المهمة الحالية" : "Current task"}</p><p className="mt-1 text-white/75">{agent.current_task_id ? `#${agent.current_task_id}` : "—"}</p></div>
                  <div className="rounded-xl bg-black/20 p-3"><p className="text-white/35">{isArabic ? "مكتملة" : "Completed"}</p><p className="mt-1 tabular-nums text-white/75">{agent.tasks_completed}</p></div>
                  <div className="rounded-xl bg-black/20 p-3"><p className="text-white/35">{isArabic ? "فشلت" : "Failed"}</p><p className="mt-1 tabular-nums text-white/75">{agent.tasks_failed}</p></div>
                </div>
                {agent.last_action_at && (
                  <p className="mt-4 text-[10px] text-white/25">{isArabic ? "آخر نشاط" : "Last action"}: {formatTime(agent.last_action_at, isArabic)}</p>
                )}
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
