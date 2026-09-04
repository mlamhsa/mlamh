import Link from "next/link";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export default async function MarketingTasksLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAccess();
  const db = createAdminClient();
  const now = Date.now();
  const { data } = await db.from("marketing_tasks")
    .select("id,title,status,priority,agent_id,parent_task_id,metadata,created_at")
    .in("status", ["queued", "scheduled", "running", "waiting_approval"])
    .order("created_at", { ascending: true })
    .limit(200);

  const tasks = data ?? [];
  const statusById = new Map(tasks.map((task) => [task.id, task.status]));
  const rows = tasks.map((task) => {
    const contract = record(record(task.metadata).operational_contract);
    const dueAt = typeof contract.due_at === "string" ? contract.due_at : null;
    const expectedOutput = typeof contract.expected_output === "string" ? contract.expected_output : null;
    const dueMs = dueAt ? new Date(dueAt).getTime() : null;
    const overdue = Boolean(dueMs && Number.isFinite(dueMs) && dueMs < now && task.status !== "running");
    const dependencyStatus = task.parent_task_id ? statusById.get(task.parent_task_id) ?? null : null;
    const blocked = Boolean(task.parent_task_id && dependencyStatus && dependencyStatus !== "completed");
    const ageHours = Math.max(0, Math.floor((now - new Date(task.created_at).getTime()) / 3600000));
    return { ...task, dueAt, expectedOutput, overdue, blocked, dependencyStatus, ageHours };
  });

  const overdue = rows.filter((row) => row.overdue);
  const blocked = rows.filter((row) => row.blocked);
  const legacy = rows.filter((row) => !row.dueAt || !row.expectedOutput);
  const aging = rows.filter((row) => row.ageHours >= 24 && !row.overdue);

  return (
    <>
      <div className="mx-auto max-w-[1500px] px-4 pt-5 sm:px-6 lg:px-8">
        <div className="grid gap-3 md:grid-cols-4">
          <div className={`rounded-2xl border p-4 ${overdue.length ? "border-red-300/20 bg-red-300/[0.05]" : "border-emerald-300/15 bg-emerald-300/[0.035]"}`}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">SLA OVERDUE</p>
            <p className={`mt-2 text-2xl ${overdue.length ? "text-red-100" : "text-emerald-100"}`}>{overdue.length}</p>
            <p className="mt-1 text-xs text-white/35">مهام تجاوزت وقت الإنجاز المتوقع</p>
          </div>
          <div className={`rounded-2xl border p-4 ${blocked.length ? "border-amber-300/20 bg-amber-300/[0.05]" : "border-white/[0.07] bg-white/[0.02]"}`}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">DEPENDENCIES</p>
            <p className="mt-2 text-2xl text-white">{blocked.length}</p>
            <p className="mt-1 text-xs text-white/35">مهام تنتظر مخرجًا سابقًا</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">AGING 24H+</p>
            <p className="mt-2 text-2xl text-white">{aging.length}</p>
            <p className="mt-1 text-xs text-white/35">مهام مفتوحة أكثر من 24 ساعة</p>
          </div>
          <div className={`rounded-2xl border p-4 ${legacy.length ? "border-blue-300/15 bg-blue-300/[0.035]" : "border-white/[0.07] bg-white/[0.02]"}`}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">LEGACY CONTRACTS</p>
            <p className="mt-2 text-2xl text-white">{legacy.length}</p>
            <p className="mt-1 text-xs text-white/35">مهام قديمة قبل تطبيق عقد التشغيل</p>
          </div>
        </div>

        {(overdue.length > 0 || blocked.length > 0) ? (
          <div className="mt-3 rounded-2xl border border-amber-300/15 bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-white/75">أولوية التشغيل الآن</p>
                <p className="mt-1 text-xs text-white/40">عالج المتأخر والمعلق قبل إنشاء أعمال جديدة. المهمة لا تعتبر إنجازًا لمجرد وجودها في الطابور.</p>
              </div>
              <Link href="/admin/marketing/tasks?lang=ar&status=queued" className="rounded-lg border border-gold/25 px-3 py-2 text-xs text-gold">فتح الطابور</Link>
            </div>
            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              {[...overdue, ...blocked.filter((item) => !overdue.some((row) => row.id === item.id))].slice(0, 6).map((task) => (
                <div key={task.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-medium text-white/70">#{task.id} · {task.title}</p><p className="mt-1 text-[11px] text-white/35">{task.agent_id ?? "—"} · {task.priority} · عمر {task.ageHours} ساعة</p></div>
                    <span className={`rounded-full px-2 py-1 text-[10px] ${task.overdue ? "bg-red-300/10 text-red-100" : "bg-amber-300/10 text-amber-100"}`}>{task.overdue ? "SLA متأخر" : "معلق"}</span>
                  </div>
                  {task.expectedOutput ? <p className="mt-2 text-[11px] text-gold/55">Expected: {task.expectedOutput.replaceAll("_", " ")}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {children}
    </>
  );
}
