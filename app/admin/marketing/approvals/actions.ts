"use server";

import { revalidatePath } from "next/cache";
import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { getMarketingChannelAdapter } from "@/lib/marketing/channels/adapters";
import { buildEmailOutreachIdempotencyKey } from "@/lib/marketing/channels/email-executor";
import { createAdminClient } from "@/lib/supabase/admin";

type ApprovalDecision = "approved" | "rejected" | "cancelled" | "scheduled";
type TaskRow = { id: number; task_type: string; content_id: number | null; campaign_id: number | null; lead_id: number | null; channel: string | null; input: unknown };

function revalidateMarketingApprovalViews() {
  for (const path of ["/admin/marketing/approvals", "/admin/marketing/tasks", "/admin/marketing/activity", "/admin/marketing/content", "/admin/marketing/social", "/admin/marketing/campaigns", "/admin/marketing/outreach"]) revalidatePath(path);
}

function toRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isExternalReply(value: unknown) { return toRecord(value).kind === "external_reply"; }

function selectedReplyChannels(formData: FormData) {
  return [...new Set(formData.getAll("delivery_channels").map(String).filter((value) => value === "email" || value === "whatsapp"))];
}

async function assertReplyChannelsReady(channels: string[]) {
  if (channels.length === 0) throw new Error("Connect at least one delivery channel before approving this reply.");
  for (const channel of channels) {
    const adapter = getMarketingChannelAdapter(channel);
    if (!adapter?.sendMessage) throw new Error(`Channel ${channel} is not configured for outbound messages.`);
    const status = await adapter.getStatus();
    if (status !== "connected") throw new Error(`Channel ${channel} is ${status}, not connected.`);
  }
}

function enrichExternalReplyAction(formData: FormData, proposedAction: unknown, channels: string[]) {
  const action = toRecord(proposedAction);
  if (!isExternalReply(action)) return action;
  const emailDraft = String(formData.get("email_draft") ?? "").trim();
  const whatsappDraft = String(formData.get("whatsapp_draft") ?? "").trim();
  const executiveSummary = String(formData.get("executive_summary") ?? "").trim();
  const clientLanguage = String(formData.get("client_language") ?? "").trim();
  const channelDrafts = {
    ...(emailDraft ? { email: emailDraft } : {}),
    ...(whatsappDraft ? { whatsapp: whatsappDraft } : {}),
  };
  return {
    ...action,
    ...(executiveSummary ? { executive_summary: executiveSummary } : {}),
    ...(clientLanguage === "ar" || clientLanguage === "en" ? { client_language: clientLanguage } : {}),
    delivery_channels: channels,
    channel_drafts: channelDrafts,
    external_execution: false,
  };
}

async function applyExternalReplySideEffect({ approvalId, task, proposedAction, decision, executeAfter }: { approvalId: number; task: TaskRow; proposedAction: unknown; decision: ApprovalDecision; executeAfter: string | null }) {
  const db = createAdminClient();
  const action = toRecord(proposedAction);
  const now = new Date().toISOString();
  const channels = Array.isArray(action.delivery_channels)
    ? action.delivery_channels.filter((value): value is string => value === "email" || value === "whatsapp")
    : [];
  const drafts = toRecord(action.channel_drafts);

  if (decision === "approved" || decision === "scheduled") {
    for (const channel of channels) {
      const channelContent = typeof drafts[channel] === "string" && String(drafts[channel]).trim()
        ? String(drafts[channel]).trim()
        : typeof action.content === "string" ? action.content : "";
      const payload = { ...action, channel, content: channelContent, text: channelContent, external_execution: false };
      const { error } = await db.from("marketing_channel_jobs").upsert({
        content_id: null,
        task_id: task.id,
        approval_id: approvalId,
        channel,
        status: decision === "scheduled" ? "scheduled" : "approved",
        scheduled_at: decision === "scheduled" ? executeAfter : null,
        idempotency_key: `approval-${approvalId}-external-reply-${channel}`,
        payload,
        result: {},
        updated_at: now,
      }, { onConflict: "idempotency_key" });
      if (error) throw new Error(`[external reply job:${channel}] ${error.message}`);
    }
    return;
  }

  const { error } = await db.from("marketing_channel_jobs").update({ status: "cancelled", updated_at: now })
    .eq("approval_id", approvalId)
    .in("status", ["draft", "waiting_approval", "approved", "scheduled", "failed"]);
  if (error) throw new Error(`[external reply job cancel] ${error.message}`);
}

async function applyApprovalSideEffects({ approvalId, task, proposedAction, decision, executeAfter }: { approvalId: number; task: TaskRow; proposedAction: unknown; decision: ApprovalDecision; executeAfter: string | null }) {
  const db = createAdminClient();
  const input = toRecord(task.input);
  const now = new Date().toISOString();

  if (isExternalReply(proposedAction)) {
    await applyExternalReplySideEffect({ approvalId, task, proposedAction, decision, executeAfter });
    return;
  }

  if (task.task_type === "social_publish" && task.content_id) {
    if (decision === "approved" || decision === "scheduled") {
      const channel = task.channel ?? (typeof input.channel === "string" ? input.channel : null);
      const target = typeof input.target === "string" ? input.target : null;
      if (!channel) throw new Error("Publishing provider is required.");
      if (channel === "buffer" && target !== "instagram" && target !== "facebook") throw new Error("Buffer publishing target is required.");
      const idempotencyKey = `task-${task.id}-${channel}-${target ?? "default"}`;
      const { error: jobError } = await db.from("marketing_channel_jobs").upsert({ content_id: task.content_id, task_id: task.id, approval_id: approvalId, channel, status: decision === "scheduled" ? "scheduled" : "approved", scheduled_at: decision === "scheduled" ? executeAfter : null, idempotency_key: idempotencyKey, payload: input, updated_at: now }, { onConflict: "idempotency_key" });
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
      const channel = task.channel ?? (typeof input.channel === "string" ? input.channel : null);

      if (channel === "email" && (decision === "approved" || decision === "scheduled")) {
        const recipientEmail = typeof input.recipient_email === "string" ? input.recipient_email.trim() : "";
        const subject = typeof input.subject === "string" ? input.subject.trim() : "";
        const text = typeof input.message === "string" ? input.message.trim() : "";
        if (!recipientEmail || !subject || !text) throw new Error("Approved email outreach is missing recipient, subject, or message.");
        if (decision === "scheduled" && !executeAfter) throw new Error("Scheduled email outreach requires an execution time.");

        const idempotencyKey = buildEmailOutreachIdempotencyKey(outreachId);
        const { error: emailJobError } = await db.from("marketing_channel_jobs").upsert({
          content_id: null,
          task_id: task.id,
          approval_id: approvalId,
          channel: "email",
          status: decision === "scheduled" ? "scheduled" : "approved",
          scheduled_at: decision === "scheduled" ? executeAfter : null,
          idempotency_key: idempotencyKey,
          payload: { kind: "outreach_email", outreach_id: outreachId, lead_id: task.lead_id, recipient: { email: recipientEmail }, subject, text },
          result: {},
          updated_at: now,
        }, { onConflict: "idempotency_key" });
        if (emailJobError) throw new Error(`[approval email channel job] ${emailJobError.message}`);
      }

      if (channel === "email" && (decision === "rejected" || decision === "cancelled")) {
        await db.from("marketing_channel_jobs").update({ status: "cancelled", updated_at: now }).eq("idempotency_key", buildEmailOutreachIdempotencyKey(outreachId)).in("status", ["draft", "waiting_approval", "approved", "scheduled", "failed"]);
      }
    }
  }
}

async function decideApproval(formData: FormData, decision: ApprovalDecision) {
  const user = await requireMarketingAdminAccess("marketing.approve");
  const approvalId = Number(formData.get("approval_id"));
  if (!Number.isInteger(approvalId) || approvalId <= 0) throw new Error("Invalid approval id.");
  const db = createAdminClient();
  const { data: approval, error: readError } = await db.from("marketing_approvals").select("id,task_id,status,approval_level,channel,proposed_action").eq("id", approvalId).single();
  if (readError || !approval) throw new Error("Approval not found.");
  if (approval.status !== "pending") throw new Error("Approval is no longer pending.");
  const { data: task, error: taskReadError } = await db.from("marketing_tasks").select("id,task_type,content_id,campaign_id,lead_id,channel,input").eq("id", approval.task_id).single();
  if (taskReadError || !task) throw new Error("Approval task not found.");

  const decisionNote = String(formData.get("decision_note") ?? "").trim() || null;
  const executeAfterRaw = String(formData.get("execute_after") ?? "").trim();
  const executeAfter = decision === "scheduled" && executeAfterRaw ? new Date(executeAfterRaw).toISOString() : null;
  if (decision === "scheduled" && !executeAfter) throw new Error("A schedule time is required.");
  const externalReply = isExternalReply(approval.proposed_action);
  const channels = externalReply && (decision === "approved" || decision === "scheduled") ? selectedReplyChannels(formData) : [];
  if (externalReply && (decision === "approved" || decision === "scheduled")) await assertReplyChannelsReady(channels);
  const proposedAction = externalReply ? enrichExternalReplyAction(formData, approval.proposed_action, channels) : approval.proposed_action;
  const now = new Date().toISOString();
  const { error: approvalError } = await db.from("marketing_approvals").update({ status: decision, proposed_action: proposedAction, decision_by_user_id: user.id, decision_note: decisionNote, decided_at: decision === "scheduled" ? null : now, execute_after: executeAfter, updated_at: now }).eq("id", approvalId).eq("status", "pending");
  if (approvalError) throw new Error(`[approval decision] ${approvalError.message}`);

  if (!externalReply) {
    const taskPatch = decision === "approved" ? { approval_status: "approved", status: "queued", scheduled_at: null, updated_at: now } : decision === "scheduled" ? { approval_status: "approved", status: "scheduled", scheduled_at: executeAfter, updated_at: now } : decision === "rejected" ? { approval_status: "rejected", status: "cancelled", updated_at: now } : { approval_status: "cancelled", status: "cancelled", updated_at: now };
    const { error: taskError } = await db.from("marketing_tasks").update(taskPatch).eq("id", approval.task_id);
    if (taskError) throw new Error(`[approval task update] ${taskError.message}`);
  }

  await applyApprovalSideEffects({ approvalId, task: task as TaskRow, proposedAction, decision, executeAfter });
  await db.from("marketing_agent_activity").insert({ task_id: approval.task_id, action: `approval_${decision}`, reason: decisionNote, channel: approval.channel ?? "internal", approval_status: decision, result: { approval_id: approvalId, decided_by: user.id, auto_execute: false, external_reply: externalReply, delivery_channels: externalReply ? toRecord(proposedAction).delivery_channels : undefined } });
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
