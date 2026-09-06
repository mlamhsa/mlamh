import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  emergencyStopMarketingAction,
  setExternalExecutionPolicyAction,
  setMarketingAgentActiveAction,
  setMarketingTeamPausedAction,
} from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function riyadhDayWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const startMs = Date.parse(`${get("year")}-${get("month")}-${get("day")}T00:00:00+03:00`);
  return { start: new Date(startMs).toISOString(), end: new Date(startMs + 86400000).toISOString() };
}

function statusVariant(status: string, active: boolean) {
  if (!active || status === "paused") return "muted" as const;
  if (status === "working") return "gold" as const;
  if (status === "error") return "danger" as const;
  return "success" as const;
}

export default async function MarketingControlCenterPage({ searchParams }: PageProps) {
  await requireMarketingAdminAccess("marketing.manage");
  const { lang } = await searchParams;
  const language = getAdminLanguage(lang);
  const ar = language === "ar";
  const db = createAdminClient();
  const day = riyadhDayWindow();

  const [settingsResult, agentsResult, integrationsResult, pendingApprovalsResult, queuedTasksResult, sentTodayResult] = await Promise.all([
    db.from("marketing_settings").select("key,value").in("key", [
      "marketing_team_paused",
      "external_execution_enabled",
      "external_execution_channels",
      "external_execution_email_daily_limit",
      "external_execution_test_mode",
    ]),
    db.from("marketing_agents").select("id,name,role,status,is_active,current_task_id,tasks_completed,tasks_failed,last_action_at").order("id"),
    db.from("marketing_integrations").select("provider,status,capabilities").order("provider"),
    db.from("marketing_approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("marketing_tasks").select("id", { count: "exact", head: true }).in("status", ["queued", "scheduled", "running"]),
    db.from("marketing_channel_jobs").select("id", { count: "exact", head: true }).eq("channel", "email").eq("status", "published").gte("published_at", day.start).lt("published_at", day.end),
  ]);

  const settings = new Map((settingsResult.data ?? []).map((row) => [row.key, record(row.value)]));
  const teamPaused = settings.get("marketing_team_paused")?.paused === true;
  const externalEnabled = settings.get("external_execution_enabled")?.enabled === true;
  const channels = stringArray(settings.get("external_execution_channels")?.channels);
  const emailEnabled = channels.includes("email");
  const bufferEnabled = channels.includes("buffer");
  const dailyEmailLimit = Math.max(1, Math.min(Number(settings.get("external_execution_email_daily_limit")?.limit ?? 10) || 10, 100));
  const testMode = settings.get("external_execution_test_mode")?.enabled === true;
  const agents = agentsResult.data ?? [];
  const integrations = integrationsResult.data ?? [];
  const zoho = integrations.find((item) => item.provider === "email" || item.provider === "zoho_mail" || item.provider === "zoho");
  const buffer = integrations.find((item) => item.provider === "buffer");
  const activeAgents = agents.filter((agent) => agent.is_active).length;
  const workingAgents = agents.filter((agent) => agent.status === "working").length;
  const sentToday = sentTodayResult.count ?? 0;

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow={ar ? "MLAMH · مركز التحكم" : "MLAMH · CONTROL CENTER"}
      title={ar ? "مركز تحكم فريق التسويق" : "Marketing Team Control Center"}
      description={ar ? "تحكم تشغيلي مباشر في الفريق، قنوات التنفيذ، حدود الإرسال، وحالة الأمان — بدون الحاجة لتعديل الإعدادات يدويًا خارج Marketing Hub." : "Direct operational control over the team, execution channels, send limits, and safety state — without editing infrastructure settings outside Marketing Hub."}
    />

    <AdminGrid className="mb-6 md:grid-cols-4">
      <AdminStatCard label={ar ? "أعضاء مفعّلون" : "Active agents"} value={activeAgents}/>
      <AdminStatCard label={ar ? "يعملون الآن" : "Working now"} value={workingAgents}/>
      <AdminStatCard label={ar ? "مهام مفتوحة" : "Open tasks"} value={queuedTasksResult.count ?? 0}/>
      <AdminStatCard label={ar ? "قرارات تنتظرك" : "Pending decisions"} value={pendingApprovalsResult.count ?? 0}/>
    </AdminGrid>

    <AdminCard className={`mb-6 overflow-hidden ${teamPaused ? "border-amber-300/25 bg-amber-300/[0.035]" : "border-emerald-400/20 bg-emerald-400/[0.025]"}`}>
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge variant={teamPaused ? "warning" : "success"}>{teamPaused ? (ar ? "الفريق متوقف" : "TEAM PAUSED") : (ar ? "الفريق يعمل" : "TEAM RUNNING")}</AdminBadge>
            <AdminBadge variant={externalEnabled ? "success" : "muted"}>{externalEnabled ? (ar ? "التنفيذ الخارجي مفعّل" : "EXTERNAL ON") : (ar ? "التنفيذ الخارجي مقفل" : "EXTERNAL LOCKED")}</AdminBadge>
            <AdminBadge variant="gold">{ar ? "اعتماد قبل الإرسال" : "APPROVAL FIRST"}</AdminBadge>
          </div>
          <h2 className="mt-3 text-xl font-medium text-white">{teamPaused ? (ar ? "تم إيقاف الدورات الجديدة والتنفيذ الخارجي الآلي" : "New cycles and autonomous external execution are paused") : (ar ? "الفريق جاهز للدورات التشغيلية" : "The team is ready for operational cycles")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">{ar ? "الإيقاف لا يمسح المهام أو المحتوى. عند الاستئناف يعود الفريق للعمل من الحالة الحالية، بينما تبقى بوابات الاعتماد وحدود الإرسال فعالة." : "Pausing does not delete tasks or content. Resume continues from the current state while approval gates and send limits remain enforced."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={setMarketingTeamPausedAction}><input type="hidden" name="paused" value={teamPaused ? "false" : "true"}/><button className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/75 hover:bg-white/[0.07]">{teamPaused ? (ar ? "استئناف الفريق" : "Resume team") : (ar ? "إيقاف مؤقت" : "Pause team")}</button></form>
          <form action={emergencyStopMarketingAction}><button className="rounded-xl border border-red-400/25 bg-red-400/[0.06] px-4 py-2.5 text-xs font-medium text-red-100">{ar ? "إيقاف طارئ" : "Emergency stop"}</button></form>
        </div>
      </div>
    </AdminCard>

    <div className="mb-6 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <AdminCard className="overflow-hidden">
        <div className="border-b border-white/[0.07] px-5 py-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">EXTERNAL EXECUTION POLICY</p><h2 className="mt-1 text-lg text-white">{ar ? "قنوات التنفيذ وحدود Pilot" : "Execution channels & pilot limits"}</h2></div>
        <form action={setExternalExecutionPolicyAction} className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4"><div><p className="text-sm font-medium text-white/80">{ar ? "بوابة التنفيذ الخارجي" : "External execution gate"}</p><p className="mt-1 text-xs leading-5 text-white/35">{ar ? "تفعيلها لا يكفي وحده؛ يجب تحديد القنوات المسموح لها أدناه." : "Enabling the gate is not enough; allowed channels must also be selected below."}</p></div><label className="flex items-center gap-2 text-xs text-white/55"><input type="checkbox" name="enabled" value="true" defaultChecked={externalEnabled}/>{ar ? "مفعّل" : "Enabled"}</label></div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className={`rounded-2xl border p-4 ${emailEnabled ? "border-gold/25 bg-gold/[0.05]" : "border-white/[0.07] bg-black/20"}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-white/80">Zoho Email</p><p className="mt-1 text-[11px] text-white/30">{zoho?.status ?? (ar ? "غير معروف" : "unknown")}</p></div><input type="checkbox" name="channels" value="email" defaultChecked={emailEnabled}/></div></label>
            <label className={`rounded-2xl border p-4 ${bufferEnabled ? "border-gold/25 bg-gold/[0.05]" : "border-white/[0.07] bg-black/20"}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-white/80">Buffer / Social</p><p className="mt-1 text-[11px] text-white/30">{buffer?.status ?? (ar ? "غير معروف" : "unknown")}</p></div><input type="checkbox" name="channels" value="buffer" defaultChecked={bufferEnabled}/></div></label>
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-white/80">{ar ? "حد إرسال البريد اليومي" : "Daily email send limit"}</p><p className="mt-1 text-xs text-white/35">{ar ? `أُرسل اليوم ${sentToday} من ${dailyEmailLimit}` : `${sentToday} of ${dailyEmailLimit} sent today`}</p></div><input name="daily_email_limit" type="number" min="1" max="100" defaultValue={dailyEmailLimit} className="w-28 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gold/70" style={{ width: `${Math.min(100, (sentToday / dailyEmailLimit) * 100)}%` }}/></div></div>

          <div className="mt-4 flex items-center justify-between gap-4"><p className="text-[11px] leading-5 text-white/30">{testMode ? (ar ? "Test Mode متاح كذلك للوجهات المقيدة." : "Test Mode is also available for allowlisted targets.") : (ar ? "Test Mode غير مفعّل." : "Test Mode is disabled.")}</p><button className="rounded-xl border border-gold/25 bg-gold/[0.08] px-4 py-2.5 text-xs font-medium text-gold">{ar ? "حفظ سياسة التنفيذ" : "Save execution policy"}</button></div>
        </form>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-white/[0.07] px-5 py-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">SAFETY MODEL</p><h2 className="mt-1 text-lg text-white">{ar ? "طبقات الحماية" : "Safety layers"}</h2></div>
        <div className="divide-y divide-white/[0.06] text-sm">
          {[
            [ar ? "المحتوى قابل للتعديل قبل النشر" : "Content editable before publishing", true],
            [ar ? "اعتماد مطلوب قبل الإرسال الخارجي" : "Approval required before external send", true],
            [ar ? "قنوات Production محددة صراحة" : "Production channels explicitly scoped", true],
            [ar ? "حد يومي للبريد" : "Daily email cap", true],
            [ar ? "منع التكرار عبر Idempotency" : "Idempotency duplicate protection", true],
            [ar ? "إيقاف طارئ للفريق والتنفيذ" : "Emergency stop for team and execution", true],
          ].map(([labelText], index) => <div key={index} className="flex items-center justify-between gap-4 px-5 py-4"><span className="text-white/55">{String(labelText)}</span><AdminBadge variant="success">ON</AdminBadge></div>)}
        </div>
      </AdminCard>
    </div>

    <AdminCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">TEAM OPERATIONS</p><h2 className="mt-1 text-lg text-white">{ar ? "التحكم بأعضاء الفريق" : "Agent controls"}</h2></div><p className="text-xs text-white/30">{agents.length} {ar ? "أعضاء" : "agents"}</p></div>
      <div className="divide-y divide-white/[0.06]">{agents.map((agent) => <div key={agent.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1.3fr_.8fr_.8fr_auto] md:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-white/85">{agent.name}</p><AdminBadge variant={statusVariant(agent.status, agent.is_active)}>{agent.is_active ? agent.status : (ar ? "موقوف" : "paused")}</AdminBadge></div><p className="mt-1 truncate text-xs text-white/35">{agent.role}</p></div><div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">{ar ? "المهمة الحالية" : "Current task"}</p><p className="mt-1 text-xs text-white/55">{agent.current_task_id ? `#${agent.current_task_id}` : "—"}</p></div><div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">{ar ? "الإنجاز / الفشل" : "Done / failed"}</p><p className="mt-1 text-xs text-white/55">{agent.tasks_completed ?? 0} / {agent.tasks_failed ?? 0}</p></div><form action={setMarketingAgentActiveAction}><input type="hidden" name="agent_id" value={agent.id}/><input type="hidden" name="active" value={agent.is_active ? "false" : "true"}/><button className={`rounded-xl border px-3 py-2 text-xs font-medium ${agent.is_active ? "border-white/10 bg-white/[0.035] text-white/60" : "border-gold/25 bg-gold/[0.08] text-gold"}`}>{agent.is_active ? (ar ? "إيقاف" : "Pause") : (ar ? "تشغيل" : "Resume")}</button></form></div>)}</div>
    </AdminCard>
  </AdminPageContainer>;
}