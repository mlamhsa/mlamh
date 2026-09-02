import { createAdminClient } from "@/lib/supabase/admin";

import { getExternalExecutionSettings } from "./controlled-execution";
import { executeMarketingChannelJob } from "./executor";
import { executeMarketingEmailJob } from "./email-executor";

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

type ChannelJob = {
  id: number;
  channel: string;
  status: string;
  scheduled_at: string | null;
  payload: unknown;
};

export async function runGovernedChannelWorker({ maxJobs = 2 }: { maxJobs?: number } = {}) {
  const executionSettings = await getExternalExecutionSettings();
  if (!executionSettings.productionEnabled && !executionSettings.testMode.enabled) {
    return { enabled: false, mode: "disabled", executed: [], skipped: [] };
  }

  const safeMax = Math.max(1, Math.min(maxJobs, 5));
  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_channel_jobs")
    .select("id,channel,status,scheduled_at,payload")
    .in("status", ["approved", "scheduled"])
    .in("channel", ["email", "buffer"])
    .order("created_at", { ascending: true })
    .limit(safeMax * 5);

  if (error) throw new Error(`[marketing_channel_worker.read] ${error.message}`);

  const executed: Array<{ id: number; channel: string; status: string }> = [];
  const skipped: Array<{ id: number; channel: string; reason: string }> = [];

  for (const row of (data ?? []) as ChannelJob[]) {
    if (executed.length >= safeMax) break;

    try {
      const payload = asRecord(row.payload);
      if (!executionSettings.productionEnabled && payload.test_mode !== true) {
        skipped.push({ id: row.id, channel: row.channel, reason: "production_execution_disabled_non_test_job" });
        continue;
      }

      if (row.channel === "email") {
        if (payload.kind !== "outreach_email") {
          skipped.push({ id: row.id, channel: row.channel, reason: "email_job_requires_supported_outreach_payload" });
          continue;
        }
        if (row.status === "scheduled") {
          const dueAt = row.scheduled_at ? Date.parse(row.scheduled_at) : Number.NaN;
          if (!Number.isFinite(dueAt) || dueAt > Date.now()) {
            skipped.push({ id: row.id, channel: row.channel, reason: "scheduled_email_not_due" });
            continue;
          }
        }
        await executeMarketingEmailJob(row.id);
      } else {
        await executeMarketingChannelJob(row.id, row.status === "scheduled" ? "schedule" : "publish_now");
      }

      executed.push({ id: row.id, channel: row.channel, status: row.status });
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 160) : "channel_execution_failed";
      skipped.push({ id: row.id, channel: row.channel, reason });
    }
  }

  return {
    enabled: true,
    mode: executionSettings.productionEnabled ? "production" : "test",
    executed,
    skipped,
  };
}
