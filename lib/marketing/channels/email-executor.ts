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

function riyadhDayWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const startMs = Date.parse(`${value("year")}-${value("month")}-${value("day")}T00:00:00+03:00`);
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(startMs + 24 * 60 * 60 * 1000).toISOString(),
  };
}

async function assertDailyEmailLimit(limit: number) {
  const db = createAdminClient();
  const window = riyadhDayWindow();
  const { count, error } = await db.from("marketing_channel_jobs")
    .select("id", { count: "exact", head: true })
    .eq("channel", "email")
    .eq("status", "published")
    .gte("published_at", window.start)
    .lt("published_at", window.end);
  if (error) throw new Error("Email execution blocked: daily_limit_check_failed.");
  if ((count ?? 0) >= limit) throw new Error("Email execution blocked: daily_email_limit_reached.");
}

async function resolveSupportSubject(payload: Record<string, unknown>) {
  const explicit = stringValue(payload.subject);
  if (explicit) return explicit;
  if (payload.kind !== "external_reply") return null;

  const sourceReference = stringValue(payload.source_reference);
  const ticketNumber = sourceReference?.startsWith("support-ticket:")
    ? sourceReference.slice("support-ticket:".length).trim()
    : null;
  if (!ticketNumber) return "رد من فريق ملامح";

  const db = createAdminClient();
  const { data } = await db.from("support_tickets")
    .select("subject")
    .eq("ticket_number", ticketNumber)
    .maybeSingle();
  const ticketSubject = stringValue(data?.subject);
  return ticketSubject ? `رد: ${ticketSubject}` : "رد من فريق ملامح";
}

async function markSupportReplySent(payload: Record<string, unknown>, sentAt: string) {
  if (payload.kind !== "external_reply") return;
  const sourceReference = stringValue(payload.source_reference);
  const ticketNumber = sourceReference?.startsWith("support-ticket:")
    ? sourceReference.slice("support-ticket:".length).trim()
    : null;
  if (!ticketNumber) return;

  const db = createAdminClient();
  await db.from("support_tickets").update({
    status: "in_progress",
    first_response_at: sentAt,
    updated_at: sentAt,
  }).eq("ticket_number", ticketNumber).is("first_response_at", null);
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
  const hasOutreachId = Number.isInteger(outreachId) && outreachId > 0;
  const recipient = objectValue(payload.recipient);
  const recipientEmail = stringValue(recipient.email);
  const text = stringValue(payload.text) ?? stringValue(payload.content);
  const subject = await resolveSupportSubject(payload);
  const supportedKind = payload.kind === "outreach_email" || payload.kind === "external_reply";
  if (!supportedKind || !recipientEmail || !text || !subject || (payload.kind === "outreach_email" && !hasOutreachId)) {
    const message = "Email job payload is incomplete.";
    await db.from("marketing_channel_jobs").update({ status: "failed", retry_count: job.retry_count + 1, last_error: message, updated_at: new Date().toISOString() }).eq("id", job.id);
    throw new Error(message);
  }

  const executionSettings = await getExternalExecutionSettings();
  const emailProductionEnabled = executionSettings.productionEnabled && executionSettings.productionChannels.includes("email");
  const controlledExecution = evaluateControlledExecution({
    channel: "email",
    productionEnabled: emailProductionEnabled,
    testModeRequested: payload.test_mode === true,
    testMode: executionSettings.testMode,
    recipientEmail,
  });
  if (!controlledExecution.allowed) throw new Error(`Email execution blocked: ${controlledExecution.reason}.`);
  if (controlledExecution.mode === "production") await assertDailyEmailLimit(executionSettings.dailyEmailLimit);

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
        outreach_id: hasOutreachId ? outreachId : undefined,
        lead_id: payload.lead_id,
        source_reference: payload.source_reference,
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
    if (hasOutreachId) {
      await db.from("marketing_outreach").update({ send_status: "sent", updated_at: now }).eq("id", outreachId);
    }
    await markSupportReplySent(payload, now);
    if (controlledExecution.mode === "production" && Number.isInteger(Number(payload.lead_id)) && Number(payload.lead_id) > 0) {
      await db.from("marketing_leads").update({ stage: "contacted", last_contact_at: now, updated_at: now }).eq("id", Number(payload.lead_id)).eq("stage", "new");
    }
    return result;
  } catch (executionError) {
    const message = sanitizeZohoError(executionError);
    const now = new Date().toISOString();
    await db.from("marketing_channel_jobs").update({ status: "failed", retry_count: job.retry_count + 1, last_error: message, updated_at: now }).eq("id", job.id).neq("status", "published");
    if (hasOutreachId) {
      await db.from("marketing_outreach").update({ send_status: "failed", updated_at: now }).eq("id", outreachId);
    }
    throw new Error(message);
  }
}
