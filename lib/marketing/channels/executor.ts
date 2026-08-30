import { getMarketingChannelAdapter } from "./adapters";
import { createAdminClient } from "@/lib/supabase/admin";

export async function executeMarketingChannelJob(jobId: number) {
  const db = createAdminClient();
  const { data: job, error } = await db
    .from("marketing_channel_jobs")
    .select("id,content_id,task_id,approval_id,channel,status,payload,retry_count")
    .eq("id", jobId)
    .single();

  if (error || !job) throw new Error("Marketing channel job not found.");
  if (!["approved", "scheduled", "failed"].includes(job.status)) {
    throw new Error(`Channel job is not executable from status ${job.status}.`);
  }

  if (job.approval_id) {
    const { data: approval } = await db
      .from("marketing_approvals")
      .select("status")
      .eq("id", job.approval_id)
      .single();
    if (!approval || !["approved", "scheduled"].includes(approval.status)) {
      throw new Error("Required approval is not valid for execution.");
    }
  }

  const adapter = getMarketingChannelAdapter(job.channel);
  if (!adapter || !adapter.publish) throw new Error(`No publishing adapter configured for ${job.channel}.`);
  const status = await adapter.getStatus();
  if (status !== "connected") throw new Error(`Channel ${job.channel} is ${status}, not connected.`);

  const startedAt = new Date().toISOString();
  await db.from("marketing_channel_jobs").update({ status: "publishing", started_at: startedAt, updated_at: startedAt }).eq("id", job.id);

  try {
    const payload = (job.payload ?? {}) as Record<string, unknown>;
    const result = await adapter.publish({
      contentId: job.content_id,
      text: typeof payload.text === "string" ? payload.text : undefined,
      assetUrls: Array.isArray(payload.asset_urls) ? payload.asset_urls.filter((value): value is string => typeof value === "string") : undefined,
      metadata: payload,
    });

    if (!result.ok) throw new Error(result.errorMessage ?? result.errorCode ?? "Channel publish failed.");
    const now = new Date().toISOString();
    await db.from("marketing_channel_jobs").update({
      status: "published",
      published_at: now,
      external_post_id: result.externalId ?? null,
      result: result.metadata ?? {},
      last_error: null,
      updated_at: now,
    }).eq("id", job.id);

    return result;
  } catch (executionError) {
    const message = executionError instanceof Error ? executionError.message : "Unknown execution error";
    await db.from("marketing_channel_jobs").update({
      status: "failed",
      retry_count: job.retry_count + 1,
      last_error: message,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    throw executionError;
  }
}
