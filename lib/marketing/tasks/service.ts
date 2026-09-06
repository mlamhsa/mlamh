import { createAdminClient } from "@/lib/supabase/admin";

export type MarketingApprovalLevel = "auto" | "approval_required" | "ceo_only";
export type MarketingTaskPriority = "low" | "normal" | "high" | "urgent";

export type CreateMarketingTaskInput = {
  agentId?: string | null;
  taskType: string;
  title: string;
  objective?: string | null;
  priority?: MarketingTaskPriority;
  channel?: string | null;
  source?: string | null;
  input?: Record<string, unknown>;
  approvalLevel?: MarketingApprovalLevel;
  scheduledAt?: string | null;
  parentTaskId?: number | null;
  campaignId?: number | null;
  leadId?: number | null;
  contentId?: number | null;
  conversationId?: number | null;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string | null;
  maxRetries?: number;
};

export function getDefaultApprovalLevel(taskType: string): MarketingApprovalLevel {
  const ceoOnly = new Set(["set_price", "discount", "contract", "partnership", "sponsorship", "ad_spend", "commercial_commitment", "legal_sensitive", "dispute", "guarantee"]);
  const approvalRequired = new Set(["social_publish", "first_outreach", "external_message", "create_campaign", "market_mlamh_opportunity", "non_routine_reply"]);
  if (ceoOnly.has(taskType)) return "ceo_only";
  if (approvalRequired.has(taskType)) return "approval_required";
  return "auto";
}

function defaultSlaHours(priority: MarketingTaskPriority) {
  if (priority === "urgent") return 4;
  if (priority === "high") return 12;
  if (priority === "low") return 72;
  return 24;
}

function expectedOutputFor(taskType: string) {
  const outputs: Record<string, string> = {
    lead_enrichment: "verified_contact_readiness",
    outreach_preparation: "review_ready_outreach",
    content_strategy: "production_ready_content_drafts",
    creative_brief: "publishable_creative_asset",
    social_publish: "approved_channel_job",
    growth_analytics: "decision_ready_insight",
    growth_strategy: "prioritized_marketing_direction",
    community_growth: "qualified_talent_growth_actions",
  };
  return outputs[taskType] ?? "documented_operational_output";
}

async function findTaskByIdempotencyKey(db: ReturnType<typeof createAdminClient>, idempotencyKey: string) {
  const { data, error } = await db
    .from("marketing_tasks")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`[createMarketingTask.idempotency_lookup] ${error.message}`);
  return data;
}

async function logDeduplicatedTask(
  db: ReturnType<typeof createAdminClient>,
  input: CreateMarketingTaskInput,
  existingTask: Record<string, any>,
  idempotencyKey: string,
) {
  await db.from("marketing_agent_activity").insert({
    agent_id: input.agentId ?? existingTask.agent_id ?? null,
    task_id: existingTask.id,
    action: "deduplicated",
    reason: `Skipped duplicate task: ${input.title}`,
    channel: input.channel ?? existingTask.channel ?? "internal",
    approval_status: existingTask.approval_status ?? "not_required",
    result: { status: existingTask.status, idempotency_key: idempotencyKey },
  });
}

export async function createMarketingTask(input: CreateMarketingTaskInput) {
  const db = createAdminClient();
  const approvalLevel = input.approvalLevel ?? getDefaultApprovalLevel(input.taskType);
  const priority = input.priority ?? "normal";
  const status = input.scheduledAt ? "scheduled" : approvalLevel === "auto" ? "queued" : "waiting_approval";
  const approvalStatus = approvalLevel === "auto" ? "not_required" : "pending";
  const idempotencyKey = input.idempotencyKey?.trim() || null;

  if (idempotencyKey) {
    const existingTask = await findTaskByIdempotencyKey(db, idempotencyKey);
    if (existingTask) {
      await logDeduplicatedTask(db, input, existingTask, idempotencyKey);
      return existingTask;
    }
  }

  const createdAt = new Date();
  const dueAt = new Date(createdAt.getTime() + defaultSlaHours(priority) * 60 * 60 * 1000).toISOString();
  const metadata = {
    ...(input.metadata ?? {}),
    operational_contract: {
      expected_output: expectedOutputFor(input.taskType),
      sla_hours: defaultSlaHours(priority),
      due_at: dueAt,
      dependency_task_id: input.parentTaskId ?? null,
      entity: input.leadId ? { type: "lead", id: input.leadId } : input.contentId ? { type: "content", id: input.contentId } : input.campaignId ? { type: "campaign", id: input.campaignId } : null,
    },
  };

  const { data: task, error } = await db.from("marketing_tasks").insert({
    agent_id: input.agentId ?? null,
    task_type: input.taskType,
    title: input.title,
    objective: input.objective ?? null,
    priority,
    status,
    channel: input.channel ?? null,
    source: input.source ?? null,
    input: input.input ?? {},
    approval_level: approvalLevel,
    approval_status: approvalStatus,
    scheduled_at: input.scheduledAt ?? null,
    parent_task_id: input.parentTaskId ?? null,
    campaign_id: input.campaignId ?? null,
    lead_id: input.leadId ?? null,
    content_id: input.contentId ?? null,
    conversation_id: input.conversationId ?? null,
    metadata,
    idempotency_key: idempotencyKey,
    max_retries: Math.max(0, Math.min(20, input.maxRetries ?? 3)),
  }).select("*").single();

  if (error) {
    if (idempotencyKey && error.code === "23505") {
      const existingTask = await findTaskByIdempotencyKey(db, idempotencyKey);
      if (existingTask) {
        await logDeduplicatedTask(db, input, existingTask, idempotencyKey);
        return existingTask;
      }
    }
    throw new Error(`[createMarketingTask] ${error.message}`);
  }

  if (approvalLevel !== "auto") {
    const { error: approvalError } = await db.from("marketing_approvals").insert({
      task_id: task.id,
      requested_by_agent_id: input.agentId ?? null,
      approval_level: approvalLevel,
      status: "pending",
      reason: input.objective ?? input.title,
      proposed_action: input.input ?? {},
      channel: input.channel ?? null,
      risk_level: approvalLevel === "ceo_only" ? "high" : "medium",
    });
    if (approvalError) throw new Error(`[createMarketingTask approval] ${approvalError.message}`);
  }

  if (input.agentId) {
    const agentStatus = status === "waiting_approval" ? "waiting_approval" : "scheduled";
    await db.from("marketing_agents").update({
      current_task_id: task.id,
      status: agentStatus,
      next_scheduled_task_at: input.scheduledAt ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", input.agentId);
  }

  await db.from("marketing_agent_activity").insert({
    agent_id: input.agentId ?? null,
    task_id: task.id,
    action: "task_created",
    reason: input.objective ?? input.title,
    channel: input.channel ?? "internal",
    approval_status: approvalStatus,
    result: { status, expected_output: expectedOutputFor(input.taskType), due_at: dueAt },
  });

  return task;
}
