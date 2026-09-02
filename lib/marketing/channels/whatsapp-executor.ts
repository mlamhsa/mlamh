import { createAdminClient } from "@/lib/supabase/admin";
import { getMarketingChannelAdapter } from "./adapters";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePhone(value: unknown) {
  const phone = stringValue(value)?.replace(/[^0-9]/g, "") ?? "";
  return phone.length >= 8 && phone.length <= 15 ? phone : null;
}

async function getExternalExecutionEnabled() {
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_settings")
    .select("value")
    .eq("key", "external_execution_enabled")
    .maybeSingle();
  if (error || !data) return false;
  return record(data.value).enabled === true;
}

function safeExecutionError(error: unknown) {
  const message = error instanceof Error ? error.message : "WhatsApp execution failed.";
  if (/token|bearer|authorization|secret/i.test(message)) return "WhatsApp provider authentication or configuration failed.";
  return message.slice(0, 500);
}

export async function executeMarketingWhatsAppJob(jobId: number) {
  const db = createAdminClient();
  const { data: job, error } = await db.from("marketing_channel_jobs")
    .select("id,task_id,approval_id,channel,status,payload,result,retry_count,idempotency_key")
    .eq("id", jobId)
    .single();
  if (error || !job) throw new Error("Marketing WhatsApp job not found.");
  if (job.channel !== "whatsapp") throw new Error("Channel job is not a WhatsApp job.");
  if (!job.approval_id || !job.task_id) throw new Error("WhatsApp execution blocked: missing_approval.");
  if (!job.idempotency_key) throw new Error("WhatsApp execution blocked: missing_idempotency_key.");

  const priorResult = record(job.result);
  const priorExternalMessageId = stringValue(priorResult.external_message_id);
  if (job.status === "published" || priorExternalMessageId) {
    return { ok: true, externalId: priorExternalMessageId ?? undefined, metadata: { duplicate_prevented: true } };
  }
  if (!["approved", "failed"].includes(job.status)) throw new Error("WhatsApp execution blocked: invalid_job_status.");

  const { data: approval } = await db.from("marketing_approvals")
    .select("id,status,task_id")
    .eq("id", job.approval_id)
    .maybeSingle();
  if (!approval || approval.status !== "approved" || approval.task_id !== job.task_id) {
    throw new Error("WhatsApp execution blocked: invalid_approval.");
  }
  if (!(await getExternalExecutionEnabled())) {
    throw new Error("WhatsApp execution blocked: external_execution_disabled.");
  }

  const adapter = getMarketingChannelAdapter("whatsapp");
  if (!adapter?.sendMessage) throw new Error("No WhatsApp message adapter is configured.");
  const adapterStatus = await adapter.getStatus();
  if (adapterStatus !== "connected") throw new Error(`WhatsApp channel is ${adapterStatus}, not connected.`);

  const startedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await db.from("marketing_channel_jobs")
    .update({ status: "publishing", started_at: startedAt, updated_at: startedAt })
    .eq("id", job.id)
    .in("status", ["approved", "failed"])
    .select("id")
    .maybeSingle();
  if (claimError) throw new Error("WhatsApp job could not be claimed for execution.");
  if (!claimed) {
    const { data: latest } = await db.from("marketing_channel_jobs").select("status,result").eq("id", job.id).single();
    const latestResult = record(latest?.result);
    const externalMessageId = stringValue(latestResult.external_message_id);
    if (latest?.status === "published" || externalMessageId) {
      return { ok: true, externalId: externalMessageId ?? undefined, metadata: { duplicate_prevented: true } };
    }
    throw new Error("WhatsApp job is already being executed. Manual review is required before retrying.");
  }

  const payload = record(job.payload);
  const recipient = record(payload.recipient);
  const phone = normalizePhone(recipient.phone ?? recipient.whatsapp ?? recipient.to ?? payload.recipient_phone ?? payload.phone ?? payload.client_phone);
  const text = stringValue(payload.text ?? payload.content);
  if (!phone || !text) {
    const message = "WhatsApp job payload is missing recipient phone or message text.";
    await db.from("marketing_channel_jobs").update({
      status: "failed",
      retry_count: job.retry_count + 1,
      last_error: message,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    throw new Error(message);
  }

  try {
    const result = await adapter.sendMessage({
      recipient: { ...recipient, phone },
      text,
      metadata: {
        idempotency_key: job.idempotency_key,
        approval_id: job.approval_id,
        task_id: job.task_id,
      },
    });
    if (!result.ok || !result.externalId) throw new Error(result.errorMessage ?? result.errorCode ?? "WhatsApp send failed.");

    const now = new Date().toISOString();
    const persistedResult = {
      ...(result.metadata ?? {}),
      external_message_id: result.externalId,
      provider: "meta_whatsapp_cloud_api",
    };
    const { error: persistError } = await db.from("marketing_channel_jobs").update({
      status: "published",
      published_at: now,
      result: persistedResult,
      last_error: null,
      updated_at: now,
    }).eq("id", job.id);
    if (persistError) throw new Error("WhatsApp provider accepted the message but the local result could not be persisted. Manual review is required before any retry.");

    const { data: conversation } = await db.from("marketing_conversations")
      .select("id")
      .eq("channel", "whatsapp")
      .eq("external_thread_id", phone)
      .maybeSingle();
    if (conversation?.id) {
      await db.from("marketing_messages").insert({
        conversation_id: conversation.id,
        direction: "outbound",
        sender: "MLAMH Team",
        content: text,
        message_type: "text",
        external_message_id: result.externalId,
        sent_at: now,
        metadata: { source: "marketing_channel_job", channel_job_id: job.id },
      });
      await db.from("marketing_conversations").update({ last_message_at: now, updated_at: now }).eq("id", conversation.id);
    }

    return result;
  } catch (executionError) {
    const message = safeExecutionError(executionError);
    await db.from("marketing_channel_jobs").update({
      status: "failed",
      retry_count: job.retry_count + 1,
      last_error: message,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id).neq("status", "published");
    throw new Error(message);
  }
}
