import {
  AdminCard,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingTaskAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string; status?: string }> };
type Task = { id: number; agent_id: string | null; task_type: string; title: string; priority: string; status: string; channel: string | null; approval_level: string; approval_status: string; scheduled_at: string | null; retry_count: number; created_at: string };
const allowedStatuses = new Set(["queued", "scheduled", "running", "waiting_approval", "completed", "failed", "cancelled"]);

export default async function MarketingTasksPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang, status } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const selectedStatus = status && allowedStatuses.has(status) ? status : null;
  const admin = createAdminClient();

  let query = admin.from("marketing_tasks").select("id,agent_id,task_type,title,priority,status,channel,approval_level,approval_status,scheduled_at,retry_count,created_at").order("created_at", { ascending: false }).limit(100);
  if (selectedStatus) query = query.eq("status", selectedStatus);
  const [{ data, error }, agentsResult] = await Promise.all([
    query,
    admin.from("marketing_agents").select("id,name,role,is_active").eq("is_active", true).order("id"),
  ]);
  if (error) console.error("[MarketingTasksPage]", error);
  const tasks = (data ?? []) as Task[];
  const agents = agentsResult.data ?? [];
  const filters = ["queued", "scheduled", "running", "waiting_approval", "completed", "failed"];

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "محرك المهام" : "Task Engine"} description={isArabic ? "إنشاء وتفويض وجدولة مهام حقيقية مع Approval Policy وRetry وAudit." : "Create, delegate, and schedule real tasks with approval policy, retry, and audit."} />

    <AdminCard className="mb-5 p-5">
      <form action={createMarketingTaskAction} className="grid gap-3 xl:grid-cols-4">
        <input name="title" required placeholder={isArabic ? "عنوان المهمة" : "Task title"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
        <input name="task_type" required placeholder="task_type" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
        <select name="agent_id" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="">{isArabic ? "بدون Agent" : "Unassigned"}</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} — {agent.role}</option>)}</select>
        <select name="priority" defaultValue="normal" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="low">low</option><option value="normal">normal</option><option value="high">high</option><option value="urgent">urgent</option></select>
        <input name="channel" placeholder="channel" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
        <select name="approval_level" defaultValue="" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="">{isArabic ? "تلقائي حسب نوع المهمة" : "Policy default"}</option><option value="auto">auto</option><option value="approval_required">approval_required</option><option value="ceo_only">ceo_only</option></select>
        <input type="datetime-local" name="scheduled_at" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
        <input name="objective" placeholder={isArabic ? "الهدف" : "Objective"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
        <button className="rounded-xl bg-gold px-4 py-2 text-sm text-black xl:col-span-4">{isArabic ? "إنشاء المهمة" : "Create task"}</button>
      </form>
    </AdminCard>

    <div className="mb-5 flex flex-wrap gap-2"><a href={`/admin/marketing/tasks?lang=${language}`} className={`rounded-full border px-3 py-1.5 text-xs ${!selectedStatus ? "border-gold/40 text-gold" : "border-white/10 text-white/45"}`}>{isArabic ? "الكل" : "All"}</a>{filters.map((filter) => <a key={filter} href={`/admin/marketing/tasks?lang=${language}&status=${filter}`} className={`rounded-full border px-3 py-1.5 text-xs ${selectedStatus === filter ? "border-gold/40 text-gold" : "border-white/10 text-white/45"}`}>{filter}</a>)}</div>

    {error ? <AdminCard className="p-5 text-sm text-amber-200/80">{isArabic ? "Task Engine جاهز برمجيًا، لكن جداول Marketing Hub لم تُفعّل في قاعدة البيانات بعد." : "The Task Engine is implemented, but Marketing Hub tables are not active in the database yet."}</AdminCard> : tasks.length === 0 ? <AdminCard className="p-8 text-center"><p className="text-white/65">{isArabic ? "لا توجد مهام حقيقية حتى الآن." : "No real tasks yet."}</p></AdminCard> : <AdminCard className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="border-b border-white/10 bg-white/[0.025] text-xs text-white/40"><tr><th className="px-4 py-3 text-start">ID</th><th className="px-4 py-3 text-start">{isArabic ? "المهمة" : "Task"}</th><th className="px-4 py-3 text-start">Agent</th><th className="px-4 py-3 text-start">{isArabic ? "الأولوية" : "Priority"}</th><th className="px-4 py-3 text-start">{isArabic ? "الحالة" : "Status"}</th><th className="px-4 py-3 text-start">{isArabic ? "الاعتماد" : "Approval"}</th><th className="px-4 py-3 text-start">Channel</th><th className="px-4 py-3 text-start">Retry</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{tasks.map((task) => <tr key={task.id} className="text-white/65"><td className="px-4 py-3 tabular-nums text-white/35">#{task.id}</td><td className="px-4 py-3"><p className="text-white/80">{task.title}</p><p className="mt-0.5 text-[10px] text-white/30">{task.task_type}</p></td><td className="px-4 py-3">{task.agent_id ?? "—"}</td><td className="px-4 py-3">{task.priority}</td><td className="px-4 py-3">{task.status}</td><td className="px-4 py-3"><p>{task.approval_level}</p><p className="text-[10px] text-white/30">{task.approval_status}</p></td><td className="px-4 py-3">{task.channel ?? "—"}</td><td className="px-4 py-3 tabular-nums">{task.retry_count}</td></tr>)}</tbody></table></div></AdminCard>}
  </AdminPageContainer>;
}
