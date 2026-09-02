import { createAdminClient } from "@/lib/supabase/admin";

import { executeMarketingChannelJob } from "./executor";
import { executeMarketingEmailJob } from "./email-executor";

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function externalExecutionEnabled() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_settings")
    .select("value")
    .eq("key", "external_execution_enabled")
    .maybeSingle();
  if (error || !data) return false;
  return asRecord(data.value).enabled === true;
}

type ChannelJob = {
  id: number;
  channel: string;
  status: string;
  scheduled_at: string | null;
};

export async function runGovernedChannelWorker({ maxJobs = 2 }: { maxJobs?: number } = {}) {
  if (!(await externalExecutionEnabled())) {
    return { enabled: false, executed: [], skipped: [] };
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_channel_jobs")
    .select("id,channel,status,scheduled_at")
    .in("status", ["approved", "scheduled"])
    .order("created_at", { ascending: true })
    .limit(Math.max(1, Math.min(maxJobs, 5)));

  if (error) throw new Error(`[marketing_channel_worker.read] ${error.message}`);

  const executed: Array<{ id: number; channel: string; status: string }> = [];
  const skipped: Array<{ id: number; channel: string; reason: string }> = [];

  for (const row of (data ?? []) as ChannelJob[]) {
    try {
      if (row.channel === "email") {
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

  return { enabled: true, executed, skipped };
}
