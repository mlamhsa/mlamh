import { createAdminClient } from "@/lib/supabase/admin";
import { materializeMarketingTaskOutput } from "@/lib/marketing/tasks/materialize";
import { buildDeterministicOutreachFallback, isFreeMarketingAIUnavailableError } from "@/lib/marketing/outreach/deterministic-fallback";

type CandidateTask = {
  id: number;
  agent_id: string | null;
  task_type: string;
  title: string;
  channel: string | null;
  input: Record<string, unknown> | null;
  retry_count: number;
};

export async function recoverFreeCapacityOutreachDrafts({ limit = 6 }: { limit?: number } = {}) {
  const db = createAdminClient();
  const safeLimit = Math.max(1, Math.min(limit, 12));
  const { data, error } = await db
    .from("marketing_tasks")
    .select("id,agent_id,task_type,title,channel,input,retry_count")
    .eq("source", "autonomous_orchestrator")
    .eq("task_type", "outreach_preparation")
    .eq("status", "queued")
    .gt("retry_count", 0)
    .order("updated_at", { ascending: true })
    .limit(safeLimit);
  if (error) throw new Error(`[deterministic_outreach.read] ${error.message}`);

  const recovered: Array<{ taskId: number; status: string; approvalCreated: boolean }> = [];
  for (const task of (data ?? []) as CandidateTask[]) {
    const { data: activity } = await db
      .from("marketing_agent_activity")
      .select("error")
      .eq("task_id", task.id)
      .eq("action", "task_retry_queued")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestError = typeof activity?.error === "string" ? activity.error : "";
    if (!isFreeMarketingAIUnavailableError(latestError)) continue;

    const fallback = buildDeterministicOutreachFallback(task);
    if (!fallback) continue;

    const materialized = await materializeMarketingTaskOutput({
      id: task.id,
      agent_id: task.agent_id,
      task_type: task.task_type,
      title: task.title,
    }, fallback);

    const now = new Date().toISOString();
    const { data: completed, error: completionError } = await db
      .from("marketing_tasks")
      .update({
        status: "completed",
        output: {
          value: fallback,
          provider: "deterministic-template",
          model: null,
          usage: {},
          provider_metadata: {
            fallback_reason: "free_ai_provider_unavailable",
            paid_ai_used: false,
            external_send_allowed: false,
          },
          grounded_at: now,
          materialized,
        },
        completed_at: now,
        locked_at: null,
        locked_by: null,
        updated_at: now,
      })
      .eq("id", task.id)
      .eq("status", "queued")
      .eq("retry_count", task.retry_count)
      .select("id")
      .maybeSingle();
    if (completionError) throw new Error(`[deterministic_outreach.complete:${task.id}] ${completionError.message}`);
    if (!completed?.id) continue;

    if (task.agent_id) {
      const { data: agent } = await db.from("marketing_agents").select("tasks_completed").eq("id", task.agent_id).maybeSingle();
      await db.from("marketing_agents").update({
        status: "idle",
        current_task_id: null,
        last_action_at: now,
        tasks_completed: (agent?.tasks_completed ?? 0) + 1,
        updated_at: now,
      }).eq("id", task.agent_id).eq("current_task_id", task.id);
    }

    await db.from("marketing_agent_activity").insert({
      agent_id: task.agent_id,
      task_id: task.id,
      action: "task_completed_deterministic_fallback",
      reason: "Free Marketing AI capacity was unavailable; prepared a verified-contact template draft instead.",
      channel: task.channel ?? "internal",
      result: {
        provider: "deterministic-template",
        paid_ai_used: false,
        external_send_allowed: false,
        materialized,
      },
    });

    recovered.push({
      taskId: task.id,
      status: "completed",
      approvalCreated: Boolean((materialized as Record<string, unknown>).approvalsCreated),
    });
  }

  return { recoveredCount: recovered.length, recovered };
}
