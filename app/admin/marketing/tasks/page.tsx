import {
  AdminCard,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { getMarketingAIConfigurationState } from "@/lib/marketing/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createMarketingTaskAction,
  runNextMarketingTaskAction,
} from "./actions";
import { RunNextTaskButton, TaskLiveRefresh } from "./TaskLiveControls";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ lang?: string; status?: string }>;
};

type Task = {
  id: number;
  agent_id: string | null;
  task_type: string;
  title: string;
  priority: string;
  status: string;
  channel: string | null;
  approval_level: string;
  approval_status: string;
  scheduled_at: string | null;
  retry_count: number;
  output: unknown;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  created_at: string;
};

type RecordValue = Record<string, unknown>;

type ExecutiveItem = {
  key: string;
  labelAr: string;
  labelEn: string;
  value: string;
};

const allowedStatuses = new Set([
  "queued",
  "scheduled",
  "running",
  "waiting_approval",
  "completed",
  "failed",
  "cancelled",
]);

const priorityAr: Record<string, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "عالية",
  urgent: "عاجلة",
};

const approvalAr: Record<string, string> = {
  auto: "تلقائي",
  approval_required: "يتطلب اعتمادًا",
  ceo_only: "اعتماد الرئيس التنفيذي",
  pending: "بانتظار الاعتماد",
  approved: "معتمد",
  rejected: "مرفوض",
};

const channelAr: Record<string, string> = {
  facebook: "فيسبوك",
  instagram: "إنستقرام",
  email: "البريد الإلكتروني",
  buffer: "النشر الاجتماعي",
  linkedin: "لينكدإن",
  tiktok: "تيك توك",
  website: "الموقع",
};

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function taskOutputValue(output: unknown) {
  if (!isRecord(output)) return output;
  return isRecord(output.value) ? output.value : output;
}

function outputMeta(output: unknown) {
  if (!isRecord(output)) return null;
  return {
    provider: typeof output.provider === "string" ? output.provider : null,
    model: typeof output.model === "string" ? output.model : null,
  };
}

function formatDate(value: string | null, isArabic: boolean) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: string, isArabic: boolean) {
  if (!isArabic) return status.replaceAll("_", " ");
  const labels: Record<string, string> = {
    queued: "في الانتظار",
    scheduled: "مجدولة",
    running: "جاري التحليل",
    waiting_approval: "بانتظار الاعتماد",
    completed: "مكتملة",
    failed: "فشلت",
    cancelled: "ملغاة",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

function localizedValue(value: string | null | undefined, map: Record<string, string>, isArabic: boolean) {
  if (!value) return "—";
  return isArabic ? map[value] ?? value.replaceAll("_", " ") : value.replaceAll("_", " ");
}

function stringifyExecutiveValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const items = value
      .map((item) => typeof item === "string" ? item.trim() : isRecord(item) ? null : String(item))
      .filter((item): item is string => Boolean(item));
    return items.join(" · ");
  }
  return "";
}

function executiveItems(value: unknown): ExecutiveItem[] {
  if (typeof value === "string") {
    const text = value.trim();
    return text ? [{ key: "summary", labelAr: "الملخص", labelEn: "Summary", value: text }] : [];
  }
  if (!isRecord(value)) return [];

  const definitions: Array<[string[], string, string, string]> = [
    [["summary", "executive_summary", "overview"], "summary", "الملخص", "Summary"],
    [["recommendation", "recommended_action", "decision"], "recommendation", "التوصية", "Recommendation"],
    [["reason", "rationale", "why"], "reason", "لماذا؟", "Rationale"],
    [["content", "caption", "copy", "message", "draft"], "content", "المحتوى", "Content"],
    [["hook", "headline", "title"], "hook", "الخطاف / العنوان", "Hook / title"],
    [["channel", "target_channel", "platform"], "channel", "القناة", "Channel"],
    [["result", "outcome"], "result", "النتيجة", "Result"],
    [["next_action", "next_step", "follow_up"], "next_action", "الخطوة التالية", "Next action"],
  ];

  const items: ExecutiveItem[] = [];
  for (const [keys, key, labelAr, labelEn] of definitions) {
    for (const candidate of keys) {
      const text = stringifyExecutiveValue(value[candidate]);
      if (text) {
        items.push({ key, labelAr, labelEn, value: text });
        break;
      }
    }
  }
  return items;
}

function TechnicalDetails({ value, isArabic }: { value: unknown; isArabic: boolean }) {
  return (
    <details className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <summary className="cursor-pointer text-xs text-white/45 marker:text-white/20">
        {isArabic ? "عرض التفاصيل التقنية" : "Show technical details"}
      </summary>
      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-[10px] leading-5 text-white/40">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

function TaskResult({ task, isArabic }: { task: Task; isArabic: boolean }) {
  const value = taskOutputValue(task.output);
  const meta = outputMeta(task.output);
  const valueRecord = isRecord(value) ? value : null;
  const priorities = valueRecord && isRecord(valueRecord.three_internal_priorities)
    ? Object.values(valueRecord.three_internal_priorities).filter(isRecord)
    : [];
  const items = executiveItems(value);
  const rawResultStatus = valueRecord && typeof valueRecord.status === "string"
    ? valueRecord.status
    : null;
  const resultStatus = rawResultStatus
    ? statusLabel(rawResultStatus, isArabic)
    : isArabic
      ? "اكتمل التحليل"
      : "Analysis completed";

  return (
    <AdminCard className="mb-5 overflow-hidden border border-emerald-500/20 bg-emerald-500/[0.035]">
      <div className="border-b border-white/[0.07] px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-300">
                {isArabic ? "آخر نتيجة من ذكاء التسويق" : "Latest Marketing AI result"}
              </p>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-white">#{task.id} · {task.title}</h2>
            <p className="mt-1 text-xs text-white/40">{resultStatus}</p>
          </div>
          <div className="text-start text-xs text-white/35 md:text-end">
            <p>{formatDate(task.completed_at, isArabic)}</p>
            {(meta?.provider || meta?.model) && (
              <p className="mt-1">{[meta.provider, meta.model].filter(Boolean).join(" · ")}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {priorities.length > 0 && (
          <div className="mb-4 grid gap-3 lg:grid-cols-3">
            {priorities.map((priority, index) => {
              const focus = typeof priority.focus === "string"
                ? priority.focus
                : `${isArabic ? "الأولوية" : "Priority"} ${index + 1}`;
              const actions = Array.isArray(priority.actions)
                ? priority.actions.filter((action): action is string => typeof action === "string")
                : [];
              return (
                <div key={`${focus}-${index}`} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-gold/70">
                    {isArabic ? `الأولوية ${index + 1}` : `Priority ${index + 1}`}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white/85">{focus}</p>
                  {actions.length > 0 && (
                    <ul className="mt-3 space-y-2 text-xs leading-5 text-white/50">
                      {actions.map((action) => (
                        <li key={action} className="flex gap-2">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/35" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {items.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {items.map((item) => (
              <div key={item.key} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gold/70">
                  {isArabic ? item.labelAr : item.labelEn}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/70">{item.value}</p>
              </div>
            ))}
          </div>
        ) : priorities.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
            <p className="text-sm text-white/65">
              {isArabic
                ? "اكتملت المهمة، لكن المخرجات لا تحتوي حقولًا تنفيذية معروفة لعرضها هنا."
                : "The task completed, but its output does not contain recognized executive fields."}
            </p>
          </div>
        ) : null}

        <TechnicalDetails value={value} isArabic={isArabic} />
      </div>
    </AdminCard>
  );
}

export default async function MarketingTasksPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang, status } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const selectedStatus = status && allowedStatuses.has(status) ? status : null;
  const admin = createAdminClient();
  const aiState = getMarketingAIConfigurationState();

  let query = admin
    .from("marketing_tasks")
    .select("id,agent_id,task_type,title,priority,status,channel,approval_level,approval_status,scheduled_at,retry_count,output,started_at,completed_at,failed_at,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (selectedStatus) query = query.eq("status", selectedStatus);

  const [{ data, error }, agentsResult] = await Promise.all([
    query,
    admin
      .from("marketing_agents")
      .select("id,name,role,is_active")
      .eq("is_active", true)
      .order("id"),
  ]);

  if (error) console.error("[MarketingTasksPage]", error);
  const tasks = (data ?? []) as Task[];
  const agents = agentsResult.data ?? [];
  const agentNames = new Map(agents.map((agent) => [agent.id, agent.name]));
  const filters = ["queued", "scheduled", "running", "waiting_approval", "completed", "failed"];
  const runnableCount = tasks.filter((task) =>
    ["queued", "scheduled"].includes(task.status) &&
    (task.approval_level === "auto" || task.approval_status === "approved"),
  ).length;
  const runningCount = tasks.filter((task) => task.status === "running").length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const failedCount = tasks.filter((task) => task.status === "failed").length;
  const latestResult = tasks.find((task) => task.status === "completed" && task.output);

  return (
    <AdminPageContainer>
      <TaskLiveRefresh enabled={runningCount > 0} />

      <AdminPageHeader
        title={isArabic ? "محرك المهام" : "Task Engine"}
        description={
          isArabic
            ? "أنشئ وشغّل مهام ذكاء التسويق وشاهد النتيجة التنفيذية مباشرة داخل مركز القيادة."
            : "Create and run Marketing AI tasks and review executive results directly in the command center."
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard className="p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-white/30">{isArabic ? "قابلة للتنفيذ" : "Runnable"}</p><p className="mt-2 text-2xl font-semibold text-white">{runnableCount}</p></AdminCard>
        <AdminCard className="p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-white/30">{isArabic ? "تعمل الآن" : "Running now"}</p><div className="mt-2 flex items-center gap-2">{runningCount > 0 && <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />}<p className="text-2xl font-semibold text-white">{runningCount}</p></div></AdminCard>
        <AdminCard className="p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-white/30">{isArabic ? "مكتملة" : "Completed"}</p><p className="mt-2 text-2xl font-semibold text-emerald-300">{completedCount}</p></AdminCard>
        <AdminCard className="p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-white/30">{isArabic ? "فشلت" : "Failed"}</p><p className="mt-2 text-2xl font-semibold text-amber-200">{failedCount}</p></AdminCard>
      </div>

      <AdminCard className="mb-5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-white">{isArabic ? "حالة ذكاء التسويق" : "Marketing AI Runtime"}</p>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] ${aiState.configured ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
                {aiState.configured ? (isArabic ? "جاهز" : "READY") : (isArabic ? "يحتاج إعدادًا" : "SETUP REQUIRED")}
              </span>
            </div>
            <p className="mt-2 text-xs text-white/40">{aiState.provider} · {aiState.model}{!aiState.configured && aiState.reason ? ` · ${aiState.reason}` : ""}</p>
            <p className="mt-1 text-xs text-white/30" aria-live="polite">
              {runningCount > 0
                ? isArabic
                  ? "ذكاء التسويق يعمل الآن. ستتحدث الصفحة تلقائيًا عند اكتمال التحليل."
                  : "Marketing AI is working. This page will refresh automatically when the analysis completes."
                : isArabic
                  ? `${runnableCount} مهمة قابلة للتنفيذ بعد استيفاء الحوكمة.`
                  : `${runnableCount} tasks are eligible to run after governance checks.`}
            </p>
          </div>
          {aiState.configured ? <form action={runNextMarketingTaskAction}><RunNextTaskButton isArabic={isArabic} /></form> : <div className="max-w-md text-xs leading-6 text-white/40">{isArabic ? "التشغيل الخارجي للذكاء الاصطناعي متوقف بأمان حتى تتم إضافة إعداد المزود إلى بيئة الخادم. لا يتم حفظ المفاتيح في قاعدة البيانات أو عرضها في لوحة الإدارة." : "AI execution stays safely disabled until a server-side AI provider is configured. Secrets are never stored in the database or displayed in Admin."}</div>}
        </div>
      </AdminCard>

      {latestResult && <TaskResult task={latestResult} isArabic={isArabic} />}

      <AdminCard className="mb-5 p-5">
        <form action={createMarketingTaskAction} className="grid gap-3 xl:grid-cols-4">
          <input name="title" required placeholder={isArabic ? "عنوان المهمة" : "Task title"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          <input name="task_type" required placeholder={isArabic ? "نوع المهمة" : "Task type"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          <select name="agent_id" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="">{isArabic ? "بدون مسؤول محدد" : "Unassigned"}</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} — {agent.role}</option>)}</select>
          <select name="priority" defaultValue="normal" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="low">{isArabic ? "منخفضة" : "low"}</option><option value="normal">{isArabic ? "عادية" : "normal"}</option><option value="high">{isArabic ? "عالية" : "high"}</option><option value="urgent">{isArabic ? "عاجلة" : "urgent"}</option></select>
          <input name="channel" placeholder={isArabic ? "القناة" : "Channel"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          <select name="approval_level" defaultValue="" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="">{isArabic ? "تلقائي حسب نوع المهمة" : "Policy default"}</option><option value="auto">{isArabic ? "تلقائي" : "auto"}</option><option value="approval_required">{isArabic ? "يتطلب اعتمادًا" : "approval required"}</option><option value="ceo_only">{isArabic ? "اعتماد الرئيس التنفيذي" : "CEO only"}</option></select>
          <input type="datetime-local" name="scheduled_at" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          <input name="objective" placeholder={isArabic ? "الهدف" : "Objective"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          <button className="rounded-xl bg-gold px-4 py-2 text-sm text-black xl:col-span-4">{isArabic ? "إنشاء المهمة" : "Create task"}</button>
        </form>
      </AdminCard>

      <div className="mb-5 flex flex-wrap gap-2">
        <a href={`/admin/marketing/tasks?lang=${language}`} className={`rounded-full border px-3 py-1.5 text-xs ${!selectedStatus ? "border-gold/40 text-gold" : "border-white/10 text-white/45"}`}>{isArabic ? "الكل" : "All"}</a>
        {filters.map((filter) => <a key={filter} href={`/admin/marketing/tasks?lang=${language}&status=${filter}`} className={`rounded-full border px-3 py-1.5 text-xs ${selectedStatus === filter ? "border-gold/40 text-gold" : "border-white/10 text-white/45"}`}>{statusLabel(filter, isArabic)}</a>)}
      </div>

      {error ? (
        <AdminCard className="p-5 text-sm text-amber-200/80">{isArabic ? "تعذر قراءة بيانات محرك المهام من قاعدة البيانات." : "Could not read Task Engine data."}</AdminCard>
      ) : tasks.length === 0 ? (
        <AdminCard className="p-8 text-center"><p className="text-white/65">{isArabic ? "لا توجد مهام حتى الآن." : "No real tasks yet."}</p></AdminCard>
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="border-b border-white/10 bg-white/[0.025] text-xs text-white/40">
                <tr><th className="px-4 py-3 text-start">{isArabic ? "رقم" : "ID"}</th><th className="px-4 py-3 text-start">{isArabic ? "المهمة" : "Task"}</th><th className="px-4 py-3 text-start">{isArabic ? "المسؤول" : "Agent"}</th><th className="px-4 py-3 text-start">{isArabic ? "الأولوية" : "Priority"}</th><th className="px-4 py-3 text-start">{isArabic ? "الحالة" : "Status"}</th><th className="px-4 py-3 text-start">{isArabic ? "الاعتماد" : "Approval"}</th><th className="px-4 py-3 text-start">{isArabic ? "القناة" : "Channel"}</th><th className="px-4 py-3 text-start">{isArabic ? "النتيجة" : "Result"}</th><th className="px-4 py-3 text-start">{isArabic ? "المحاولات" : "Retry"}</th></tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {tasks.map((task) => {
                  const summary = executiveItems(taskOutputValue(task.output));
                  return (
                    <tr key={task.id} className="text-white/65">
                      <td className="px-4 py-3 tabular-nums text-white/35">#{task.id}</td>
                      <td className="px-4 py-3"><p className="text-white/80">{task.title}</p><p className="mt-0.5 text-[10px] text-white/30">{task.task_type.replaceAll("_", " ")}</p></td>
                      <td className="px-4 py-3">{task.agent_id ? agentNames.get(task.agent_id) ?? task.agent_id : "—"}</td>
                      <td className="px-4 py-3">{localizedValue(task.priority, priorityAr, isArabic)}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2">{task.status === "running" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />}{task.status === "completed" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}<span>{statusLabel(task.status, isArabic)}</span></div></td>
                      <td className="px-4 py-3"><p>{localizedValue(task.approval_level, approvalAr, isArabic)}</p><p className="text-[10px] text-white/30">{localizedValue(task.approval_status, approvalAr, isArabic)}</p></td>
                      <td className="px-4 py-3">{localizedValue(task.channel, channelAr, isArabic)}</td>
                      <td className="px-4 py-3">
                        {task.output ? (
                          <details className="group max-w-[360px]">
                            <summary className="cursor-pointer text-xs text-gold/80 marker:text-white/20">{summary[0]?.value ? `${isArabic ? summary[0].labelAr : summary[0].labelEn}: ${summary[0].value.slice(0, 90)}${summary[0].value.length > 90 ? "…" : ""}` : (isArabic ? "عرض النتيجة" : "View result")}</summary>
                            <div className="mt-2 space-y-2 rounded-xl border border-white/[0.08] bg-black/30 p-3">{summary.length > 0 ? summary.slice(0,4).map((item) => <div key={item.key}><p className="text-[10px] text-gold/60">{isArabic ? item.labelAr : item.labelEn}</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-white/55">{item.value}</p></div>) : <p className="text-xs text-white/45">{isArabic ? "لا توجد حقول تنفيذية معروفة في هذه النتيجة." : "No recognized executive fields in this result."}</p>}<TechnicalDetails value={taskOutputValue(task.output)} isArabic={isArabic} /></div>
                          </details>
                        ) : task.status === "running" ? <span className="text-xs text-gold/70">{isArabic ? "جاري التحليل..." : "Analyzing..."}</span> : "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{task.retry_count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </AdminPageContainer>
  );
}
