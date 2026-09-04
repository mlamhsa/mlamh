"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function updatePendingSocialApprovalContentAction(formData: FormData) {
  const user = await requireMarketingAdminAccess("marketing.approve");
  const approvalId = Number(formData.get("approval_id"));
  if (!Number.isInteger(approvalId) || approvalId <= 0) throw new Error("Invalid approval id.");

  const title = text(formData.get("title"));
  const caption = text(formData.get("caption"));
  const cta = text(formData.get("cta"));
  const lang = text(formData.get("lang")) === "en" ? "en" : "ar";
  if (!caption) throw new Error("Content text is required.");

  const db = createAdminClient();
  const { data: approval, error: approvalError } = await db
    .from("marketing_approvals")
    .select("id,task_id,status,proposed_action")
    .eq("id", approvalId)
    .single();
  if (approvalError || !approval) throw new Error("Approval not found.");
  if (approval.status !== "pending") throw new Error("Only pending approvals can be edited.");

  const { data: task, error: taskError } = await db
    .from("marketing_tasks")
    .select("id,task_type,content_id,input")
    .eq("id", approval.task_id)
    .single();
  if (taskError || !task) throw new Error("Approval task not found.");
  if (task.task_type !== "social_publish" || !task.content_id) throw new Error("This approval is not editable social content.");

  const now = new Date().toISOString();
  const proposed = asRecord(approval.proposed_action);
  const taskInput = asRecord(task.input);
  const nextProposed = {
    ...proposed,
    text: caption,
    caption,
    content: caption,
    ...(cta ? { cta } : { cta: null }),
    ...(title ? { title } : {}),
    edited_before_approval: true,
    edited_at: now,
  };
  const nextInput = {
    ...taskInput,
    text: caption,
    caption,
    content: caption,
    ...(cta ? { cta } : { cta: null }),
    ...(title ? { title } : {}),
    edited_before_approval: true,
    edited_at: now,
  };

  const { error: contentError } = await db.from("marketing_content").update({
    ...(title ? { title } : {}),
    caption,
    body: caption,
    cta: cta || null,
    updated_at: now,
  }).eq("id", task.content_id);
  if (contentError) throw new Error(`[edit social content] ${contentError.message}`);

  const { error: approvalUpdateError } = await db.from("marketing_approvals").update({
    proposed_action: nextProposed,
    updated_at: now,
  }).eq("id", approvalId).eq("status", "pending");
  if (approvalUpdateError) throw new Error(`[edit social approval] ${approvalUpdateError.message}`);

  const { error: taskUpdateError } = await db.from("marketing_tasks").update({ input: nextInput, updated_at: now }).eq("id", task.id);
  if (taskUpdateError) throw new Error(`[edit social task] ${taskUpdateError.message}`);

  await db.from("marketing_agent_activity").insert({
    task_id: task.id,
    action: "approval_content_edited",
    reason: "Social content edited by CEO before approval.",
    channel: "social",
    approval_status: "pending",
    result: { approval_id: approvalId, content_id: task.content_id, edited_by: user.id },
  });

  for (const path of [
    "/admin/marketing/approvals",
    `/admin/marketing/approvals/social/${approvalId}`,
    "/admin/marketing/content",
    "/admin/marketing/social",
    "/admin/marketing/activity",
  ]) revalidatePath(path);

  redirect(`/admin/marketing/approvals/social/${approvalId}?lang=${lang}&edited=1`);
}
