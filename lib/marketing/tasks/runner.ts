import { getMarketingAIProvider } from "@/lib/marketing/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";

type ClaimedTask = { id: number; agent_id: string | null; task_type: string; title: string; objective: string | null; input: Record<string, unknown> | null; channel: string | null; retry_count: number; max_retries: number; };

async function getMlamhGrounding() {
  const db = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [talents, completedProfiles, publishers, opportunities, publishedOpportunities, applications, approvals, integrations] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent").gte("created_at", since),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent").not("profile_completed_at", "is", null).gte("profile_completed_at", since),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "publisher").gte("created_at", since),
    db.from("opportunities").select("id", { count: "exact", head: true }).gte("created_at", since),
    db.from("events").select("id", { count: "exact", head: true }).eq("event_type", "opportunity_published").gte("created_at", since),
    db.from("opportunity_applications").select("id", { count: "exact", head: true }).gte("created_at", since),
    db.from("marketing_approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("marketing_integrations").select("provider,status").order("provider"),
  ]);
  const safe = (row: { count: number | null; error: unknown }) => row.error ? null : row.count ?? 0;
  return {
    product: { name: "MLAMH | ملامح", category: "Talent & Opportunities Platform" },
    operating_policy: { external_actions_require_governance: true, never_claim_execution_without_recorded_result: true },
    last_7_days: { talent_registrations: safe(talents), completed_talent_profiles: safe(completedProfiles), publisher_registrations: safe(publishers), opportunities_created: safe(opportunities), opportunities_published: safe(publishedOpportunities), opportunity_applications: safe(applications) },
    decision_queue: { pending_approvals: safe(approvals) },
    integrations: integrations.error ? [] : integrations.data ?? [],
    data_rule: "Use only supplied MLAMH facts and metrics. If a metric is null or absent, explicitly say data is unavailable. Never invent traffic, conversion, CRM, pricing, revenue, campaign, lead, or attribution data.",
  };
}

async function setAgentCompleted(agentId: string, now: string) {
  const db = createAdminClient();
  const { data } = await db.from("marketing_agents").select("tasks_completed").eq("id", agentId).maybeSingle();
  await db.from("marketing_agents").update({ status: "idle", last_action_at: now, current_task_id: null, tasks_completed: (data?.tasks_completed ?? 0) + 1, updated_at: now }).eq("id", agentId);
}

async function setAgentFailed(agentId: string, terminal: boolean, now: string) {
  const db = createAdminClient();
  if (!terminal) {
    await db.from("marketing_agents").update({ status: "idle", current_task_id: null, updated_at: now }).eq("id", agentId);
    return;
  }
  const { data } = await db.from("marketing_agents").select("tasks_failed").eq("id", agentId).maybeSingle();
  await db.from("marketing_agents").update({ status: "error", current_task_id: null, tasks_failed: (data?.tasks_failed ?? 0) + 1, updated_at: now }).eq("id", agentId);
}

export async function runNextMarketingTask(workerId: string) {
  const db = createAdminClient();
  const { data, error } = await db.rpc("claim_next_marketing_task", { p_worker_id: workerId });
  if (error) throw new Error(`[claim_next_marketing_task] ${error.message}`);
  const task = (data?.[0] ?? null) as ClaimedTask | null;
  if (!task) return null;

  try {
    if (task.agent_id) await db.from("marketing_agents").update({ status: "working", current_task_id: task.id, updated_at: new Date().toISOString() }).eq("id", task.agent_id);
    const grounding = await getMlamhGrounding();
    const provider = getMarketingAIProvider();
    const response = await provider.generate({
      taskType: task.task_type,
      responseFormat: "json",
      messages: [
        { role: "system", content: "You are an internal AI operator inside MLAMH (ملامح), a Talent & Opportunities Platform. You are not a generic B2B marketing SaaS. Analyze only the live MLAMH context supplied with the task. Separate observed facts from recommendations and never invent unavailable metrics or named leads. Prioritize marketplace liquidity: qualified talent supply, publisher demand, opportunities, applications, conversion, retention, revenue readiness, and defensibility. Never make prices, contracts, partnerships, ad-spend, legal commitments, guarantees, or CEO-only decisions. Never claim that content, email, or any external action was executed unless the supplied task context contains a recorded execution result. Return concise operational JSON with: executive_summary, observed_signals, priorities, recommended_next_actions, data_gaps, decisions_needed. Never expose hidden chain-of-thought." },
        { role: "user", content: JSON.stringify({ task: { title: task.title, objective: task.objective, input: task.input ?? {}, channel: task.channel }, live_mlamh_context: grounding }) },
      ],
      metadata: { task_id: task.id, agent_id: task.agent_id },
    });

    let output: unknown = response.content;
    try { output = JSON.parse(response.content); } catch { /* text output remains visible */ }
    const now = new Date().toISOString();
    const { error: completionError } = await db.from("marketing_tasks").update({ status: "completed", output: { value: output, provider: response.provider, model: response.model ?? null, usage: response.usage ?? {}, grounded_at: now }, completed_at: now, locked_at: null, locked_by: null, updated_at: now }).eq("id", task.id);
    if (completionError) throw new Error(`[marketing_task.complete] ${completionError.message}`);
    if (task.agent_id) await setAgentCompleted(task.agent_id, now);
    await db.from("marketing_agent_activity").insert({ agent_id: task.agent_id, task_id: task.id, action: "task_completed", reason: task.objective ?? task.title, channel: task.channel ?? "internal", result: { provider: response.provider, model: response.model ?? null, grounded: true } });
    return { taskId: task.id, status: "completed" as const };
  } catch (runError) {
    const message = runError instanceof Error ? runError.message : "Unknown task error";
    const nextRetry = task.retry_count + 1;
    const terminal = nextRetry > task.max_retries;
    const now = new Date().toISOString();
    await db.from("marketing_tasks").update({ status: terminal ? "failed" : "queued", retry_count: nextRetry, failed_at: terminal ? now : null, locked_at: null, locked_by: null, updated_at: now }).eq("id", task.id);
    if (task.agent_id) await setAgentFailed(task.agent_id, terminal, now);
    await db.from("marketing_agent_activity").insert({ agent_id: task.agent_id, task_id: task.id, action: terminal ? "task_failed" : "task_retry_queued", reason: task.objective ?? task.title, channel: task.channel ?? "internal", error: message, result: { retry_count: nextRetry, max_retries: task.max_retries } });
    return { taskId: task.id, status: terminal ? "failed" as const : "retry_queued" as const, error: message };
  }
}
