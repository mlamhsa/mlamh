"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function revalidateMarketingApprovalViews() {
  revalidatePath("/admin/marketing/approvals");
  revalidatePath("/admin/marketing/tasks");
  revalidatePath("/admin/marketing/activity");
}

async function decideApproval(
  formData: FormData,
  decision: "approved" | "rejected" | "cancelled" | "scheduled",
  executeImmediately = false,
) {
  const user = await requireAdminAccess();
  const approvalId = Number(formData.get("approval_id"));
  if (!Number.isInteger(approvalId) || approvalId <= 0) throw new Error("Invalid approval id.");

  const db = createAdminClient();
  const { data: approval, error: readError } = await db
    .from("marketing_approvals")
    .select("id,task_id,status,approval_level,channel")
    .eq("id", approvalId)
    .single();

  if (readError || !approval) throw new Error("Approval not found.");
  if (approval.status !== "pending") throw new Error("Approval is no longer pending.");

  const decisionNote = String(formData.get("decision_note") ?? "").trim() || null;
  const executeAfterRaw = String(formData.get("execute_after") ?? "").trim();
  const executeAfter = decision === "scheduled" && executeAfterRaw
    ? new Date(executeAfterRaw).toISOString()
    : null;

  if (decision === "scheduled" && !executeAfter) {
    throw new Error("A schedule time is required.");
  }

  const now = new Date().toISOString();
  const { error: approvalError } = await db
    .from("marketing_approvals")
    .update({
      status: decision,
      decision_by_user_id: user.id,
      decision_note: decisionNote,
      decided_at: decision === "scheduled" ? null : now,
      execute_after: executeAfter,
      updated_at: now,
    })
    .eq("id", approvalId)
    .eq("status", "pending");

  if (approvalError) throw new Error(`[approval decision] ${approvalError.message}`);

  const taskPatch = decision === "approved"
    ? {
        approval_status: "approved",
        status: "queued",
        updated_at: now,
        ...(executeImmediately ? { metadata: { execute_immediately_requested: true, requested_by: user.id } } : {}),
      }
    : decision === "scheduled"
      ? { approval_status: "approved", status: "scheduled", scheduled_at: executeAfter, updated_at: now }
      : decision === "rejected"
        ? { approval_status: "rejected", status: "cancelled", updated_at: now }
        : { approval_status: "cancelled", status: "cancelled", updated_at: now };

  const { error: taskError } = await db.from("marketing_tasks").update(taskPatch).eq("id", approval.task_id);
  if (taskError) throw new Error(`[approval task update] ${taskError.message}`);

  await db.from("marketing_agent_activity").insert({
    task_id: approval.task_id,
    action: executeImmediately ? "approval_approved_execute_requested" : `approval_${decision}`,
    reason: decisionNote,
    channel: approval.channel ?? "internal",
    approval_status: decision,
    result: { approval_id: approvalId, decided_by: user.id, execute_immediately: executeImmediately },
  });

  revalidateMarketingApprovalViews();
}

export async function editMarketingApproval(formData: FormData) {
  const user = await requireAdminAccess();
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

  await db.from("marketing_agent_activity").insert({
    task_id: approval.task_id,
    action: "approval_edited",
    reason,
    approval_status: "pending",
    result: { approval_id: approvalId, edited_by: user.id },
  });

  revalidateMarketingApprovalViews();
}

export async function approveMarketingApproval(formData: FormData) { await decideApproval(formData, "approved"); }
export async function approveAndExecuteMarketingApproval(formData: FormData) { await decideApproval(formData, "approved", true); }
export async function rejectMarketingApproval(formData: FormData) { await decideApproval(formData, "rejected"); }
export async function cancelMarketingApproval(formData: FormData) { await decideApproval(formData, "cancelled"); }
export async function scheduleMarketingApproval(formData: FormData) { await decideApproval(formData, "scheduled"); }
