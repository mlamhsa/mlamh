import { createAdminClient } from "@/lib/supabase/admin";
import { getMarketingChannelAdapter } from "./adapters";

function safeExecutionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Channel execution failed.";
  if (/token|bearer|authorization|api[_ -]?key|secret/i.test(message)) return "Channel provider authentication or configuration failed.";
  return message.slice(0, 500);
}

async function assertExternalExecutionEnabled() {
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_settings").select("value").eq("key", "external_execution_enabled").maybeSingle();
  if (error || !data) throw new Error("External execution gate is not configured.");
  const value = data.value as { enabled?: unknown } | null;
  if (!value || value.enabled !== true) throw new Error("External Marketing Hub execution is disabled.");
}

export async function executeMarketingChannelJob(jobId: number, mode: "publish_now" | "schedule" = "publish_now") {
  const db = createAdminClient();
  const { data: job, error } = await db
    .from("marketing_channel_jobs")
    .select("id,content_id,task_id,approval_id,channel,status,scheduled_at,payload,retry_count,idempotency_key,external_post_id")
    .eq("id", jobId)
    .single();

  if (error || !job) throw new Error("Marketing channel job not found.");
  if (!job.approval_id) throw new Error("Channel job cannot execute without an approval.");
  if (!job.idempotency_key) throw new Error("Channel job cannot execute without an idempotency key.");
  if (job.status === "published" || job.external_post_id) {
    return { ok: true, externalId: job.external_post_id ?? undefined, metadata: { duplicate_prevented: true } };
  }
  if (!["approved", "scheduled", "failed"].includes(job.status)) throw new Error(`Channel job is not executable from status ${job.status}.`);

  const { data: approval, error: approvalError } = await db
    .from("marketing_approvals")
    .select("id,status,task_id")
    .eq("id", job.approval_id)
    .single();
  if (approvalError || !approval || approval.task_id !== job.task_id || !["approved", "scheduled"].includes(approval.status)) {
    throw new Error("Required approval is not valid for execution.");
  }
  if (mode === "schedule" && (!job.scheduled_at || approval.status !== "scheduled")) {
    throw new Error("Scheduled execution requires a scheduled approval and execution time.");
  }
  if (mode === "publish_now" && approval.status !== "approved") {
    throw new Error("Publish now requires an approved approval.");
  }

  await assertExternalExecutionEnabled();

  const adapter = getMarketingChannelAdapter(job.channel);
  if (!adapter?.publish) throw new Error(`No publishing adapter configured for ${job.channel}.`);
  const adapterStatus = await adapter.getStatus();
  if (adapterStatus !== "connected") throw new Error(`Channel ${job.channel} is ${adapterStatus}, not connected.`);

  const startedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await db
    .from("marketing_channel_jobs")
    .update({ status: "publishing", started_at: startedAt, updated_at: startedAt })
    .eq("id", job.id)
    .in("status", ["approved", "scheduled", "failed"])
    .is("external_post_id", null)
    .select("id")
    .maybeSingle();
  if (claimError) throw new Error("Channel job could not be claimed for execution.");
  if (!claimed) {
    const { data: latest } = await db.from("marketing_channel_jobs").select("status,external_post_id").eq("id", job.id).single();
    if (latest?.status === "published" || latest?.external_post_id) return { ok: true, externalId: latest.external_post_id ?? undefined, metadata: { duplicate_prevented: true } };
    throw new Error("Channel job is already being executed.");
  }

  try {
    const payload = (job.payload ?? {}) as Record<string, unknown>;
    const target = typeof payload.target === "string" ? payload.target : undefined;
    const result = await adapter.publish({
      contentId: job.content_id,
      text: typeof payload.text === "string" ? payload.text : undefined,
      assetUrls: Array.isArray(payload.asset_urls) ? payload.asset_urls.filter((value): value is string => typeof value === "string") : undefined,
      scheduledAt: mode === "schedule" ? job.scheduled_at : null,
      idempotencyKey: job.idempotency_key,
      target,
      metadata: { target, mode },
    });
    if (!result.ok) throw new Error(result.errorMessage ?? result.errorCode ?? "Channel publish failed.");
    const now = new Date().toISOString();
    await db.from("marketing_channel_jobs").update({ status: "published", published_at: now, external_post_id: result.externalId ?? null, result: result.metadata ?? {}, last_error: null, updated_at: now }).eq("id", job.id);
    await db.from("marketing_content").update({ status: "published", published_at: now, external_post_id: result.externalId ?? null, updated_at: now }).eq("id", job.content_id);
    return result;
  } catch (executionError) {
    const message = safeExecutionError(executionError);
    await db.from("marketing_channel_jobs").update({ status: "failed", retry_count: job.retry_count + 1, last_error: message, updated_at: new Date().toISOString() }).eq("id", job.id);
    throw new Error(message);
  }
}
