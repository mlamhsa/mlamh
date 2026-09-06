"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeHumanText(value: string) {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? normalizeHumanText(value) : "";
}

function revalidate() {
  for (const path of ["/admin/marketing/approvals", "/admin/marketing/approvals/editable", "/admin/marketing/outreach", "/admin/marketing/activity", "/admin/marketing/tasks"]) revalidatePath(path);
}

export async function saveEditableApprovalMessageAction(formData: FormData) {
  const user = await requireMarketingAdminAccess("marketing.approve");
  const approvalId = Number(formData.get("approval_id"));
  if (!Number.isInteger(approvalId) || approvalId <= 0) throw new Error("Invalid approval id.");

  const db = createAdminClient();
  const { data: approval, error: approvalError } = await db.from("marketing_approvals")
    .select("id,task_id,status,proposed_action")
    .eq("id", approvalId)
    .single();
  if (approvalError || !approval || approval.status !== "pending") throw new Error("Only pending approvals can be edited.");

  const { data: task, error: taskError } = await db.from("marketing_tasks")
    .select("id,task_type,input,lead_id,channel")
    .eq("id", approval.task_id)
    .single();
  if (taskError || !task) throw new Error("Approval task not found.");

  const proposed = record(approval.proposed_action);
  const taskInput = record(task.input);
  const now = new Date().toISOString();

  if (task.task_type === "first_outreach") {
    const message = text(formData.get("message"));
    const subject = text(formData.get("subject"));
    if (!message) throw new Error("Outreach message is required.");
    if (task.channel === "email" && !subject) throw new Error("Email subject is required.");

    const outreachId = Number(taskInput.outreach_id);
    const nextInput = { ...taskInput, message, ...(task.channel === "email" ? { subject } : {}) };
    const nextProposed = { ...proposed, message, ...(task.channel === "email" ? { subject } : {}) };

    const { error: taskUpdateError } = await db.from("marketing_tasks").update({ input: nextInput, updated_at: now }).eq("id", task.id);
    if (taskUpdateError) throw new Error(`[edit approval task] ${taskUpdateError.message}`);
    const { error: approvalUpdateError } = await db.from("marketing_approvals").update({ proposed_action: nextProposed, updated_at: now }).eq("id", approval.id).eq("status", "pending");
    if (approvalUpdateError) throw new Error(`[edit approval] ${approvalUpdateError.message}`);

    if (Number.isInteger(outreachId) && outreachId > 0) {
      const { data: outreach } = await db.from("marketing_outreach").select("personalization").eq("id", outreachId).maybeSingle();
      const personalization = record(outreach?.personalization);
      const { error: outreachError } = await db.from("marketing_outreach").update({
        personalization: { ...personalization, message, ...(task.channel === "email" ? { subject } : {}) },
        updated_at: now,
      }).eq("id", outreachId);
      if (outreachError) throw new Error(`[edit outreach approval] ${outreachError.message}`);
    }

    await db.from("marketing_agent_activity").insert({
      agent_id: task.task_type === "first_outreach" ? "layan" : null,
      task_id: task.id,
      action: "approval_message_edited",
      reason: "Human edited outreach copy before approval",
      channel: task.channel ?? "internal",
      approval_status: "pending",
      result: { approval_id: approval.id, edited_by: user.id, content_type: "outreach" },
    });
    revalidate();
    return;
  }

  if (proposed.kind === "external_reply") {
    const executiveSummary = text(formData.get("executive_summary"));
    const emailDraft = text(formData.get("email_draft"));
    const whatsappDraft = text(formData.get("whatsapp_draft"));
    if (!emailDraft && !whatsappDraft) throw new Error("At least one reply draft is required.");

    const channelDrafts = {
      ...(emailDraft ? { email: emailDraft } : {}),
      ...(whatsappDraft ? { whatsapp: whatsappDraft } : {}),
    };
    const nextProposed = {
      ...proposed,
      ...(executiveSummary ? { executive_summary: executiveSummary } : {}),
      channel_drafts: channelDrafts,
      external_execution: false,
    };
    const { error } = await db.from("marketing_approvals").update({ proposed_action: nextProposed, updated_at: now }).eq("id", approval.id).eq("status", "pending");
    if (error) throw new Error(`[edit external reply approval] ${error.message}`);

    await db.from("marketing_agent_activity").insert({
      task_id: task.id,
      action: "approval_message_edited",
      reason: "Human edited external reply before approval",
      channel: task.channel ?? "internal",
      approval_status: "pending",
      result: { approval_id: approval.id, edited_by: user.id, content_type: "external_reply" },
    });
    revalidate();
    return;
  }

  throw new Error("This approval does not contain editable human-facing copy.");
}
