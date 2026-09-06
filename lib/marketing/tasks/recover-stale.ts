import { createAdminClient } from "@/lib/supabase/admin";

type StaleRunningTask = {
  id: number;
  agent_id: string | null;
  title: string;
  channel: string | null;
  retry_count: number;
  max_retries: number;
  locked_at: string | null;
};

const DEFAULT_STALE_AFTER_MS = 20 * 60 * 1000;

export async function recoverStaleAutonomousRunningTasks({
  now = new Date(),
  staleAfterMs = DEFAULT_STALE_AFTER_MS,
}: {
  now?: Date;
  staleAfterMs?: number;
} = {}) {
  const db = createAdminClient();
  const cutoff = new Date(now.getTime() - staleAfterMs).toISOString();

  const { data, error } = await db
    .from("marketing_tasks")
    .select("id,agent_id,title,channel,retry_count,max_retries,locked_at")
    .eq("source", "autonomous_orchestrator")
    .eq("status", "running")
    .lt("locked_at", cutoff)
    .order("locked_at", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error(`[marketing_task.recover_stale.read] ${error.message}`);
  }

  const stale = (data ?? []) as StaleRunningTask[];
  if (!stale.length) {
    return { recovered: 0, requeued: 0, failed: 0 };
  }

  let requeued = 0;
  let failed = 0;
  const recoveredAt = now.toISOString();

  for (const task of stale) {
    const nextRetry = task.retry_count + 1;
    const terminal = nextRetry > task.max_retries;
    const nextStatus = terminal ? "failed" : "queued";

    const { error: updateError } = await db
      .from("marketing_tasks")
      .update({
        status: nextStatus,
        retry_count: nextRetry,
        failed_at: terminal ? recoveredAt : null,
        locked_at: null,
        locked_by: null,
        updated_at: recoveredAt,
      })
      .eq("id", task.id)
      .eq("status", "running")
      .lt("locked_at", cutoff);

    if (updateError) {
      throw new Error(`[marketing_task.recover_stale.update:${task.id}] ${updateError.message}`);
    }

    if (task.agent_id) {
      await db
        .from("marketing_agents")
        .update({
          status: terminal ? "error" : "idle",
          current_task_id: null,
          updated_at: recoveredAt,
        })
        .eq("id", task.agent_id)
        .eq("current_task_id", task.id);
    }

    await db.from("marketing_agent_activity").insert({
      agent_id: task.agent_id,
      task_id: task.id,
      action: terminal ? "stale_task_failed" : "stale_task_requeued",
      reason: `Recovered stale autonomous running task: ${task.title}`,
      channel: task.channel ?? "internal",
      result: {
        previous_status: "running",
        next_status: nextStatus,
        previous_locked_at: task.locked_at,
        recovered_at: recoveredAt,
        retry_count: nextRetry,
        max_retries: task.max_retries,
      },
    });

    if (terminal) failed += 1;
    else requeued += 1;
  }

  return { recovered: stale.length, requeued, failed };
}
