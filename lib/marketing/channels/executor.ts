import { createAdminClient } from "@/lib/supabase/admin";
import { getMarketingChannelAdapter } from "./adapters";
import { evaluateChannelExecutionPolicy } from "./execution-policy";

function safeExecutionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Channel execution failed.";
  if (/token|bearer|authorization|api[_ -]?key|secret/i.test(message)) return "Channel provider authentication or configuration failed.";
  return message.slice(0, 500);
}

async function getExternalExecutionEnabled() {
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_settings").select("value").eq("key", "external_execution_enabled").maybeSingle();
  if (error || !data) return false;
  const value = data.value as { enabled?: unknown } | null;
  return value?.enabled === true;
}

export async function executeMarketingChannelJob(jobId: number, mode: "publish_now" | "schedule" = "publish_now") {
  const db = createAdminClient();
  const { data: job, error } = await db.from("marketing_channel_jobs").select("id,content_id,task_id,approval_id,channel,status,scheduled_at,payload,retry_count,idempotency_key,external_post_id").eq("id", jobId).single();
  if (error || !job) throw new Error("Marketing channel job not found.");

  const { data: approval } = job.approval_id
    ? await db.from("marketing_approvals").select("id,status,task_id").eq("id", job.approval_id).maybeSingle()
    : { data: null };
  const externalExecutionEnabled = await getExternalExecutionEnabled();
  const policy = evaluateChannelExecutionPolicy({
    jobStatus: job.status,
    approvalId: job.approval_id,
    approvalStatus: approval?.status ?? null,
    approvalTaskMatches: Boolean(approval && approval.task_id === job.task_id),
    externalExecutionEnabled,
    idempotencyKey: job.idempotency_key,
    externalPostId: job.external_post_id,
    mode,
    scheduledAt: job.scheduled_at,
  });
  if (!policy.allowed) throw new Error(`Channel execution blocked: ${policy.reason}.`);
  if (policy.duplicate) return { ok: true, externalId: job.external_post_id ?? undefined, metadata: { duplicate_prevented: true } };

  const adapter = getMarketingChannelAdapter(job.channel);
  if (!adapter?.publish) throw new Error(`No publishing adapter configured for ${job.channel}.`);
  const adapterStatus = await adapter.getStatus();
  if (adapterStatus !== "connected") throw new Error(`Channel ${job.channel} is ${adapterStatus}, not connected.`);

  const startedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await db.from("marketing_channel_jobs").update({ status: "publishing", started_at: startedAt, updated_at: startedAt }).eq("id", job.id).in("status", ["approved", "scheduled", "failed"]).is("external_post_id", null).select("id").maybeSingle();
  if (claimError) throw new Error("Channel job could not be claimed for execution.");
  if (!claimed) {
    const { data: latest } = await db.from("marketing_channel_jobs").select("status,external_post_id").eq("id", job.id).single();
    if (latest?.status === "published" || latest?.external_post_id) return { ok: true, externalId: latest.external_post_id ?? undefined, metadata: { duplicate_prevented: true } };
    throw new Error("Channel job is already being executed.");
  }

  try {
    const payload = (job.payload ?? {}) as Record<string, unknown>;
    const target = typeof payload.target === "string" ? payload.target : undefined;
    const result = await adapter.publish({ contentId: job.content_id, text: typeof payload.text === "string" ? payload.text : undefined, assetUrls: Array.isArray(payload.asset_urls) ? payload.asset_urls.filter((value): value is string => typeof value === "string") : undefined, scheduledAt: mode === "schedule" ? job.scheduled_at : null, idempotencyKey: job.idempotency_key, target, metadata: { target, mode } });
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
