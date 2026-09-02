import { createAdminClient } from "@/lib/supabase/admin";

import { getMarketingChannelAdapter } from "./adapters";
import { evaluateControlledExecution, getExternalExecutionSettings } from "./controlled-execution";
import { withMlamhEmailSignature } from "./email-signature";
import { buildEmailOutreachIdempotencyKey, sanitizeZohoError } from "./zoho-mail-core";

export { buildEmailOutreachIdempotencyKey } from "./zoho-mail-core";

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function executeMarketingEmailJob(jobId: number) {
  const db = createAdminClient();
  const { data: job, error } = await db.from("marketing_channel_jobs")
    .select("id,task_id,approval_id,channel,status,scheduled_at,payload,result,retry_count,idempotency_key")
    .eq("id", jobId)
    .single();
  if (error || !job) throw new Error("Marketing email job not found.");
  if (job.channel !== "email") throw new Error("Channel job is not an email job.");
  if (!job.approval_id || !job.task_id) throw new Error("Email execution blocked: missing_approval.");
  if (!job.idempotency_key) throw new Error("Email execution blocked: missing_idempotency_key.");

  const resultState = objectValue(job.result);
  const priorExternalMessageId = stringValue(resultState.external_message_id);
  if (job.status === "published" || priorExternalMessageId) {
    return { ok: true, externalId: priorExternalMessageId ?? undefined, metadata: { duplicate_prevented: true } };
  }
  if (!["approved", "scheduled", "failed"].includes(job.status)) throw new Error("Email execution blocked: invalid_job_status.");

  const { data: approval } = await db.from("marketing_approvals")
    .select("id,status,task_id")
    .eq("id", job.approval_id)
    .maybeSingle();
  const validApproval = Boolean(
    approval &&
    approval.task_id === job.task_id &&
    ((job.status === "scheduled" && approval.status === "scheduled") ||
      (job.status !== "scheduled" && approval.status === "approved")),
  );
  if (!validApproval) throw new Error("Email execution blocked: invalid_approval.");

  if (job.status === "scheduled") {
    const dueAt = job.scheduled_at ? Date.parse(job.scheduled_at) : Number.NaN;
    if (!Number.isFinite(dueAt)) throw new Error("Email execution blocked: invalid_schedule.");
    if (dueAt > Date.now()) throw new Error("Email execution blocked: scheduled_not_due.");
  }

  const payload = objectValue(job.payload);
  const outreachId = Number(payload.outreach_id);
  const recipient = objectValue(payload.recipient);
  const recipientEmail = stringValue(recipient.email);
  const text = stringValue(payload.text);
  const subject = stringValue(payload.subject);
  if (!Number.isInteger(outreachId) || outreachId <= 0 || !recipientEmail || !text || !subject) {
    const message = "Email job payload is incomplete.";
    await db.from("marketing_channel_jobs").update({ status: "failed", retry_count: job.retry_count + 1, last_error: message, updated_at: new Date().toISOString() }).eq("id", job.id);
    throw new Error(message);
  }

  const executionSettings = await getExternalExecutionSettings();
  const controlledExecution = evaluateControlledExecution({
    channel: "email",
    productionEnabled: executionSettings.productionEnabled,
    testModeRequested: payload.test_mode === true,
    testMode: executionSettings.testMode,
    recipientEmail,
  });
  if (!controlledExecution.allowed) throw new Error(`Email execution blocked: ${controlledExecution.reason}.`);

  const adapter = getMarketingChannelAdapter("email");
  if (!adapter?.sendMessage) throw new Error("No email message adapter is configured.");
  const adapterStatus = await adapter.getStatus();
  if (adapterStatus !== "connected") throw new Error(`Email channel is ${adapterStatus}, not connected.`);

  const startedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await db.from("marketing_channel_jobs")
    .update({ status: "publishing", started_at: startedAt, updated_at: startedAt })
    .eq("id", job.id)
    .in("status", ["approved", "scheduled", "failed"])
    .select("id")
    .maybeSingle();
  if (claimError) throw new Error("Email job could not be claimed for execution.");
  if (!claimed) {
    const { data: latest } = await db.from("marketing_channel_jobs").select("status,result").eq("id", job.id).single();
    const latestResult = objectValue(latest?.result);
    const externalMessageId = stringValue(latestResult.external_message_id);
    if (latest?.status === "published" || externalMessageId) {
      return { ok: true, externalId: externalMessageId ?? undefined, metadata: { duplicate_prevented: true } };
    }
    throw new Error("Email job is already being executed. Manual review is required before retrying.");
  }

  try {
    const result = await adapter.sendMessage({
      recipient,
      text: withMlamhEmailSignature(text),
      metadata: {
        subject,
        outreach_id: outreachId,
        lead_id: payload.lead_id,
        idempotency_key: job.idempotency_key,
        signature: "mlamh_official",
        execution_mode: controlledExecution.mode,
      },
    });
    if (!result.ok || !result.externalId) throw new Error(result.errorMessage ?? result.errorCode ?? "Email send failed.");

    const now = new Date().toISOString();
    const persistedResult = {
      ...(result.metadata ?? {}),
      external_message_id: result.externalId,
      provider: "zoho_mail",
      signature: "mlamh_official",
      execution_mode: controlledExecution.mode,
    };
    const { error: jobUpdateError } = await db.from("marketing_channel_jobs").update({
      status: "published",
      published_at: now,
      result: persistedResult,
      last_error: null,
      updated_at: now,
    }).eq("id", job.id);
    if (jobUpdateError) {
      throw new Error("Email was accepted by the provider but the local result could not be persisted. Manual review is required before any retry.");
    }
    await db.from("marketing_outreach").update({ send_status: "sent", updated_at: now }).eq("id", outreachId);
    if (controlledExecution.mode === "production" && Number.isInteger(Number(payload.lead_id)) && Number(payload.lead_id) > 0) {
      await db.from("marketing_leads").update({ stage: "contacted", last_contact_at: now, updated_at: now }).eq("id", Number(payload.lead_id)).eq("stage", "new");
    }
    return result;
  } catch (executionError) {
    const message = sanitizeZohoError(executionError);
    const now = new Date().toISOString();
    await db.from("marketing_channel_jobs").update({ status: "failed", retry_count: job.retry_count + 1, last_error: message, updated_at: now }).eq("id", job.id).neq("status", "published");
    await db.from("marketing_outreach").update({ send_status: "failed", updated_at: now }).eq("id", outreachId);
    throw new Error(message);
  }
}
