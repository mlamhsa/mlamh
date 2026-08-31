"use server";

import { revalidatePath } from "next/cache";
import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function revalidateMarketingApprovalViews() {
  for (const path of ["/admin/marketing/approvals", "/admin/marketing/tasks", "/admin/marketing/activity", "/admin/marketing/content", "/admin/marketing/social", "/admin/marketing/campaigns", "/admin/marketing/outreach"]) revalidatePath(path);
}

function toTaskInput(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function applyApprovalSideEffects({ approvalId, task, decision, executeAfter }: {
  approvalId: number;
  task: { id: number; task_type: string; content_id: number | null; campaign_id: number | null; lead_id: number | null; channel: string | null; input: unknown };
  decision: "approved" | "rejected" | "cancelled" | "scheduled";
  executeAfter: string | null;
}) {
  const db = createAdminClient();
  const input = toTaskInput(task.input);
  const now = new Date().toISOString();

  if (task.task_type === "social_publish" && task.content_id) {
    if (decision === "approved" || decision === "scheduled") {
      const channel = task.channel ?? (typeof input.channel === "string" ? input.channel : null);
      const target = typeof input.target === "string" ? input.target : null;
      if (!channel) throw new Error("Publishing provider is required.");
      if (channel === "buffer" && target !== "instagram" && target !== "facebook") throw new Error("Buffer publishing target is required.");
      const idempotencyKey = `task-${task.id}-${channel}-${target ?? "default"}`;
      const { error: jobError } = await db.from("marketing_channel_jobs").upsert({
        content_id: task.content_id,
        task_id: task.id,
        approval_id: approvalId,
        channel,
        status: decision === "scheduled" ? "scheduled" : "approved",
        scheduled_at: decision === "scheduled" ? executeAfter : null,
        idempotency_key: idempotencyKey,
        payload: input,
        updated_at: now,
      }, { onConflict: "idempotency_key" });
      if (jobError) throw new Error(`[approval channel job] ${jobError.message}`);
      await db.from("marketing_content").update({ status: decision === "scheduled" ? "scheduled" : "ready", scheduled_at: decision === "scheduled" ? executeAfter : null, updated_at: now }).eq("id", task.content_id);
    } else {
      await db.from("marketing_content").update({ status: "review", updated_at: now }).eq("id", task.content_id);
      await db.from("marketing_channel_jobs").update({ status: "cancelled", updated_at: now }).eq("task_id", task.id).in("status", ["draft", "waiting_approval", "approved", "scheduled", "failed"]);
    }
  }

  if (task.task_type === "create_campaign" && task.campaign_id) {
    if (decision === "approved") await db.from("marketing_campaigns").update({ status: "active", updated_at: now }).eq("id", task.campaign_id);
    else if (decision === "scheduled") await db.from("marketing_campaigns").update({ status: "draft", updated_at: now }).eq("id", task.campaign_id);
    else await db.from("marketing_campaigns").update({ status: "cancelled", updated_at: now }).eq("id", task.campaign_id);
  }

  if (task.task_type === "first_outreach") {
    const outreachId = Number(input.outreach_id);
    if (Number.isInteger(outreachId) && outreachId > 0) {
      const sendStatus = decision === "approved" ? "approved" : decision === "scheduled" ? "scheduled" : "cancelled";
      await db.from("marketing_outreach").update({ send_status: sendStatus, next_follow_up_at: decision === "scheduled" ? executeAfter : undefined, updated_at: now }).eq("id", outreachId);
    }
  }
}

async function decideApproval(formData: FormData, decision: "approved" | "rejected" | "cancelled" | "scheduled") {
  const user = await requireMarketingAdminAccess("marketing.approve");
  const approvalId = Number(formData.get("approval_id"));
  if (!Number.isInteger(approvalId) || approvalId <= 0) throw new Error("Invalid approval id.");
  const db = createAdminClient();
  const { data: approval, error: readError } = await db.from("marketing_approvals").select("id,task_id,status,approval_level,channel").eq("id", approvalId).single();
  if (readError || !approval) throw new Error("Approval not found.");
  if (approval.status !== "pending") throw new Error("Approval is no longer pending.");
  const { data: task, error: taskReadError } = await db.from("marketing_tasks").select("id,task_type,content_id,campaign_id,lead_id,channel,input").eq("id", approval.task_id).single();
  if (taskReadError || !task) throw new Error("Approval task not found.");
  const decisionNote = String(formData.get("decision_note") ?? "").trim() || null;
  const executeAfterRaw = String(formData.get("execute_after") ?? "").trim();
  const executeAfter = decision === "scheduled" && executeAfterRaw ? new Date(executeAfterRaw).toISOString() : null;
  if (decision === "scheduled" && !executeAfter) throw new Error("A schedule time is required.");
  const now = new Date().toISOString();
  const { error: approvalError } = await db.from("marketing_approvals").update({ status: decision, decision_by_user_id: user.id, decision_note: decisionNote, decided_at: decision === "scheduled" ? null : now, execute_after: executeAfter, updated_at: now }).eq("id", approvalId).eq("status", "pending");
  if (approvalError) throw new Error(`[approval decision] ${approvalError.message}`);
  const taskPatch = decision === "approved"
    ? { approval_status: "approved", status: "queued", scheduled_at: null, updated_at: now }
    : decision === "scheduled"
      ? { approval_status: "approved", status: "scheduled", scheduled_at: executeAfter, updated_at: now }
      : decision === "rejected"
        ? { approval_status: "rejected", status: "cancelled", updated_at: now }
        : { approval_status: "cancelled", status: "cancelled", updated_at: now };
  const { error: taskError } = await db.from("marketing_tasks").update(taskPatch).eq("id", approval.task_id);
  if (taskError) throw new Error(`[approval task update] ${taskError.message}`);
  await applyApprovalSideEffects({ approvalId, task, decision, executeAfter });
  await db.from("marketing_agent_activity").insert({ task_id: approval.task_id, action: `approval_${decision}`, reason: decisionNote, channel: approval.channel ?? "internal", approval_status: decision, result: { approval_id: approvalId, decided_by: user.id, auto_execute: false } });
  revalidateMarketingApprovalViews();
}

export async function editMarketingApproval(formData: FormData) {
  const user = await requireMarketingAdminAccess("marketing.approve");
  const approvalId = Number(formData.get("approval_id"));
  if (!Number.isInteger(approvalId) || approvalId <= 0) throw new Error("Invalid approval id.");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const previewText = String(formData.get("preview_json") ?? "").trim();
  let preview: Record<string, unknown> = {};
  if (previewText) {
    const parsed = JSON.parse(previewText) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Preview must be a JSON object.");
    preview = parsed as Record<string, unknown>;
  }
  const db = createAdminClient();
  const { data: approval, error: readError } = await db.from("marketing_approvals").select("task_id,status").eq("id", approvalId).single();
  if (readError || !approval || approval.status !== "pending") throw new Error("Only pending approvals can be edited.");
  const { error } = await db.from("marketing_approvals").update({ reason, preview, updated_at: new Date().toISOString() }).eq("id", approvalId).eq("status", "pending");
  if (error) throw new Error(`[edit approval] ${error.message}`);
  await db.from("marketing_agent_activity").insert({ task_id: approval.task_id, action: "approval_edited", reason, approval_status: "pending", result: { approval_id: approvalId, edited_by: user.id } });
  revalidateMarketingApprovalViews();
}

export async function approveMarketingApproval(formData: FormData) { await decideApproval(formData, "approved"); }
export async function rejectMarketingApproval(formData: FormData) { await decideApproval(formData, "rejected"); }
export async function cancelMarketingApproval(formData: FormData) { await decideApproval(formData, "cancelled"); }
export async function scheduleMarketingApproval(formData: FormData) { await decideApproval(formData, "scheduled"); }
