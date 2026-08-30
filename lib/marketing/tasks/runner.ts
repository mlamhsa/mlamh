import { getMarketingAIProvider } from "@/lib/marketing/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";

type ClaimedTask = {
  id: number;
  agent_id: string | null;
  task_type: string;
  title: string;
  objective: string | null;
  input: Record<string, unknown> | null;
  channel: string | null;
  retry_count: number;
  max_retries: number;
};

export async function runNextMarketingTask(workerId: string) {
  const db = createAdminClient();
  const { data, error } = await db.rpc("claim_next_marketing_task", { p_worker_id: workerId });
  if (error) throw new Error(`[claim_next_marketing_task] ${error.message}`);
  const task = (data?.[0] ?? null) as ClaimedTask | null;
  if (!task) return null;

  try {
    const provider = getMarketingAIProvider();
    const response = await provider.generate({
      taskType: task.task_type,
      responseFormat: "json",
      messages: [
        {
          role: "system",
          content: "You are an internal MLAMH Marketing Hub agent. Follow approved playbooks and governance. Never make prices, contracts, partnerships, ad-spend, legal commitments, guarantees, or other CEO-only decisions. Return concise operational output only; never expose hidden chain-of-thought.",
        },
        {
          role: "user",
          content: JSON.stringify({ title: task.title, objective: task.objective, input: task.input ?? {}, channel: task.channel }),
        },
      ],
      metadata: { task_id: task.id, agent_id: task.agent_id },
    });

    let output: unknown = response.content;
    try { output = JSON.parse(response.content); } catch { /* text output is valid */ }
    const now = new Date().toISOString();

    await db.from("marketing_tasks").update({
      status: "completed",
      output: { value: output, provider: response.provider, model: response.model ?? null, usage: response.usage ?? {} },
      completed_at: now,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    }).eq("id", task.id);

    if (task.agent_id) {
      await db.from("marketing_agents").update({ last_action_at: now, current_task_id: null, updated_at: now }).eq("id", task.agent_id);
    }

    await db.from("marketing_agent_activity").insert({
      agent_id: task.agent_id,
      task_id: task.id,
      action: "task_completed",
      reason: task.objective ?? task.title,
      channel: task.channel ?? "internal",
      result: { provider: response.provider, model: response.model ?? null },
    });

    return { taskId: task.id, status: "completed" as const };
  } catch (runError) {
    const message = runError instanceof Error ? runError.message : "Unknown task error";
    const nextRetry = task.retry_count + 1;
    const terminal = nextRetry > task.max_retries;
    const now = new Date().toISOString();

    await db.from("marketing_tasks").update({
      status: terminal ? "failed" : "queued",
      retry_count: nextRetry,
      failed_at: terminal ? now : null,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    }).eq("id", task.id);

    await db.from("marketing_agent_activity").insert({
      agent_id: task.agent_id,
      task_id: task.id,
      action: terminal ? "task_failed" : "task_retry_queued",
      reason: task.objective ?? task.title,
      channel: task.channel ?? "internal",
      error: message,
      result: { retry_count: nextRetry, max_retries: task.max_retries },
    });

    return { taskId: task.id, status: terminal ? "failed" as const : "retry_queued" as const, error: message };
  }
}
