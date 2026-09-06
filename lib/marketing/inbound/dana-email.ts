import { getMarketingAIProvider } from "@/lib/marketing/ai/provider";
import { createMarketingTask } from "@/lib/marketing/tasks/service";
import { createAdminClient } from "@/lib/supabase/admin";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function bool(value: unknown) {
  return value === true;
}

async function recentConversationContext(conversationId: number) {
  const db = createAdminClient();
  const { data: conversation } = await db
    .from("marketing_conversations")
    .select("id,channel,contact_id,lead_id,status,stage,priority,tags,metadata")
    .eq("id", conversationId)
    .maybeSingle();
  const { data: messages } = await db
    .from("marketing_messages")
    .select("id,direction,sender,content,message_type,external_message_id,received_at,sent_at,metadata,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(8);
  const { data: lead } = conversation?.lead_id
    ? await db.from("marketing_leads")
      .select("id,organization,stage,demand_signal,opportunity_type,city,brief_status,notes,metadata")
      .eq("id", conversation.lead_id)
      .maybeSingle()
    : { data: null };
  return {
    conversation,
    lead,
    messages: (messages ?? []).reverse(),
  };
}

async function createReplyApproval({
  taskId,
  conversationId,
  leadId,
  input,
  analysis,
}: {
  taskId: number;
  conversationId: number;
  leadId: number | null;
  input: Record<string, unknown>;
  analysis: Record<string, unknown>;
}) {
  const sender = record(input.sender);
  const recipientEmail = text(sender.email);
  const recipientName = text(sender.name);
  const replyDraft = text(analysis.reply_draft);
  if (!recipientEmail || !replyDraft) return { approvalTaskId: null, skipped: "missing_reply_draft_or_recipient" };

  const requiresCeo = bool(analysis.requires_ceo);
  const sourceReference = text(input.support_ticket_id)
    ? `support-ticket-id:${text(input.support_ticket_id)}`
    : `zoho-message:${text(input.zoho_message_id) ?? "unknown"}`;
  const approvalTask = await createMarketingTask({
    agentId: "dana",
    taskType: requiresCeo ? "commercial_commitment" : "external_message",
    title: `Reply review · ${text(input.subject) ?? recipientEmail}`,
    objective: requiresCeo
      ? "CEO review is required before any external reply because Dana detected a pricing, partnership, legal, guarantee, spend, discount, or commercial commitment signal."
      : "Review Dana's contextual reply before external email delivery.",
    priority: requiresCeo ? "urgent" : "high",
    channel: "email",
    approvalLevel: requiresCeo ? "ceo_only" : "approval_required",
    source: "autonomous_materializer",
    parentTaskId: taskId,
    leadId,
    conversationId,
    input: {
      kind: "external_reply",
      recipient: { name: recipientName, email: recipientEmail },
      content: replyDraft,
      channel_drafts: { email: replyDraft },
      delivery_channels: ["email"],
      subject: text(input.subject),
      source_channel: "email",
      source_reference: sourceReference,
      zoho_message_id: text(input.zoho_message_id),
      reply_to_zoho_message_id: text(input.zoho_message_id),
      internet_message_id: text(input.internet_message_id),
      executive_summary: text(analysis.executive_summary),
      intent: text(analysis.intent),
      updated_requirements: record(analysis.updated_requirements),
      follow_up_needed: analysis.follow_up_needed === true,
      client_language: text(analysis.client_language) ?? "ar",
      sender_identity: "MLAMH Team | Partnerships & Casting",
      external_execution: false,
    },
    metadata: {
      source_task_id: taskId,
      inbound_email: true,
      provider: "zoho_mail",
      requires_ceo: requiresCeo,
    },
    idempotencyKey: `dana-inbound-reply-approval:${text(input.zoho_message_id) ?? taskId}`,
    maxRetries: 0,
  });
  return { approvalTaskId: approvalTask.id as number, skipped: null };
}

export async function processDanaInboundEmailTask(taskId: number) {
  const db = createAdminClient();
  const { data: task, error } = await db
    .from("marketing_tasks")
    .select("id,agent_id,task_type,title,objective,input,lead_id,conversation_id,status,retry_count,max_retries")
    .eq("id", taskId)
    .maybeSingle();
  if (error || !task) throw new Error("Inbound Dana task not found.");
  if (task.task_type !== "inbound_email_reply" || !task.conversation_id) return { taskId, status: "ignored" as const };
  if (task.status === "completed") return { taskId, status: "completed" as const };
  if (task.status !== "queued") return { taskId, status: "not_runnable" as const };

  const startedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await db
    .from("marketing_tasks")
    .update({ status: "running", started_at: startedAt, locked_at: startedAt, locked_by: "zoho-inbound-dana", updated_at: startedAt })
    .eq("id", task.id)
    .eq("status", "queued")
    .is("locked_at", null)
    .select("id")
    .maybeSingle();
  if (claimError) throw new Error(`[dana_inbound.claim] ${claimError.message}`);
  if (!claimed) return { taskId, status: "not_claimed" as const };

  try {
    await db.from("marketing_agents").update({ status: "working", current_task_id: task.id, updated_at: startedAt }).eq("id", "dana");
    const context = await recentConversationContext(task.conversation_id);
    const provider = getMarketingAIProvider();
    const response = await provider.generate({
      taskType: "inbound_email_reply",
      responseFormat: "json",
      messages: [
        {
          role: "system",
          content: "You are Dana, MLAMH's inbound commercial and client-response operator. Read the supplied inbound email together with the existing MLAMH conversation and lead context. Never invent facts, talent availability, prices, dates, commitments, relationships, or actions. Preserve the customer's language. Extract only changes actually stated by the customer. Draft a concise, professional response that advances the conversation. If the message involves pricing, discounts, partnership terms, contracts, legal matters, guarantees, ad spend, sponsorship, or a binding commercial commitment, set requires_ceo=true and do not make or accept the commitment in the draft. Return JSON only with: executive_summary, intent, client_language, updated_requirements, observed_facts, missing_information, reply_draft, requires_ceo, follow_up_needed, recommended_next_action. Never claim the reply was sent.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: {
              title: task.title,
              objective: task.objective,
              inbound: task.input ?? {},
            },
            live_mlamh_context: context,
          }),
        },
      ],
      metadata: { task_id: task.id, agent_id: "dana", conversation_id: task.conversation_id },
    });

    let parsed: Record<string, unknown> = {};
    try { parsed = record(JSON.parse(response.content)); } catch { parsed = { executive_summary: response.content }; }
    const materialized = await createReplyApproval({
      taskId: task.id,
      conversationId: task.conversation_id,
      leadId: task.lead_id ?? null,
      input: record(task.input),
      analysis: parsed,
    });

    const now = new Date().toISOString();
    const { error: completionError } = await db.from("marketing_tasks").update({
      status: "completed",
      output: {
        value: parsed,
        provider: response.provider,
        model: response.model ?? null,
        usage: response.usage ?? {},
        provider_metadata: response.metadata ?? {},
        grounded_at: now,
        materialized,
      },
      completed_at: now,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    }).eq("id", task.id).eq("status", "running");
    if (completionError) throw new Error(`[dana_inbound.complete] ${completionError.message}`);

    const { data: agent } = await db.from("marketing_agents").select("tasks_completed").eq("id", "dana").maybeSingle();
    await db.from("marketing_agents").update({
      status: materialized.approvalTaskId ? "waiting_approval" : "idle",
      current_task_id: materialized.approvalTaskId,
      last_action_at: now,
      tasks_completed: (agent?.tasks_completed ?? 0) + 1,
      updated_at: now,
    }).eq("id", "dana");

    await db.from("marketing_agent_activity").insert({
      agent_id: "dana",
      task_id: task.id,
      action: "inbound_reply_analyzed",
      reason: "Dana analyzed the inbound Zoho email and prepared the next governed action.",
      channel: "email",
      result: {
        conversation_id: task.conversation_id,
        approval_task_id: materialized.approvalTaskId,
        requires_ceo: bool(parsed.requires_ceo),
        provider: response.provider,
        model: response.model ?? null,
      },
    });

    return { taskId, status: "completed" as const, approvalTaskId: materialized.approvalTaskId };
  } catch (runError) {
    const message = runError instanceof Error ? runError.message : "Inbound Dana processing failed.";
    const now = new Date().toISOString();
    const nextRetry = task.retry_count + 1;
    const terminal = nextRetry > task.max_retries;
    await db.from("marketing_tasks").update({
      status: terminal ? "failed" : "queued",
      retry_count: nextRetry,
      failed_at: terminal ? now : null,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    }).eq("id", task.id).eq("status", "running");
    await db.from("marketing_agents").update({ status: terminal ? "error" : "idle", current_task_id: null, updated_at: now }).eq("id", "dana");
    await db.from("marketing_agent_activity").insert({
      agent_id: "dana",
      task_id: task.id,
      action: terminal ? "inbound_reply_failed" : "inbound_reply_retry_queued",
      reason: task.objective ?? task.title,
      channel: "email",
      error: message,
      result: { retry_count: nextRetry, max_retries: task.max_retries },
    });
    return { taskId, status: terminal ? "failed" as const : "retry_queued" as const, error: message };
  }
}
