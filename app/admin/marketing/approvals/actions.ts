"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

async function decideApproval(formData: FormData, decision: "approved" | "rejected" | "cancelled" | "scheduled") {
  const user = await requireAdminAccess();
  const approvalId = Number(formData.get("approval_id"));
  if (!Number.isInteger(approvalId) || approvalId <= 0) throw new Error("Invalid approval id.");

  const db = createAdminClient();
  const { data: approval, error: readError } = await db.from("marketing_approvals").select("id,task_id,status,approval_level,channel").eq("id", approvalId).single();
  if (readError || !approval) throw new Error("Approval not found.");
  if (approval.status !== "pending") throw new Error("Approval is no longer pending.");

  const decisionNote = String(formData.get("decision_note") ?? "").trim() || null;
  const executeAfterRaw = String(formData.get("execute_after") ?? "").trim();
  const executeAfter = decision === "scheduled" && executeAfterRaw ? new Date(executeAfterRaw).toISOString() : null;

  const { error: approvalError } = await db.from("marketing_approvals").update({
    status: decision,
    decision_by_user_id: user.id,
    decision_note: decisionNote,
    decided_at: decision === "scheduled" ? null : new Date().toISOString(),
    execute_after: executeAfter,
    updated_at: new Date().toISOString(),
  }).eq("id", approvalId).eq("status", "pending");
  if (approvalError) throw new Error(`[approval decision] ${approvalError.message}`);

  const taskPatch = decision === "approved"
    ? { approval_status: "approved", status: "queued", updated_at: new Date().toISOString() }
    : decision === "scheduled"
      ? { approval_status: "approved", status: "scheduled", scheduled_at: executeAfter, updated_at: new Date().toISOString() }
      : decision === "rejected"
        ? { approval_status: "rejected", status: "cancelled", updated_at: new Date().toISOString() }
        : { approval_status: "cancelled", status: "cancelled", updated_at: new Date().toISOString() };

  const { error: taskError } = await db.from("marketing_tasks").update(taskPatch).eq("id", approval.task_id);
  if (taskError) throw new Error(`[approval task update] ${taskError.message}`);

  await db.from("marketing_agent_activity").insert({
    task_id: approval.task_id,
    action: `approval_${decision}`,
    reason: decisionNote,
    channel: approval.channel ?? "internal",
    approval_status: decision,
    result: { approval_id: approvalId, decided_by: user.id },
  });

  revalidatePath("/admin/marketing/approvals");
  revalidatePath("/admin/marketing/tasks");
  revalidatePath("/admin/marketing/activity");
}

export async function approveMarketingApproval(formData: FormData) { await decideApproval(formData, "approved"); }
export async function rejectMarketingApproval(formData: FormData) { await decideApproval(formData, "rejected"); }
export async function cancelMarketingApproval(formData: FormData) { await decideApproval(formData, "cancelled"); }
export async function scheduleMarketingApproval(formData: FormData) { await decideApproval(formData, "scheduled"); }
