import { createAdminClient } from "@/lib/supabase/admin";
import { getMarketingChannelAdapter } from "./adapters";
import { evaluateControlledExecution, getExternalExecutionSettings } from "./controlled-execution";
import { evaluateChannelExecutionPolicy } from "./execution-policy";
import { sanitizeSocialCopy } from "./social-copy";

function safeExecutionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Channel execution failed.";
  if (/token|bearer|authorization|api[_ -]?key|secret/i.test(message)) return "Channel provider authentication or configuration failed.";
  return message.slice(0, 500);
}

function targetRequiresVisual(target: string | undefined, contentType: string | null | undefined) {
  const normalizedTarget = (target ?? "").toLowerCase();
  const normalizedType = (contentType ?? "").toLowerCase();
  if (normalizedTarget === "instagram") return true;
  if (normalizedTarget === "facebook") return ["reel", "story", "carousel", "video"].includes(normalizedType);
  return false;
}

async function assertVisualReadiness(contentId: number | null, target: string | undefined, payloadAssetUrls: string[]) {
  if (!contentId) return;
  const db = createAdminClient();
  const { data: content } = await db.from("marketing_content").select("id,content_type,asset_references").eq("id", contentId).maybeSingle();
  if (!targetRequiresVisual(target, content?.content_type)) return;

  const contentAssets = Array.isArray(content?.asset_references)
    ? content.asset_references.filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    : [];
  if (payloadAssetUrls.length > 0 || contentAssets.length > 0) return;

  const { data: creatives } = await db
    .from("marketing_creatives")
    .select("platform,status,storage_path,preview_path")
    .eq("content_id", contentId);
  const hasReadyCreative = (creatives ?? []).some((creative) => {
    const platform = (creative.platform ?? "").toLowerCase();
    const platformMatches = !platform || platform === target || platform === "buffer" || platform === "social";
    const ready = ["ready", "approved", "published"].includes((creative.status ?? "").toLowerCase());
    const hasAsset = Boolean(creative.storage_path?.trim() || creative.preview_path?.trim());
    return platformMatches && ready && hasAsset;
  });
  if (!hasReadyCreative) {
    throw new Error(`Channel execution blocked: visual_required_for_${target ?? "social"}.`);
  }

  throw new Error(`Channel execution blocked: creative_asset_not_attached_to_job.`);
}

export async function executeMarketingChannelJob(jobId: number, mode: "publish_now" | "schedule" = "publish_now") {
  const db = createAdminClient();
  const { data: job, error } = await db.from("marketing_channel_jobs").select("id,content_id,task_id,approval_id,channel,status,scheduled_at,payload,retry_count,idempotency_key,external_post_id").eq("id", jobId).single();
  if (error || !job) throw new Error("Marketing channel job not found.");

  const payload = (job.payload ?? {}) as Record<string, unknown>;
  const target = typeof payload.target === "string" ? payload.target : undefined;
  const assetUrls = Array.isArray(payload.asset_urls) ? payload.asset_urls.filter((value): value is string => typeof value === "string" && Boolean(value.trim())) : [];
  await assertVisualReadiness(job.content_id, target, assetUrls);

  const executionSettings = await getExternalExecutionSettings();
  const bufferProductionEnabled = executionSettings.productionEnabled && executionSettings.productionChannels.includes("buffer");
  const controlledExecution = job.channel === "buffer"
    ? evaluateControlledExecution({
        channel: "buffer",
        productionEnabled: bufferProductionEnabled,
        testModeRequested: payload.test_mode === true,
        testMode: executionSettings.testMode,
        bufferTarget: target,
      })
    : bufferProductionEnabled
      ? { allowed: true as const, mode: "production" as const }
      : { allowed: false as const, reason: "external_execution_disabled" };

  const { data: approval } = job.approval_id
    ? await db.from("marketing_approvals").select("id,status,task_id").eq("id", job.approval_id).maybeSingle()
    : { data: null };
  const policy = evaluateChannelExecutionPolicy({
    jobStatus: job.status,
    approvalId: job.approval_id,
    approvalStatus: approval?.status ?? null,
    approvalTaskMatches: Boolean(approval && approval.task_id === job.task_id),
    externalExecutionEnabled: controlledExecution.allowed,
    idempotencyKey: job.idempotency_key,
    externalPostId: job.external_post_id,
    mode,
    scheduledAt: job.scheduled_at,
  });
  if (!policy.allowed) {
    const reason = !controlledExecution.allowed && policy.reason === "external_execution_disabled"
      ? controlledExecution.reason
      : policy.reason;
    throw new Error(`Channel execution blocked: ${reason}.`);
  }
  if (policy.duplicate) return { ok: true, externalId: job.external_post_id ?? undefined, metadata: { duplicate_prevented: true } };
  if (!controlledExecution.allowed) throw new Error(`Channel execution blocked: ${controlledExecution.reason}.`);

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
    const result = await adapter.publish({
      contentId: job.content_id,
      text: sanitizeSocialCopy(payload.text),
      assetUrls: assetUrls.length ? assetUrls : undefined,
      scheduledAt: mode === "schedule" ? job.scheduled_at : null,
      idempotencyKey: job.idempotency_key,
      target,
      metadata: { target, mode, execution_mode: controlledExecution.mode },
    });
    if (!result.ok) throw new Error(result.errorMessage ?? result.errorCode ?? "Channel publish failed.");
    const now = new Date().toISOString();
    await db.from("marketing_channel_jobs").update({
      status: "published",
      published_at: now,
      external_post_id: result.externalId ?? null,
      result: { ...(result.metadata ?? {}), execution_mode: controlledExecution.mode },
      last_error: null,
      updated_at: now,
    }).eq("id", job.id);
    if (controlledExecution.mode === "production") {
      await db.from("marketing_content").update({ status: "published", published_at: now, external_post_id: result.externalId ?? null, updated_at: now }).eq("id", job.content_id);
    }
    return result;
  } catch (executionError) {
    const message = safeExecutionError(executionError);
    await db.from("marketing_channel_jobs").update({ status: "failed", retry_count: job.retry_count + 1, last_error: message, updated_at: new Date().toISOString() }).eq("id", job.id);
    throw new Error(message);
  }
}
