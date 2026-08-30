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
};

export function getDefaultApprovalLevel(taskType: string): MarketingApprovalLevel {
  const ceoOnly = new Set(["set_price", "discount", "contract", "partnership", "sponsorship", "ad_spend", "commercial_commitment", "legal_sensitive", "dispute", "guarantee"]);
  const approvalRequired = new Set(["social_publish", "first_outreach", "external_message", "create_campaign", "market_mlamh_opportunity", "non_routine_reply"]);
  if (ceoOnly.has(taskType)) return "ceo_only";
  if (approvalRequired.has(taskType)) return "approval_required";
  return "auto";
}

export async function createMarketingTask(input: CreateMarketingTaskInput) {
  const db = createAdminClient();
  const approvalLevel = input.approvalLevel ?? getDefaultApprovalLevel(input.taskType);
  const status = input.scheduledAt ? "scheduled" : approvalLevel === "auto" ? "queued" : "waiting_approval";
  const approvalStatus = approvalLevel === "auto" ? "not_required" : "pending";

  const { data: task, error } = await db.from("marketing_tasks").insert({
    agent_id: input.agentId ?? null,
    task_type: input.taskType,
    title: input.title,
    objective: input.objective ?? null,
    priority: input.priority ?? "normal",
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
    metadata: input.metadata ?? {},
  }).select("*").single();

  if (error) throw new Error(`[createMarketingTask] ${error.message}`);

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

  await db.from("marketing_agent_activity").insert({
    agent_id: input.agentId ?? null,
    task_id: task.id,
    action: "task_created",
    reason: input.objective ?? input.title,
    channel: input.channel ?? "internal",
    approval_status: approvalStatus,
    result: { status },
  });

  return task;
}
